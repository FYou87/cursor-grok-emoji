import { inflateRawSync } from 'node:zlib'

const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let crc = n
  for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1)
  CRC_TABLE[n] = crc
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

const LOCAL = 0x04034b50
const CENTRAL = 0x02014b50
const EOCD = 0x06054b50

/**
 * 写入不压缩的 zip。文件名使用相对路径。
 * @param {{ name: string, data: Buffer }[]} files
 */
export function zipStore(files) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8')
    const data = file.data
    const checksum = crc32(data) >>> 0
    const local = Buffer.alloc(30 + name.length)
    local.writeUInt32LE(LOCAL, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt16LE(0, 10)
    local.writeUInt16LE(0, 12)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    name.copy(local, 30)
    locals.push(local, data)

    const central = Buffer.alloc(46 + name.length)
    central.writeUInt32LE(CENTRAL, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(0, 12)
    central.writeUInt16LE(0, 14)
    central.writeUInt32LE(checksum, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt16LE(0, 30)
    central.writeUInt16LE(0, 32)
    central.writeUInt16LE(0, 34)
    central.writeUInt16LE(0, 36)
    central.writeUInt32LE(0, 38)
    central.writeUInt32LE(offset, 42)
    name.copy(central, 46)
    centrals.push(central)
    offset += local.length + data.length
  }

  const centralDirectory = Buffer.concat(centrals)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(EOCD, 0)
  eocd.writeUInt16LE(0, 4)
  eocd.writeUInt16LE(0, 6)
  eocd.writeUInt16LE(files.length, 8)
  eocd.writeUInt16LE(files.length, 10)
  eocd.writeUInt32LE(centralDirectory.length, 12)
  eocd.writeUInt32LE(offset, 16)
  eocd.writeUInt16LE(0, 20)
  return Buffer.concat([...locals, centralDirectory, eocd])
}

/** 读取 zip 中央目录。支持 store 和 deflate。 */
export function listZip(buffer) {
  let eocd = -1
  const min = Math.max(0, buffer.length - 22 - 65535)
  for (let index = buffer.length - 22; index >= min; index -= 1) {
    if (buffer.readUInt32LE(index) === EOCD) {
      eocd = index
      break
    }
  }
  if (eocd < 0) throw new Error('zip 缺少结束目录')
  const count = buffer.readUInt16LE(eocd + 10)
  let cursor = buffer.readUInt32LE(eocd + 16)
  const entries = []
  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(cursor) !== CENTRAL) throw new Error('zip 中央目录损坏')
    const method = buffer.readUInt16LE(cursor + 10)
    const compressedSize = buffer.readUInt32LE(cursor + 20)
    const size = buffer.readUInt32LE(cursor + 24)
    const nameLength = buffer.readUInt16LE(cursor + 28)
    const extra = buffer.readUInt16LE(cursor + 30)
    const comment = buffer.readUInt16LE(cursor + 32)
    const localOffset = buffer.readUInt32LE(cursor + 42)
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength)
    const localNameLength = buffer.readUInt16LE(localOffset + 26)
    const localExtra = buffer.readUInt16LE(localOffset + 28)
    const dataStart = localOffset + 30 + localNameLength + localExtra
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize)
    const data = unzipBytes(method, compressed)
    if (data.length !== size) throw new Error(`${name} 的解压大小不一致`)
    entries.push({ name, size, data: Buffer.from(data) })
    cursor += 46 + nameLength + extra + comment
  }
  return entries
}

function unzipBytes(method, bytes) {
  if (method === 0) return bytes
  if (method === 8) return inflateRawSync(bytes)
  throw new Error(`不支持的 zip 压缩方法 ${method}`)
}

import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { KEYS, KEY_SET, SCHEMA_VERSION } from './keys.mjs'
import { listZip } from './zip.mjs'

export const MAX_PACK_ARCHIVE_BYTES = 20 * 1024 * 1024
export const MAX_PACK_EXTRACTED_BYTES = 80 * 1024 * 1024
export const MAX_PACK_FILE_BYTES = 2 * 1024 * 1024
export const MAX_PACK_IMAGE_DIMENSION = 512
export const PACK_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/
export const PACK_VERSION_PATTERN = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-(?:(?:0|[1-9][0-9]*)|(?:[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))(?:\.(?:(?:0|[1-9][0-9]*)|(?:[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

export class PackError extends Error {
  /**
   * @param {'pack-invalid' | 'pack-too-large'} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message)
    this.name = 'PackError'
    this.code = code
  }
}

/** 校验磁盘上的表情包目录（pack.json + images/<key>.png）。 */
export async function validatePackDir(dir) {
  const manifest = parseManifest(JSON.parse(await readFile(path.join(dir, 'pack.json'), 'utf8')))
  const imageDir = path.join(dir, 'images')
  const filenames = (await readdir(imageDir)).filter(name => name !== '.DS_Store')
  const files = new Map()
  for (const filename of filenames) {
    const data = await readFile(path.join(imageDir, filename))
    const info = await stat(path.join(imageDir, filename))
    if (!info.isFile()) throw new PackError('pack-invalid', `${filename} 不是文件`)
    files.set(`images/${filename}`, data)
  }
  const images = collectImages(files)
  for (const name of files.keys()) {
    if (!images.has(name)) throw new PackError('pack-invalid', `多余文件：${name}`)
  }
  return { manifest, images }
}

/** 校验表情包 zip。允许根目录直接放文件，或外面再包一层目录。 */
export function validatePackZip(buffer) {
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_PACK_ARCHIVE_BYTES) {
    throw new PackError('pack-too-large', 'ZIP 不能为空，且不能超过 20 MiB')
  }
  const entries = listZip(buffer).filter(entry => !ignored(entry.name) && !entry.name.endsWith('/'))
  let extracted = 0
  const folded = new Set()
  const files = new Map()
  for (const entry of entries) {
    assertSafeName(entry.name)
    const key = entry.name.toLocaleLowerCase('en-US')
    if (folded.has(key)) throw new PackError('pack-invalid', `ZIP 路径重复：${entry.name}`)
    folded.add(key)
    if (entry.size > MAX_PACK_FILE_BYTES) throw new PackError('pack-too-large', `${entry.name} 超过 2 MiB`)
    extracted += entry.size
    if (extracted > MAX_PACK_EXTRACTED_BYTES) throw new PackError('pack-too-large', '解压后超过 80 MiB')
    files.set(entry.name, entry.data)
  }
  const prefix = commonPrefix([...files.keys()])
  const rooted = new Map()
  for (const [name, data] of files) {
    if (!name.startsWith(prefix)) throw new PackError('pack-invalid', 'ZIP 里有包在根目录之外的文件')
    const relative = name.slice(prefix.length)
    rooted.set(relative, data)
  }
  const manifestBytes = rooted.get('pack.json')
  if (manifestBytes === undefined) throw new PackError('pack-invalid', '缺少 pack.json')
  const manifest = parseManifest(JSON.parse(manifestBytes.toString('utf8')))
  const images = collectImages(rooted)
  const allowed = new Set(['pack.json', ...images.keys()])
  for (const name of rooted.keys()) {
    if (!allowed.has(name)) throw new PackError('pack-invalid', `ZIP 里有多余文件：${name}`)
  }
  return { manifest, images }
}

export function parseManifest(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PackError('pack-invalid', 'pack.json 必须是对象')
  }
  const id = value.id
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  if (value.schemaVersion !== SCHEMA_VERSION || value.keySet !== KEY_SET) {
    throw new PackError('pack-invalid', 'schemaVersion 必须是 1，keySet 必须是 dsh-emoji-core@1')
  }
  if (typeof id !== 'string' || !PACK_ID_PATTERN.test(id) || id === 'deepseek') {
    throw new PackError('pack-invalid', 'id 只能用小写字母、数字和连字符，且不能是 deepseek')
  }
  if (name.length === 0 || name.length > 80) throw new PackError('pack-invalid', 'name 不能为空，且不超过 80 字')
  if (typeof value.version !== 'string' || !PACK_VERSION_PATTERN.test(value.version)) {
    throw new PackError('pack-invalid', 'version 必须是 SemVer')
  }
  if (value.displayMode !== undefined && value.displayMode !== 'inline' && value.displayMode !== 'block') {
    throw new PackError('pack-invalid', 'displayMode 只能是 inline 或 block')
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    keySet: KEY_SET,
    id,
    name,
    version: value.version,
    displayMode: value.displayMode,
  }
}

export function pngSize(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE) || buffer.toString('ascii', 12, 16) !== 'IHDR') {
    throw new PackError('pack-invalid', '不是 PNG')
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

function collectImages(files) {
  const images = new Map()
  for (const entry of KEYS) {
    const name = `images/${entry.key}.png`
    const data = files.get(name)
    if (data === undefined) throw new PackError('pack-invalid', `缺少 ${name}`)
    if (data.byteLength > MAX_PACK_FILE_BYTES) throw new PackError('pack-too-large', `${name} 超过 2 MiB`)
    let size
    try {
      size = pngSize(data)
    } catch {
      throw new PackError('pack-invalid', `${name} 不是 PNG`)
    }
    if (size.width < 1 || size.height < 1 || size.width > MAX_PACK_IMAGE_DIMENSION || size.height > MAX_PACK_IMAGE_DIMENSION) {
      throw new PackError('pack-invalid', `${name} 尺寸必须在 1 到 ${MAX_PACK_IMAGE_DIMENSION} 之间`)
    }
    images.set(name, { ...size, bytes: data.byteLength })
  }
  return images
}

function commonPrefix(paths) {
  if (paths.includes('pack.json')) return ''
  const candidates = paths.filter(item => /^[^/]+\/pack\.json$/.test(item))
  if (candidates.length !== 1) throw new PackError('pack-invalid', 'pack.json 必须在 ZIP 根目录，或唯一的一层目录里')
  return `${candidates[0].slice(0, candidates[0].length - 'pack.json'.length)}`
}

function assertSafeName(name) {
  if (name.includes('\0') || name.includes('\\') || name.startsWith('/') || /^[A-Za-z]:/.test(name)) {
    throw new PackError('pack-invalid', `不安全的 ZIP 路径：${name}`)
  }
  const segments = name.split('/').filter(Boolean)
  if (segments.length === 0 || segments.some(segment => segment === '.' || segment === '..')) {
    throw new PackError('pack-invalid', `不安全的 ZIP 路径：${name}`)
  }
}

function ignored(name) {
  const segments = name.split('/')
  return segments.includes('__MACOSX') || segments.at(-1) === '.DS_Store'
}

import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { ALIASES, FREQUENCIES, KEYS, LIMITS } from '../src/keys.mjs'
import { PackError, parseManifest, pngSize, validatePackDir, validatePackZip } from '../src/pack.mjs'
import { parseSettings, renderRule } from '../src/prompt.mjs'
import { listZip, zipStore } from '../src/zip.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test('the contract is the 40 dsh-emoji-core keys', () => {
  assert.equal(KEYS.length, 40)
  assert.equal(new Set(KEYS.map(entry => entry.key)).size, 40)
  assert.deepEqual(LIMITS, { off: 0, smart: 3, frequent: 4 })
  assert.deepEqual(FREQUENCIES, ['off', 'smart', 'frequent'])
  assert.deepEqual(ALIASES.map(alias => alias.key), ['laughing', 'happy'])
  for (const entry of KEYS) assert.match(entry.emoji, /\p{Extended_Pictographic}/u)
})

test('the rule follows the active frequency and names every key', () => {
  const smart = renderRule({ frequency: 'smart', imageBase: 'https://example.test/emoji' })
  const frequent = renderRule({ frequency: 'frequent' })
  const off = renderRule({ frequency: 'off' })
  assert.match(smart, /^frequency: smart$/m)
  assert.match(smart, /最多 3 张/)
  assert.match(frequent, /最多 4 张/)
  assert.match(off, /不要插入 imageBase/)
  assert.match(smart, /!\[happy\]\(https:\/\/example\.test\/emoji\/happy\.png\)/)
  assert.match(smart, /displayMode: block/)
  for (const entry of KEYS) assert.ok(smart.includes('`' + entry.key + '`'))
  assert.equal(parseSettings(smart).imageBase, 'https://example.test/emoji')
  assert.throws(() => renderRule({ frequency: 'always' }), /frequency/)
})

test('committed rules match the generator', async () => {
  const expected = renderRule()
  for (const relative of ['plugin/rules/grok-emoji.mdc', '.cursor/rules/grok-emoji.mdc']) {
    assert.equal(await readFile(path.join(root, relative), 'utf8'), expected)
  }
})

test('png dimensions and manifest limits', () => {
  assert.deepEqual(pngSize(PNG_1x1), { width: 1, height: 1 })
  const wide = Buffer.from(PNG_1x1)
  wide.writeUInt32BE(513, 16)
  assert.equal(pngSize(wide).width, 513)
  assert.throws(() => parseManifest({
    schemaVersion: 1,
    keySet: 'dsh-emoji-core@1',
    id: 'deepseek',
    name: 'nope',
    version: '1.0.0',
  }), PackError)
  assert.equal(parseManifest({
    schemaVersion: 1,
    keySet: 'dsh-emoji-core@1',
    id: 'my-pack',
    name: ' 我的包 ',
    version: '1.2.3',
    displayMode: 'inline',
  }).name, '我的包')
})

test('a pack directory and zip accept exactly the 40 images', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'grok-pack-'))
  try {
    const manifest = {
      schemaVersion: 1,
      keySet: 'dsh-emoji-core@1',
      id: 'my-pack',
      name: '测试',
      version: '1.0.0',
      displayMode: 'block',
    }
    await writeTree(dir, manifest)
    const checked = await validatePackDir(dir)
    assert.equal(checked.images.size, 40)
    assert.equal(checked.manifest.displayMode, 'block')

    const files = [{ name: 'pack.json', data: Buffer.from(`${JSON.stringify(manifest)}\n`) }]
    for (const entry of KEYS) {
      files.push({ name: `images/${entry.key}.png`, data: PNG_1x1 })
    }
    const zip = zipStore(files)
    assert.equal(listZip(zip).length, 41)
    assert.equal(validatePackZip(zip).manifest.id, 'my-pack')

    const wrapped = zipStore(files.map(file => ({ ...file, name: `my-pack/${file.name}` })))
    assert.equal(validatePackZip(wrapped).manifest.id, 'my-pack')

    const extra = zipStore([...files, { name: 'images/bonus.png', data: PNG_1x1 }])
    assert.throws(() => validatePackZip(extra), /多余文件/)
    const missing = zipStore(files.filter(file => file.name !== 'images/happy.png'))
    assert.throws(() => validatePackZip(missing), /happy/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('the built-in grok pack is a valid block pack of 256px images', async () => {
  const checked = await validatePackDir(path.join(root, 'assets', 'emoji', 'grok'))
  assert.equal(checked.manifest.id, 'grok')
  assert.equal(checked.manifest.version, '1.0.0')
  assert.equal(checked.manifest.keySet, 'dsh-emoji-core@1')
  assert.equal(checked.manifest.displayMode, 'block')
  for (const image of checked.images.values()) {
    assert.equal(image.width, 256)
    assert.equal(image.height, 256)
  }
})

test('project install writes a rule and can change frequency without dropping keys', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'grok-install-'))
  try {
    const script = path.join(root, 'scripts', 'install.mjs')
    const first = spawnSync(process.execPath, [script, '--scope', 'project', '--dir', dir, '--frequency', 'frequent'], {
      encoding: 'utf8',
    })
    assert.equal(first.status, 0, first.stderr)
    const rulePath = path.join(dir, '.cursor', 'rules', 'grok-emoji.mdc')
    const frequent = await readFile(rulePath, 'utf8')
    assert.equal(parseSettings(frequent).frequency, 'frequent')
    assert.match(frequent, /happy/)

    const second = spawnSync(process.execPath, [script, '--scope', 'project', '--dir', dir, '--frequency', 'off'], {
      encoding: 'utf8',
    })
    assert.equal(second.status, 0, second.stderr)
    const off = await readFile(rulePath, 'utf8')
    assert.equal(parseSettings(off).frequency, 'off')
    assert.equal(parseSettings(off).imageBase, parseSettings(frequent).imageBase)
    for (const entry of KEYS) assert.ok(off.includes('`' + entry.key + '`'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

async function writeTree(dir, manifest) {
  const { mkdir } = await import('node:fs/promises')
  await mkdir(path.join(dir, 'images'), { recursive: true })
  await writeFile(path.join(dir, 'pack.json'), `${JSON.stringify(manifest)}\n`)
  await Promise.all(KEYS.map(entry => writeFile(path.join(dir, 'images', `${entry.key}.png`), PNG_1x1)))
}

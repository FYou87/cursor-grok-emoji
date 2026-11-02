#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PACK_VERSION } from '../src/keys.mjs'
import { validatePackZip } from '../src/pack.mjs'
import { zipStore } from '../src/zip.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
await mkdir(dist, { recursive: true })

const packRoot = path.join(root, 'assets', 'emoji', 'grok')
const packFiles = [await entry('pack.json', path.join(packRoot, 'pack.json'))]
for (const filename of (await readdir(path.join(packRoot, 'images'))).sort()) {
  if (!filename.endsWith('.png')) continue
  packFiles.push(await entry(`images/${filename}`, path.join(packRoot, 'images', filename)))
}
const packZip = zipStore(packFiles)
validatePackZip(packZip)
const packName = `grok-pack-${PACK_VERSION}.zip`
await writeFile(path.join(dist, packName), packZip)

const releaseFiles = [
  await entry('assets/emoji/grok/pack.json', path.join(packRoot, 'pack.json')),
]
for (const file of packFiles) {
  if (file.name === 'pack.json') continue
  releaseFiles.push(await entry(`assets/emoji/grok/${file.name}`, path.join(packRoot, file.name)))
}
const extras = [
  'README.md',
  'README.en.md',
  'LICENSE',
  'EMOJI_KEYS.md',
  'CHANGELOG.md',
  'package.json',
  'assets/readme/banner.png',
  'assets/readme/preview.png',
  'plugin/.cursor-plugin/plugin.json',
  'plugin/rules/grok-emoji.mdc',
  'plugin/README.md',
  'plugin/skills/grok-emoji/SKILL.md',
  'plugin/commands/grok-emoji-frequency.md',
  'plugin/assets/logo.png',
  '.cursor/rules/grok-emoji.mdc',
  '.cursor-plugin/marketplace.json',
  'scripts/install.mjs',
  'scripts/validate.mjs',
  'scripts/render-rules.mjs',
  'src/keys.mjs',
  'src/prompt.mjs',
  'src/pack.mjs',
  'src/zip.mjs',
]
for (const relative of extras) {
  releaseFiles.push(await entry(relative, path.join(root, relative)))
}
const releaseName = `cursor-grok-emoji-${PACK_VERSION}.zip`
await writeFile(path.join(dist, releaseName), zipStore(releaseFiles))
console.log(path.join(dist, packName))
console.log(path.join(dist, releaseName))

async function entry(name, file) {
  return { name, data: await readFile(file) }
}

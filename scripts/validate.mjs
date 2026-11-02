#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validatePackDir, validatePackZip } from '../src/pack.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = process.argv[2] ?? path.join(root, 'assets', 'emoji', 'grok')

const result = target.endsWith('.zip')
  ? validatePackZip(await readFile(target))
  : await validatePackDir(target)

const mode = result.manifest.displayMode ?? 'inline'
console.log(`${result.manifest.id}@${result.manifest.version} ${result.manifest.name} ${mode} ${result.images.size} images`)

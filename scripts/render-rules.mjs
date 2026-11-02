#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderRule } from '../src/prompt.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rule = renderRule()
const targets = [
  path.join(root, 'plugin', 'rules', 'grok-emoji.mdc'),
  path.join(root, '.cursor', 'rules', 'grok-emoji.mdc'),
]
for (const target of targets) {
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, rule)
  console.log(target)
}

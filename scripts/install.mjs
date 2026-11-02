#!/usr/bin/env node
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PACK_VERSION, defaultImageBase } from '../src/keys.mjs'
import { validatePackDir } from '../src/pack.mjs'
import { cursorImagePath, parseSettings, renderRule } from '../src/prompt.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const help = `用法
  node scripts/install.mjs --scope user|project|paste [选项]

把 Grok 娘表情装进 Cursor。

  --scope user       安装到本机所有项目（~/.cursor/plugins/local/grok-emoji）
  --scope project    只写入当前项目的 .cursor/rules/grok-emoji.mdc
  --scope paste      把规则打印到标准输出，供粘贴到 Cursor → Customize → Rules
  --frequency off|smart|frequent
                     默认 smart。再次安装时如果省略，保留已有频率
  --dir <项目目录>    项目安装的目标，默认当前目录
  --dest <插件目录>   覆盖 user 安装位置
  --image-base <url> 图片基址，不带末尾斜杠。默认指向本仓库 v${PACK_VERSION} 的 raw 地址
  --pack <目录>      校验并改用另一套 dsh-emoji-core@1 表情包
  --vendor           项目安装时把图片复制进项目，并用本机绝对路径（不适合提交给别人）
  --extra <文本>     附加偏好，不能改变频率和数量上限
`

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || args.scope === undefined) {
    console.log(help)
    process.exit(args.help ? 0 : 1)
  }
  if (!['user', 'project', 'paste'].includes(args.scope)) {
    fail('scope 只能是 user、project 或 paste')
  }
  if (args.frequency !== undefined && !['off', 'smart', 'frequent'].includes(args.frequency)) {
    fail('frequency 只能是 off、smart 或 frequent')
  }

  const pack = args.pack ? await validatePackDir(path.resolve(args.pack)) : undefined
  const destination = await destinationFile(args)
  const previous = destination.file ? await readOptional(destination.file) : undefined
  const previousSettings = previous ? parseSettings(previous) : {}
  const imageBase = await resolveImageBase(args, pack, previousSettings, destination)
  const rule = renderRule({
    frequency: args.frequency ?? previousSettings.frequency ?? 'smart',
    imageBase,
    displayMode: pack?.manifest.displayMode ?? previousSettings.displayMode ?? 'block',
    pack: pack ? `${pack.manifest.id}@${pack.manifest.version}` : (previousSettings.pack ?? `grok@${PACK_VERSION}`),
    extra: args.extra ?? previousSettings.extra,
  })

  if (args.scope === 'paste') {
    process.stdout.write(rule)
    return
  }
  if (args.scope === 'user') await copyPlugin(destination.pluginDir)
  await mkdir(path.dirname(destination.file), { recursive: true })
  await writeFile(destination.file, rule)
  const settings = parseSettings(rule)
  console.log(`已写入 ${destination.file}`)
  console.log(`频率 ${settings.frequency}，表情包 ${settings.pack}`)
  console.log(`图片 ${settings.imageBase}`)
  if (args.scope === 'user') {
    console.log('然后在 Cursor 里执行 Developer: Reload Window。新的对话会按这个频率插入 Grok 娘表情。')
  } else {
    console.log('下一条消息开始生效。')
  }
}

async function destinationFile(args) {
  if (args.scope === 'paste') return {}
  if (args.scope === 'user') {
    const pluginDir = path.resolve(args.dest ?? path.join(homeDir(), '.cursor', 'plugins', 'local', 'grok-emoji'))
    return { pluginDir, file: path.join(pluginDir, 'rules', 'grok-emoji.mdc') }
  }
  const project = path.resolve(args.dir ?? process.cwd())
  return { project, file: path.join(project, '.cursor', 'rules', 'grok-emoji.mdc') }
}

async function resolveImageBase(args, pack, previous, destination) {
  if (args.imageBase) return stripSlash(args.imageBase)
  if (args.vendor && args.scope !== 'project') fail('--vendor 只能和 --scope project 一起用')
  if (args.scope === 'paste' && (args.pack || args.vendor)) {
    fail('paste 只打印规则。自定义图片请先放到 https，再传 --image-base')
  }
  if (args.vendor || (args.pack && args.scope === 'project')) {
    const manifest = pack?.manifest ?? { id: 'grok', version: PACK_VERSION }
    const project = destination.project
    const imageDir = path.join(project, '.cursor', 'grok-emoji', manifest.id, 'images')
    const source = args.pack
      ? path.join(path.resolve(args.pack), 'images')
      : path.join(root, 'assets', 'emoji', 'grok', 'images')
    await copyPngs(source, imageDir)
    const manifestPath = args.pack
      ? path.join(path.resolve(args.pack), 'pack.json')
      : path.join(root, 'assets', 'emoji', 'grok', 'pack.json')
    await cp(manifestPath, path.join(project, '.cursor', 'grok-emoji', manifest.id, 'pack.json'))
    console.log('图片在本机绝对路径下。换一台电脑或分享仓库时，请改用 --image-base 的 https 地址。')
    return cursorImagePath(imageDir)
  }
  if (args.pack && args.scope === 'user') {
    const imageDir = path.join(destination.pluginDir, 'packs', pack.manifest.id, 'images')
    await copyPngs(path.join(path.resolve(args.pack), 'images'), imageDir)
    console.log('全局自定义包使用本机绝对路径。Cursor 通常只渲染当前工作区里的本地图片；所有项目都要看到时，请把图片放到 https 并用 --image-base。')
    return cursorImagePath(imageDir)
  }
  if (previous.imageBase) return previous.imageBase
  return defaultImageBase()
}

async function copyPngs(source, imageDir) {
  await mkdir(imageDir, { recursive: true })
  for (const filename of await readdir(source)) {
    if (!filename.endsWith('.png')) continue
    await cp(path.join(source, filename), path.join(imageDir, filename))
  }
}

async function copyPlugin(pluginDir) {
  await mkdir(pluginDir, { recursive: true })
  const pluginRoot = path.join(root, 'plugin')
  await cp(path.join(pluginRoot, '.cursor-plugin'), path.join(pluginDir, '.cursor-plugin'), { recursive: true })
  await cp(path.join(pluginRoot, 'skills'), path.join(pluginDir, 'skills'), { recursive: true })
  await cp(path.join(pluginRoot, 'commands'), path.join(pluginDir, 'commands'), { recursive: true })
  await cp(path.join(pluginRoot, 'assets'), path.join(pluginDir, 'assets'), { recursive: true })
  await cp(path.join(pluginRoot, 'README.md'), path.join(pluginDir, 'README.md'))
  await rm(path.join(pluginDir, 'rules'), { recursive: true, force: true })
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--help' || token === '-h') args.help = true
    else if (token === '--vendor') args.vendor = true
    else if (token.startsWith('--')) {
      const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      const value = argv[index + 1]
      if (value === undefined || value.startsWith('--')) fail(`缺少 ${token} 的值`)
      args[key] = value
      index += 1
    } else fail(`无法识别的参数 ${token}`)
  }
  return args
}

function stripSlash(value) {
  return value.replace(/\/+$/, '')
}

async function readOptional(file) {
  try {
    return await readFile(file, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return undefined
    throw error
  }
}

function homeDir() {
  return process.env.HOME || process.env.USERPROFILE || ''
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})

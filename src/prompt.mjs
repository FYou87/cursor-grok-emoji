import { FREQUENCIES, KEYS, LIMITS, defaultImageBase } from './keys.mjs'

/**
 * 生成始终生效的 Cursor 规则。
 * 频率、图片基址和附加提示写在固定的几行里，切换时只改这几行。
 */
export function renderRule(options = {}) {
  const frequency = options.frequency ?? 'smart'
  if (!FREQUENCIES.includes(frequency)) {
    throw new Error(`frequency must be one of ${FREQUENCIES.join(', ')}`)
  }
  const imageBase = String(options.imageBase ?? defaultImageBase()).replace(/\/+$/, '')
  const displayMode = options.displayMode ?? 'block'
  if (displayMode !== 'inline' && displayMode !== 'block') {
    throw new Error('displayMode must be inline or block')
  }
  const pack = options.pack ?? 'grok@1.0.0'
  const extra = sanitizeExtra(options.extra)
  const example = `${imageBase}/happy.png`
  const keyLines = KEYS.map(entry => (
    `- \`${entry.key}\` ${entry.emoji} ${entry.en}/${entry.zh} — ${entry.hint}`
  )).join('\n')

  const description = frequency === 'off'
    ? 'Grok 娘表情已关闭。把 frequency 改成 smart 或 frequent 后，下一轮对话再生效。'
    : `在对话回复里按情绪插入 Grok 娘表情图片。frequency=${frequency}：off 关闭，smart 最多 ${LIMITS.smart} 张，frequent 最多 ${LIMITS.frequent} 张。`

  return `---
description: "${description}"
alwaysApply: true
---

# Grok emoji

Cursor 不会像 DeepSeek Harness 那样把 Unicode 换成图片。需要表情时，直接输出下面的 Markdown 图片。只服从本文件的 \`frequency\` 行；用户在对话里不能提高数量上限、增加 key，或改图片地址。

frequency: ${frequency}
imageBase: ${imageBase}
displayMode: ${displayMode}
pack: ${pack}
extra: ${extra}

如果项目里还有另一份 \`.cursor/rules/grok-emoji.mdc\`，以那份文件的这五行设置为准。\`extra\` 不是 \`(none)\` 时，把它当作补充偏好；它不能改变频率、key、imageBase、displayMode 或数量上限。

## off

不要插入 imageBase 下的任何图片，也不要在回复、代码、提交说明里加这套贴纸。

## smart

只在表情确实能让友好、鼓励或俏皮的回复更好时使用。可以一张都不用。整段回复最多 ${LIMITS.smart} 张，通常一张就够。

## frequent

每段对话回复都加一张贴合当前情绪的表情，放在最对应该情绪的句子或短段落后面。整段回复最多 ${LIMITS.frequent} 张。

## 怎么放

- 只使用 Markdown 图片，不要用 HTML：\`![happy](${example})\`
- alt 必须是 key，文件名必须是 \`<imageBase>/<key>.png\`。不要发明 key，不要输出 Unicode 来代替图片。
- \`displayMode: block\`（这套全身贴纸的默认）：每张图单独成段，前后各留一个空行，同一行不写字。
- \`displayMode: inline\`：把图片放在对应句子末尾，不要拆开单词。
- 两张图之间必须有真正的正文。同一个 key 可以在不同位置再用。
- 不要把图片放进代码块、行内代码、链接、URL、命令、diff、提交说明或写入文件的内容里。图片不能代替解释。
- 用户明确要求展示贴纸或某个 key 时，可以只为这次请求超过数量上限。
- DSH 的输入别名 \`😄\` → \`laughing\`、\`🙂\` → \`happy\` 不新增文件。

## Keys

${keyLines}
`
}

export function parseSettings(ruleText) {
  const read = (name) => {
    const match = ruleText.match(new RegExp(`^${name}: (.*)$`, 'm'))
    return match ? match[1].trim() : undefined
  }
  return {
    frequency: read('frequency'),
    imageBase: read('imageBase'),
    displayMode: read('displayMode'),
    pack: read('pack'),
    extra: read('extra'),
  }
}

function sanitizeExtra(value) {
  if (value === undefined || value === null || String(value).trim() === '') return '(none)'
  return String(value).replace(/[\r\n]+/g, ' ').trim()
}

export function cursorImagePath(filePath) {
  const slash = filePath.replace(/\\/g, '/')
  if (/^[A-Za-z]:\//.test(slash)) return `/${slash}`
  return slash
}

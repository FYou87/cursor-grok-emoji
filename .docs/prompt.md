# 规则文本对照

Cursor 没有 DeepSeek Harness 那种宿主转写。模型看到的唯一提示是 `src/prompt.mjs` 生成的规则，安装进 `.cursor/rules/grok-emoji.mdc` 或本机插件。本文只给改规则的人对照，不会另外注入。

改频率文案、数量上限、key 或图片放置方式时，改 `src/prompt.mjs`，同步本文，再运行：

```sh
node scripts/render-rules.mjs
node --test
```

## 设置行

规则正文开头有五行。切换频率或表情包时只改这五行：

```text
frequency: smart
imageBase: https://raw.githubusercontent.com/FYou87/cursor-grok-emoji/v1.0.0/assets/emoji/grok/images
displayMode: block
pack: grok@1.0.0
extra: (none)
```

`frequency` 对应 dsh-emoji 的模式：

| 本仓库 | dsh-emoji | 行为 |
| --- | --- | --- |
| `off` | `off` | 不插入表情 |
| `smart` | `auto` | 有帮助时才用，每回合最多 3 张 |
| `frequent` | `frequent` | 每段对话回复都用，每回合最多 4 张 |

数量来自 dsh-emoji 的 `EMOJI_PER_TURN_LIMIT`。`extra` 对应那边的附加提示词，不能改变模式、key 或上限。

## 三种频率在说什么

- **off**：不要插入这套图片。
- **smart**：只在表情能让友好、鼓励或俏皮的回复更好时使用。可以不用。最多 3 张，通常一张。
- **frequent**：每段对话回复加一张贴合情绪的图，放在最对应的句子或短段落后。最多 4 张。

## 和 DSH 的差异

DSH 让模型输出 `😊` 这类 Unicode，宿主再换成当前表情包的图片，并在程序里截断超出上限的张数。Cursor 的 `afterAgentResponse` 钩子不能改写已经显示的回复，所以这里改为模型直接写：

```markdown
![happy](https://raw.githubusercontent.com/FYou87/cursor-grok-emoji/v1.0.0/assets/emoji/grok/images/happy.png)
```

对话渲染器允许 `https` 图片。本地文件要位于当前工作区，路径以 `/` 开头；Windows 写成 `/C:/...`。

Grok 娘是全身贴纸，`displayMode` 为 `block`：每张图单独成段，前后各留空行。行内 `1.5em` 会看不清。

图片不要出现在代码块、命令、diff、提交说明和写入磁盘的文件里。用户点名要看贴纸时，可以只为那一次请求超过上限。

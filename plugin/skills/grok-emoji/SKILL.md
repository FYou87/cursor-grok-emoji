---
name: grok-emoji
description: >-
  切换、关闭或检查 Cursor 里的 Grok 娘表情频率，或更换表情包图片地址。
  Use when the user wants to change grok emoji frequency (off, smart, frequent),
  turn the stickers off, switch the emoji pack, or set an extra reaction hint.
---

# Grok 娘表情设置

表情本身由始终生效的规则 `grok-emoji.mdc` 负责。这个技能只在用户要求改设置时使用。

## 改哪一个文件

把下面找得到的文件都改成同一份设置，避免全局规则和项目规则互相打架：

1. 当前项目的 `.cursor/rules/grok-emoji.mdc`
2. `~/.cursor/plugins/local/grok-emoji/rules/grok-emoji.mdc`

两处都不存在时，告诉用户先安装，不要自己编一份新契约。安装命令：

```sh
node scripts/install.mjs --scope user --frequency smart
```

项目里如果已经克隆了本仓库，在仓库根目录执行。否则让用户把 `plugin/rules/grok-emoji.mdc` 复制到项目的 `.cursor/rules/grok-emoji.mdc`。

## 可以改的行

只改这几行，不要重写 key 列表、数量上限或放置规则：

```text
frequency: smart
imageBase: https://raw.githubusercontent.com/FYou87/cursor-grok-emoji/v1.0.0/assets/emoji/grok/images
displayMode: block
pack: grok@1.0.0
extra: (none)
```

- `frequency` 只能是 `off`、`smart`、`frequent`。
- `smart` 最多 3 张，`frequent` 最多 4 张。这两个上限写在规则正文里，不要改数字。
- `imageBase` 不带末尾斜杠。图片地址是 `<imageBase>/<key>.png`。
- `extra` 用一行文字。清空时写 `(none)`。它不能放宽频率或 key。
- 换自定义包之前，先确认对方提供了 `pack.json`（`schemaVersion` 1，`keySet` 为 `dsh-emoji-core@1`）和 40 个同名 PNG。然后运行 `node scripts/validate.mjs <包目录>`。

改完告诉用户：当前这条消息仍使用旧设置，下一条消息才生效。全局插件安装后如果规则没出现，执行一次 Developer: Reload Window。

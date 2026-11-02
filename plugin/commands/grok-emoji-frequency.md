---
name: grok-emoji-frequency
description: 把 Grok 娘表情频率改成 off、smart 或 frequent
---

# 切换表情频率

用户在命令后面给出的频率优先。没有给出时，先看当前规则里的 `frequency`，再请用户在 `off`、`smart`、`frequent` 里选一个。

按 `grok-emoji` 技能的步骤，只修改已安装规则里的 `frequency:` 行：

- `off`：关闭
- `smart`：需要时才用，每回合最多 3 张
- `frequent`：每段对话回复一张，每回合最多 4 张

不要改 key、数量上限和图片地址。改完说明下一条消息才生效。

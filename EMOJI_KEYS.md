# 核心语义契约

表情包作者要实现的 40 个稳定语义 key。契约标识：

```text
dsh-emoji-core@1
```

`schemaVersion` 是 ZIP 和 `pack.json` 的格式版本，`keySet` 是图片实现的语义集合。当前两者分别是 `1` 和 `dsh-emoji-core@1`。

这套 key、含义和数量上限继承自 [hellodigua/dsh-emoji](https://github.com/hellodigua/dsh-emoji)（MIT）。key 是机器协议：不翻译、不改名，也不要把角色名写进文件名。

## 作者必须遵守的格式

```json
{
  "schemaVersion": 1,
  "keySet": "dsh-emoji-core@1",
  "id": "my-emoji-pack",
  "name": "我的表情包",
  "version": "1.0.0"
}
```

- 每个 key **恰好一张** `images/<key>.png`。不能多，也不能少。
- `id` 使用小写字母、数字和连字符，且不能叫 `deepseek`。`version` 使用 SemVer。`name` 去掉首尾空白后为 1 到 80 个字符。
- 可以省略 `displayMode`，也可以写成 `inline` 或 `block`。省略时按行内理解。Grok 娘这套全身贴纸使用 `block`。
- 图片宽高都在 1 到 512 像素之间。单文件不超过 2 MiB，ZIP 不超过 20 MiB，解压后不超过 80 MiB。
- 同一套表情的角色、比例和留白保持一致。相近 key 不能只靠文件名区分。
- 投稿素材需要有再分发的权利。

DeepSeek Harness 里，模型只输出下面的 Unicode，宿主再换成图片。Cursor 没有这一步，所以本仓库的规则让模型直接输出 `![<key>](<imageBase>/<key>.png)`。两种宿主共用同一组 key 和同一份 `pack.json`。`😄` 是 `laughing` 的输入别名，`🙂` 是 `happy` 的输入别名，它们不新增文件。

## 40 个 key

| key | Unicode | 中文 | 核心含义 | 不要画成 |
| --- | --- | --- | --- | --- |
| `happy` | 😊 | 开心 | 温和、友好的愉快 | 明显爆笑（那是 `laughing`） |
| `sad` | 😢 | 难过 | 安静的低落 | 大哭（那是 `crying`） |
| `confused` | 😕 | 困惑 | 没听懂、不确定 | 无话可说（那是 `speechless`） |
| `watching` | 👀 | 围观 | 公开地看事态发展 | 悄悄看（那是 `peeking`） |
| `angry` | 😠 | 生气 | 对着某件事发火 | 单纯被事情卡住（那是 `frustrated`） |
| `speechless` | 😑 | 无语 | 尴尬到说不出话 | 平静客观（那是 `neutral`） |
| `doge` | 😉 | 狗头 | 玩笑式的“别太当真” | 刻薄讽刺（那是 `sarcastic`） |
| `overloaded` | 😵‍💫 | 过载 | 信息太多，处理不过来 | 只是服务器报错 |
| `neutral` | 😐 | 平静 | 看不出明显情绪 | 尴尬或叹气 |
| `laughing` | 😆 | 大笑 | 张得开的笑 | 笑到流泪（那是 `laugh-cry`） |
| `crying` | 😭 | 大哭 | 正在明显地哭 | 安静难过（那是 `sad`） |
| `sweating` | 😅 | 流汗 | 紧张、尴尬、心虚 | 运动后的普通出汗 |
| `thinking` | 🤔 | 思考 | 正在推理或权衡 | 单纯没听懂 |
| `okay` | 👌 | 好的 | 收到、可以、照做 | 称赞（那是 `approve`） |
| `nodding` | 🙂‍↕️ | 点头 | 理解、认同 | 正式鼓掌 |
| `sleeping` | 😴 | 睡觉 | 困了、休息、晚安 | 只是累得叹气 |
| `hurt` | 🥺 | 委屈 | 被误解、觉得不公平 | 泛泛的难过 |
| `peeking` | 🫣 | 偷看 | 好奇地悄悄看 | 公开围观 |
| `approve` | 👍 | 赞同 | 明确肯定 | 仪式感的鼓掌 |
| `heart` | 🫶 | 爱心 | 喜欢、关心、支持 | 只限恋爱 |
| `shy` | 😳 | 害羞 | 脸红、不好意思 | 尴尬到捂脸 |
| `star-eyes` | 🤩 | 星星眼 | 崇拜、惊艳 | 普通开心 |
| `laugh-cry` | 😂 | 笑哭 | 好笑到流泪 | 悲伤的哭 |
| `touched` | 🥹 | 感动 | 被善意打动 | 负面的哭 |
| `scared` | 😱 | 害怕 | 恐惧、受惊 | 单纯的惊喜 |
| `facepalm` | 🤦 | 捂脸 | 尴尬或替人尴尬 | 只是沉默 |
| `eye-roll` | 🙄 | 白眼 | 不以为然 | 更冲的阴阳怪气 |
| `sigh` | 😮‍💨 | 叹气 | 无奈、认命 | 激烈烦躁 |
| `frustrated` | 😫 | 抓狂 | 事情难办、焦头烂额 | 针对某个人发火 |
| `playful` | 😜 | 调皮 | 友好的逗趣 | 带攻击的讽刺 |
| `snickering` | 🤭 | 偷笑 | 忍着不公开笑 | 大声笑 |
| `sarcastic` | 😏 | 阴阳 | 冷淡的讽刺 | 缓和气氛的狗头 |
| `cool` | 😎 | 酷 | 自信、从容 | 单纯开心 |
| `celebrate` | 🎉 | 庆祝 | 结果已经达成 | 过程中加油（那是 `cheer`） |
| `cheer` | 💪 | 加油 | 鼓励对方继续 | 事后庆祝 |
| `thanks` | 🙏 | 谢谢 | 明确道谢 | 只是普通开心 |
| `sorry` | 🙇 | 抱歉 | 道歉并承认过失 | 只是委屈 |
| `hug` | 🤗 | 抱抱 | 安慰、陪伴 | 只限亲密关系 |
| `please` | 🤲 | 拜托 | 请求对方答应 | 道谢或道歉 |
| `applause` | 👏 | 鼓掌 | 公开赞扬 | 轻轻点个头 |

最容易混的几组：

- 笑：`happy` → `laughing` → `laugh-cry`；`snickering` 是压低声音的笑。
- 负面：`sad` 安静，`crying` 强烈，`hurt` 是委屈，`touched` 是正向感动。
- 认同：`okay` 是收到，`nodding` 是点头，`approve` 是称赞，`applause` 是鼓掌。
- 看：`watching` 公开，`peeking` 悄悄。
- 压力：`sweating` 紧张，`overloaded` 处理不过来，`frustrated` 被卡住，`sigh` 认命。
- 调侃：`playful` 友好，`doge` 缓和玩笑，`sarcastic` 是冷嘲。
- 阶段：`cheer` 在进行中，`celebrate` 在出结果之后。

## 提交前

- [ ] `pack.json` 声明 `"keySet": "dsh-emoji-core@1"`。
- [ ] 40 个文件名和上表完全一致，没有额外图片。
- [ ] 相近的 key 并排放在一起也能分辨。
- [ ] 运行 `node scripts/validate.mjs <目录或 zip>` 通过。

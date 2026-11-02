# cursor-grok-emoji

[中文](README.md) | English

Cursor chat replies can include [Grok 娘](README.md) stickers. The 40 semantic keys, frequency caps, and `pack.json` format match [dsh-emoji](https://github.com/hellodigua/dsh-emoji), so another pack can be swapped in without teaching the model a new vocabulary.

![Grok emoji banner](assets/readme/banner.png)

The character is fan art. It is not an official xAI or Cursor emoji set.

## Install

Node.js 18 or newer.

All projects on this machine, then run **Developer: Reload Window**:

```sh
git clone --depth 1 --branch v1.0.0 https://github.com/FYou87/cursor-grok-emoji.git
cd cursor-grok-emoji
node scripts/install.mjs --scope user
```

Current project only:

```sh
mkdir -p .cursor/rules
curl -fsSL -o .cursor/rules/grok-emoji.mdc \
  https://raw.githubusercontent.com/FYou87/cursor-grok-emoji/v1.0.0/plugin/rules/grok-emoji.mdc
```

You can also import `https://github.com/FYou87/cursor-grok-emoji` from Customize as a GitHub plugin, or paste `node scripts/install.mjs --scope paste` into a user rule.

## Frequency

Change the `frequency:` line in the rule, or rerun the installer:

```sh
node scripts/install.mjs --scope user --frequency frequent
```

| Value | Behavior |
| --- | --- |
| `off` | No stickers |
| `smart` | Only when a sticker helps. At most 3 per reply. Default |
| `frequent` | One fitting sticker in every conversational reply. At most 4 |

The change applies on the next message. With the plugin installed, `/grok-emoji-frequency` does the same edit.

## How it shows up

DeepSeek Harness rewrites a Unicode emoji such as `😊` into the active pack image. Cursor cannot rewrite an assistant message after it is shown, and its chat view does render `https` images, so the rule tells the model to emit:

```markdown
![happy](https://raw.githubusercontent.com/FYou87/cursor-grok-emoji/v1.0.0/assets/emoji/grok/images/happy.png)
```

These are 256×256 full-body stickers (`displayMode: block`), each in its own paragraph. They stay out of code blocks, commands, diffs, commit messages, and files written to disk. A local image renders reliably only when it lives in the open workspace and the path is absolute (`/…` or `/C:/…` on Windows).

## Custom packs

`schemaVersion` 1, `keySet` `dsh-emoji-core@1`, and one `images/<key>.png` per key. Meanings are in [EMOJI_KEYS.md](EMOJI_KEYS.md).

```sh
node scripts/validate.mjs ./my-pack
node scripts/install.mjs --scope project --pack ./my-pack
```

`--pack` copies images into the project and points the rule at that absolute path. For a URL you can share, pass `--image-base https://…/images`. The release asset `grok-pack-1.0.0.zip` is a dsh-emoji upload ZIP of this character.

## License

[MIT](LICENSE). The semantic contract is adapted from [hellodigua/dsh-emoji](https://github.com/hellodigua/dsh-emoji).

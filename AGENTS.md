# 维护约定

- 面向使用者的文档用中文。
- 40 个 key、含义和 `off` / `smart`（对应 dsh-emoji 的 `auto`）/ `frequent` 上限要和 [hellodigua/dsh-emoji](https://github.com/hellodigua/dsh-emoji) 的 `dsh-emoji-core@1` 保持一致。
- 改规则文案时改 `src/prompt.mjs`，同步 `.docs/prompt.md`，并运行 `node scripts/render-rules.mjs`。已提交的两份 `.mdc` 必须和生成结果一致。
- 表情素材由 `scripts/prepare_assets.py` 从白底原图生成透明 PNG。不要手改 `assets/emoji/grok/images/`。
- 提交前运行 `node --test` 和 `git diff --check`。

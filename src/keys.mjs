/**
 * dsh-emoji-core@1 的 40 个稳定语义 key。
 *
 * key、Unicode 与数量上限跟 hellodigua/dsh-emoji 的契约对齐。
 * Cursor 没有宿主侧的 Unicode 转写，模型直接按 key 输出图片。
 * `😄 → laughing`、`🙂 → happy` 是 DSH 的输入别名，不新增图片。
 */

export const KEY_SET = 'dsh-emoji-core@1'
export const SCHEMA_VERSION = 1
export const PACK_ID = 'grok'
export const PACK_VERSION = '1.0.0'
export const PACK_NAME = 'Grok 娘'
export const REPO = 'FYou87/cursor-grok-emoji'

export const LIMITS = Object.freeze({
  off: 0,
  smart: 3,
  frequent: 4,
})

export const FREQUENCIES = Object.freeze(['off', 'smart', 'frequent'])

/** DSH 内部模式名。Cursor 规则使用 smart，对应那边的 auto。 */
export const DSH_MODE = Object.freeze({
  off: 'off',
  smart: 'auto',
  frequent: 'frequent',
})

export const ALIASES = Object.freeze([
  { emoji: '😄', key: 'laughing' },
  { emoji: '🙂', key: 'happy' },
])

export const KEYS = Object.freeze([
  { key: 'happy', emoji: '😊', en: 'Happy', zh: '开心', hint: 'mild friendly pleasure, not a big laugh' },
  { key: 'sad', emoji: '😢', en: 'Sad', zh: '难过', hint: 'quiet sadness, not sobbing' },
  { key: 'confused', emoji: '😕', en: 'Confused', zh: '困惑', hint: 'does not understand; not speechless' },
  { key: 'watching', emoji: '👀', en: 'Watching', zh: '围观', hint: 'openly spectating' },
  { key: 'angry', emoji: '😠', en: 'Angry', zh: '生气', hint: 'direct anger at something' },
  { key: 'speechless', emoji: '😑', en: 'Speechless', zh: '无语', hint: 'awkward silence, not calm neutral' },
  { key: 'doge', emoji: '😉', en: 'Doge', zh: '狗头', hint: 'playful "not too serious", not mean sarcasm' },
  { key: 'overloaded', emoji: '😵‍💫', en: 'Overloaded', zh: '过载', hint: 'too much to process, mind stalling' },
  { key: 'neutral', emoji: '😐', en: 'Neutral', zh: '平静', hint: 'no obvious emotion' },
  { key: 'laughing', emoji: '😆', en: 'Laughing', zh: '大笑', hint: 'an open laugh, not yet in tears' },
  { key: 'crying', emoji: '😭', en: 'Crying', zh: '大哭', hint: 'strong sobbing' },
  { key: 'sweating', emoji: '😅', en: 'Sweating', zh: '流汗', hint: 'nervous or embarrassed, not exercise' },
  { key: 'thinking', emoji: '🤔', en: 'Thinking', zh: '思考', hint: 'reasoning or weighing, not confused' },
  { key: 'okay', emoji: '👌', en: 'Okay', zh: '好的', hint: 'got it / will do, not praise' },
  { key: 'nodding', emoji: '🙂‍↕️', en: 'Nodding', zh: '点头', hint: 'acknowledgement, quieter than approve' },
  { key: 'sleeping', emoji: '😴', en: 'Sleeping', zh: '睡觉', hint: 'sleepy or saying good night' },
  { key: 'hurt', emoji: '🥺', en: 'Hurt', zh: '委屈', hint: 'wronged or hurt, not generic sadness' },
  { key: 'peeking', emoji: '🫣', en: 'Peeking', zh: '偷看', hint: 'secretly looking, more hidden than watching' },
  { key: 'approve', emoji: '👍', en: 'Approve', zh: '赞同', hint: 'clear praise, less formal than applause' },
  { key: 'heart', emoji: '🫶', en: 'Heart', zh: '爱心', hint: 'affection or support, not only romance' },
  { key: 'shy', emoji: '😳', en: 'Shy', zh: '害羞', hint: 'blushing, not a facepalm' },
  { key: 'star-eyes', emoji: '🤩', en: 'Star eyes', zh: '星星眼', hint: 'dazzled or admiring' },
  { key: 'laugh-cry', emoji: '😂', en: 'Laugh cry', zh: '笑哭', hint: 'laughing so hard there are tears' },
  { key: 'touched', emoji: '🥹', en: 'Touched', zh: '感动', hint: 'warmly moved, not sad crying' },
  { key: 'scared', emoji: '😱', en: 'Scared', zh: '害怕', hint: 'fear or alarm' },
  { key: 'facepalm', emoji: '🤦', en: 'Facepalm', zh: '捂脸', hint: 'embarrassed, hand on face' },
  { key: 'eye-roll', emoji: '🙄', en: 'Eye roll', zh: '白眼', hint: 'unimpressed, milder than sarcastic' },
  { key: 'sigh', emoji: '😮‍💨', en: 'Sigh', zh: '叹气', hint: 'resigned or tired acceptance' },
  { key: 'frustrated', emoji: '😫', en: 'Frustrated', zh: '抓狂', hint: 'blocked and frazzled, not anger at a person' },
  { key: 'playful', emoji: '😜', en: 'Playful', zh: '调皮', hint: 'friendly mischief' },
  { key: 'snickering', emoji: '🤭', en: 'Snickering', zh: '偷笑', hint: 'a suppressed private laugh' },
  { key: 'sarcastic', emoji: '😏', en: 'Sarcastic', zh: '阴阳', hint: 'cold or passive-aggressive irony' },
  { key: 'cool', emoji: '😎', en: 'Cool', zh: '酷', hint: 'confident and stylish' },
  { key: 'celebrate', emoji: '🎉', en: 'Celebrate', zh: '庆祝', hint: 'a result that already happened' },
  { key: 'cheer', emoji: '💪', en: 'Cheer', zh: '加油', hint: 'encouragement while the work is ongoing' },
  { key: 'thanks', emoji: '🙏', en: 'Thanks', zh: '谢谢', hint: 'explicit gratitude' },
  { key: 'sorry', emoji: '🙇', en: 'Sorry', zh: '抱歉', hint: 'an apology that owns a mistake' },
  { key: 'hug', emoji: '🤗', en: 'Hug', zh: '抱抱', hint: 'comfort and company' },
  { key: 'please', emoji: '🤲', en: 'Please', zh: '拜托', hint: 'a request, not thanks or sorry' },
  { key: 'applause', emoji: '👏', en: 'Applause', zh: '鼓掌', hint: 'public praise, clapping' },
])

export function defaultImageBase(version = PACK_VERSION) {
  return `https://raw.githubusercontent.com/${REPO}/v${version}/assets/emoji/grok/images`
}

export function keyByName(name) {
  return KEYS.find(entry => entry.key === name)
}

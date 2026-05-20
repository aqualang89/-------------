import { getSessionsInRange, getHistory } from '~/server/utils/store.js'
import { askOpenRouter } from '~/server/utils/ai.js'
import { sendOwnerDigest } from '~/server/utils/telegram.js'

// Vercel cron шлёт GET с заголовком `Authorization: Bearer <CRON_SECRET>`.
// Эндпоинт нужно подключить в vercel.json (см. "crons").
// Если CRON_SECRET не задан в env — эндпоинт открыт (для теста), но в проде ОБЯЗАТЕЛЬНО задавать.

const SUMMARY_MODEL = 'anthropic/claude-haiku-4.5' // дешёвый для саммари (slug OpenRouter — с точкой, без даты)
const MAX_DIALOG_CHARS_FOR_AI = 2500 // обрезаем длинные диалоги в саммари-инпуте

function fmtMsk (ts) {
  // Калининград UTC+2, дайджест по локальному времени
  const d = new Date(ts + 2 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

function buildDialogTxt (sessionId, history) {
  const lines = [`=== Сессия ${sessionId.slice(0, 8)} ===`]
  for (const m of history) {
    const who = m.role === 'user' ? '👤' : '🤖'
    const time = fmtMsk(m.ts || 0)
    lines.push(`[${time}] ${who} ${m.content}`)
  }
  return lines.join('\n')
}

function buildDialogForAi (sessionId, history) {
  const compact = history
    .map(m => `${m.role === 'user' ? 'К' : 'AI'}: ${m.content}`)
    .join('\n')
  const truncated = compact.length > MAX_DIALOG_CHARS_FOR_AI
    ? compact.slice(0, MAX_DIALOG_CHARS_FOR_AI) + '\n[...обрезано]'
    : compact
  return `--- Сессия ${sessionId.slice(0, 8)} ---\n${truncated}`
}

const SUMMARY_SYSTEM = `Ты помощник владельца магазина акваскейпа. Тебе на вход — диалоги клиентов с AI-консультантом за день.

Сделай резюме строго в таком формате (без markdown, без буллетов, простой текст):

Всего сессий: N

Темы дня:
- Тема 1 (Х сессий)
- Тема 2 (Y сессий)

Потенциальные лиды:
- [сессия abc12345] — кратко что хотел, почему лид (упомянул телефон / попросил перезвонить / готов купить и т.п.)

Что обсуждали (по нескольким интересным сессиям):
- [сессия abc12345] — 1 предложение что было
- [сессия def67890] — 1 предложение что было

Если лидов нет — раздел «Потенциальные лиды» опусти. Если сессий мало (1-3) — раздел «Темы дня» опусти.
Будь кратким. Без воды. Без приветствий.`

export default defineEventHandler(async (event) => {
  // Auth
  const expected = (process.env.CRON_SECRET || '').trim()
  if (expected) {
    const provided = (getRequestHeader(event, 'authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (provided !== expected) {
      throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
    }
  }

  const now = Date.now()
  const from = now - 24 * 60 * 60 * 1000

  const sessionIds = await getSessionsInRange(from, now)
  if (!sessionIds || sessionIds.length === 0) {
    return { ok: true, sessions: 0, note: 'no sessions in last 24h' }
  }

  // Собираем диалоги
  const dialogs = []
  for (const sid of sessionIds) {
    try {
      const history = await getHistory(sid)
      if (history && history.length > 0) {
        dialogs.push({ sid, history })
      }
    } catch (e) {
      console.error('[digest] getHistory failed for', sid, e.message)
    }
  }

  if (dialogs.length === 0) {
    return { ok: true, sessions: 0, note: 'sessions had no history' }
  }

  // Полный текст для .txt-файла
  const dialogsTxt = dialogs
    .map(d => buildDialogTxt(d.sid, d.history))
    .join('\n\n')

  // Компактная версия для AI-саммари
  const aiInput = dialogs
    .map(d => buildDialogForAi(d.sid, d.history))
    .join('\n\n')

  let summary
  try {
    summary = await askOpenRouter(
      [
        { role: 'system', content: SUMMARY_SYSTEM },
        { role: 'user', content: `Всего сессий: ${dialogs.length}\n\nДиалоги:\n\n${aiInput}` }
      ],
      { model: SUMMARY_MODEL, temperature: 0.3, maxTokens: 800 }
    )
  } catch (e) {
    console.error('[digest] summary failed:', e.message)
    summary = `За сутки ${dialogs.length} ${dialogs.length === 1 ? 'сессия' : 'сессий'}. AI-саммари недоступно — смотри файл с диалогами.`
  }

  const dateLabel = new Date(from + 2 * 60 * 60 * 1000).toISOString().slice(0, 10)

  await sendOwnerDigest({ summary, dialogsTxt, dateLabel })

  return { ok: true, sessions: dialogs.length, summaryLength: summary.length, fileSize: dialogsTxt.length }
})

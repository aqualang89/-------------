import {
  addHistory,
  getHistory,
  getMode
} from '~/server/utils/store.js'
import { sendOwnerCard } from '~/server/utils/telegram.js'
import { askOpenRouter, findRelevantProducts, SYSTEM_PROMPT } from '~/server/utils/ai.js'

const HISTORY_LIMIT = 20

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sessionId, text } = body || {}

  if (!sessionId || !text || !text.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'sessionId and text are required' })
  }

  const cleanText = text.trim()

  const previousHistory = await getHistory(sessionId)
  await addHistory(sessionId, 'user', cleanText)

  const mode = await getMode(sessionId)

  if (mode === 'manual') {
    await sendOwnerCard({ sessionId, userText: cleanText, aiReply: null, mode: 'manual' })
    return {
      reply: 'Сообщение передано владельцу. Он ответит здесь.',
      mode: 'manual'
    }
  }

  let reply
  let responseMode = 'ai'

  try {
    const products = await findRelevantProducts(cleanText)
    const catalogBlock = products.length
      ? 'Доступные товары из каталога (рекомендуй только эти):\n' +
        products.map(p =>
          `— ${p.name} (арт. ${p.article || 'нет'}) — ${Math.round(p.price).toLocaleString()} ₽ — https://рипарий.рф/catalog/${p.slug}`
        ).join('\n')
      : 'Каталог по этому запросу ничего не вернул — отвечай экспертно по сути, конкретные товары можешь не предлагать (или предложи общие критерии выбора).'

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...previousHistory.slice(-HISTORY_LIMIT).map(h => ({ role: h.role, content: h.content })),
      { role: 'system', content: catalogBlock },
      { role: 'user', content: cleanText }
    ]

    reply = await askOpenRouter(messages)
  } catch (aiErr) {
    console.error('AI fallback:', aiErr)
    responseMode = 'manual'
    reply = 'Консультант сейчас недоступен. Ваш вопрос передан специалисту — он ответит в ближайшее время. Также можете написать нам в Telegram @riparium_kld.'
  }

  await addHistory(sessionId, 'assistant', reply)
  await sendOwnerCard({ sessionId, userText: cleanText, aiReply: responseMode === 'ai' ? reply : null, mode: responseMode })

  return { reply, mode: responseMode }
})

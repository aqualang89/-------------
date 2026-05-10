import {
  addHistory,
  getHistory,
  getMode
} from '~/server/utils/store.js'
import { sendOwnerCard } from '~/server/utils/telegram.js'
import { askOpenRouter, findRelevantProducts, SYSTEM_PROMPT } from '~/server/utils/ai.js'

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
    // 1. Ищем релевантные товары из каталога
    const products = await findRelevantProducts(cleanText)
    const catalogContext = products.length
      ? '\n\nДоступные товары из каталога (рекомендуй только эти):\n' +
        products.map(p =>
          `— ${p.name} (арт. ${p.article || 'нет'}) — ${Math.round(p.price).toLocaleString()} ₽ — https://рипарий.рф/catalog/${p.slug}`
        ).join('\n')
      : ''

    // 2. Формируем messages для OpenRouter
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + catalogContext
      },
      ...previousHistory.slice(-8).map(h => ({ role: h.role, content: h.content })),
      {
        role: 'user',
        content: cleanText
      }
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

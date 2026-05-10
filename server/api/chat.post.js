import {
  addHistory,
  getHistory,
  getMode
} from '~/server/utils/store.js'
import { sendOwnerCard } from '~/server/utils/telegram.js'
import { askOpenRouter, findRelevantProducts } from '~/server/utils/ai.js'

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
        content: `Ты — консультант и продавец студии аквариумного дизайна Scaper's House (Калининград, ул. Аксакова, 123).

Стиль общения:
— Тепло, живо, как эксперт-друг. Без канцелярита и роботизма.
— Только русский язык.
— Без Markdown: никаких звёздочек, решёток, сносок [1][2], тире-списков. Только обычный текст с абзацами.

Что ты умеешь:
1. Консультировать по аквариумам: выбор, запуск, травники, фильтрация, освещение, CO2, грунты, растения, рыбы, обслуживание.
2. Рекомендовать конкретные товары из каталога (с артикулом и ценой), если они подходят под запрос клиента.
3. Помогать подобрать оборудование под параметры аквариума.

Как работать с каталогом:
— Если клиент спрашивает про конкретный товар или тип оборудования — посмотри в "Доступные товары" ниже и порекомендуй подходящие.
— Называй цену и артикул, если товар есть в списке.
— Если товара нет в списке — честно скажи, что в каталоге сейчас нет, но можно оставить заявку на подбор.
— Не выдумывай товары, которых нет в списке.

Как собирать заявки:
— Если клиент хочет заказать или узнать точную цену — мягко предложи оставить заявку.
— Для расчёта услуг попроси: объём/размеры аквариума, место установки, бюджет.
— В конце можешь сказать: "Оставьте контакт или напишите нам в Telegram @riparium_kld — рассчитаем под вас".
— Часы работы: ежедневно 11:00–19:00. Адрес: г. Калининград, ул. Аксакова, 123, цокольный этаж.
${catalogContext}`
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

import { z } from 'zod'
import { validateBody } from '~/server/utils/validate.js'
import { checkRateLimit } from '~/server/utils/rate-limit.js'

const schema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(30),
  email: z.string().email().max(200),
  message: z.string().min(1).max(2000),
  consent: z.literal(true, { errorMap: () => ({ message: 'Необходимо согласие на обработку персональных данных' }) })
})

export default defineEventHandler(async (event) => {
  // Защита от спама форм: 5 заявок / 10 мин с одного IP
  await checkRateLimit(event, { bucket: 'contact', max: 5, windowSec: 600 })

  const { name, phone, email, message } = await validateBody(event, schema)

  const text = `
📩 Новая заявка с сайта Рипарий

👤 Имя: ${name}
📞 Телефон: ${phone}
📧 Email: ${email}
📝 Сообщение: ${message}
  `.trim()

  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.OWNER_CHAT_ID || process.env.TELEGRAM_CHAT_ID,
        text
      })
    })
    return { ok: true }
  } catch (err) {
    console.error('Contact form error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to send' })
  }
})

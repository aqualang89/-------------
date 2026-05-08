export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, phone, email, message } = body || {}

  if (!name || !phone || !email || !message) {
    throw createError({ statusCode: 400, statusMessage: 'All fields are required' })
  }

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

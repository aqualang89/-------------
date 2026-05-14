import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const {
    customer_name,
    customer_phone,
    customer_email,
    customer_telegram,
    delivery_type,
    delivery_address,
    delivery_city,
    comment,
    consent,
    items
  } = body || {}

  if (!customer_name || !customer_phone || !delivery_type || !items?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  if (consent !== true) {
    throw createError({ statusCode: 400, statusMessage: 'Необходимо согласие на обработку персональных данных' })
  }

  const total_amount = items.reduce((s, i) => s + (i.price * i.qty), 0)

  // 1. Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      customer_telegram: customer_telegram || null,
      delivery_type,
      delivery_address: delivery_address || null,
      delivery_city: delivery_city || null,
      comment: comment || null,
      total_amount
    })
    .select()
    .single()

  if (orderError) {
    console.error('Order insert error:', orderError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create order' })
  }

  // 2. Create order items
  const orderItems = items.map(i => ({
    order_id: order.id,
    product_id: i.productId || null,
    product_name: i.name,
    product_article: i.article || null,
    product_photo: i.photo || null,
    qty: i.qty,
    price: i.price,
    total: i.price * i.qty
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Order items insert error:', itemsError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create order items' })
  }

  // 3. Telegram notification
  const deliveryLabels = {
    pickup: 'Самовывоз (Калининград)',
    courier: 'Курьер по Калининграду',
    transport: 'Транспортная компания по РФ'
  }

  const itemsText = items.map(i => `• ${i.name} × ${i.qty} — ${(i.price * i.qty).toLocaleString()} ₽`).join('\n')

  const telegramText = `
🛒 Новый заказ #${order.id.slice(0, 8)}

💰 Сумма: ${total_amount.toLocaleString()} ₽
👤 ${customer_name}
📞 ${customer_phone}
${customer_email ? '📧 ' + customer_email + '\n' : ''}${customer_telegram ? '✈️ @' + customer_telegram + '\n' : ''}
🚚 ${deliveryLabels[delivery_type] || delivery_type}
${delivery_city ? '📍 Город: ' + delivery_city + '\n' : ''}${delivery_address ? '🏠 Адрес: ' + delivery_address + '\n' : ''}
📝 Состав:
${itemsText}
${comment ? '\n💬 ' + comment : ''}
  `.trim()

  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.OWNER_CHAT_ID || process.env.TELEGRAM_CHAT_ID,
        text: telegramText
      })
    })
  } catch (err) {
    console.error('Telegram notify error:', err)
  }

  // 4. Email notification via Resend
  if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
    const emailHtml = `
      <h2>Новый заказ #${order.id.slice(0, 8)}</h2>
      <p><strong>Сумма:</strong> ${total_amount.toLocaleString()} ₽</p>
      <p><strong>Клиент:</strong> ${customer_name}</p>
      <p><strong>Телефон:</strong> ${customer_phone}</p>
      ${customer_email ? `<p><strong>Email:</strong> ${customer_email}</p>` : ''}
      ${customer_telegram ? `<p><strong>Telegram:</strong> @${customer_telegram}</p>` : ''}
      <p><strong>Доставка:</strong> ${deliveryLabels[delivery_type] || delivery_type}</p>
      ${delivery_city ? `<p><strong>Город:</strong> ${delivery_city}</p>` : ''}
      ${delivery_address ? `<p><strong>Адрес:</strong> ${delivery_address}</p>` : ''}
      <h3>Состав:</h3>
      <ul>
        ${items.map(i => `<li>${i.name} × ${i.qty} — ${(i.price * i.qty).toLocaleString()} ₽</li>`).join('')}
      </ul>
      ${comment ? `<p><strong>Комментарий:</strong> ${comment}</p>` : ''}
    `

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'orders@рипарий.рф',
          to: process.env.ADMIN_EMAIL,
          reply_to: customer_email || undefined,
          subject: `Новый заказ #${order.id.slice(0, 8)} — ${total_amount.toLocaleString()} ₽`,
          html: emailHtml
        })
      })
    } catch (err) {
      console.error('Email notify error:', err)
    }
  }

  return { ok: true, orderId: order.id }
})

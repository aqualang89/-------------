import crypto from 'node:crypto'
import { z } from 'zod'
import { supabase } from '~/server/utils/supabase'
import { getIdempotency, setIdempotency } from '~/server/utils/store.js'
import { validateBody } from '~/server/utils/validate.js'

const itemSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().positive().max(10_000),
  // name/price/photo с клиента в любом случае игнорируются (берём из БД),
  // но даём принимать чтобы не ломать существующий клиент.
  name: z.string().max(500).optional(),
  price: z.number().nonnegative().optional(),
  photo: z.string().max(1000).optional()
})

const schema = z.object({
  customer_name: z.string().min(1).max(100),
  customer_phone: z.string().min(1).max(30),
  customer_email: z.string().email().max(200).optional().nullable().or(z.literal('')),
  customer_telegram: z.string().max(100).optional().nullable().or(z.literal('')),
  delivery_type: z.enum(['pickup', 'courier', 'transport']),
  delivery_address: z.string().max(500).optional().nullable().or(z.literal('')),
  delivery_city: z.string().max(100).optional().nullable().or(z.literal('')),
  comment: z.string().max(2000).optional().nullable().or(z.literal('')),
  consent: z.literal(true, { errorMap: () => ({ message: 'Необходимо согласие на обработку персональных данных' }) }),
  items: z.array(itemSchema).min(1).max(200)
})

export default defineEventHandler(async (event) => {
  const parsed = await validateBody(event, schema)
  const {
    customer_name,
    customer_phone,
    customer_email,
    customer_telegram,
    delivery_type,
    delivery_address,
    delivery_city,
    comment,
    items
  } = parsed

  // ===== ЦЕНЫ ИЗ БД (защита от подмены через DevTools) =====
  // Клиент шлёт price/name в body, но мы их игнорируем — берём из products таблицы.
  // Иначе пользователь через DevTools мог бы поставить price=1 и купить за рубль.
  const productIds = items.map(i => i.productId)

  const { data: dbProducts, error: dbErr } = await supabase
    .from('products')
    .select('id, name, article, price, is_available')
    .in('id', productIds)

  if (dbErr) {
    console.error('Product price fetch error:', dbErr)
    throw createError({ statusCode: 500, statusMessage: 'Failed to verify products' })
  }

  const dbMap = new Map((dbProducts || []).map(p => [p.id, p]))

  // safeItems — items с серверными ценами/именами, qty с клиента (нормализовано)
  const safeItems = items.map(i => {
    const p = dbMap.get(i.productId)
    if (!p) {
      throw createError({ statusCode: 400, statusMessage: `Товар "${i.name || i.productId}" не найден в каталоге` })
    }
    if (p.is_available === false) {
      throw createError({ statusCode: 409, statusMessage: `Товар "${p.name}" сейчас недоступен` })
    }
    const qty = Math.max(1, Math.floor(Number(i.qty) || 1))
    const price = Number(p.price) || 0
    return {
      productId: p.id,
      name: p.name,
      article: p.article || null,
      photo: i.photo || null,
      qty,
      price,
      total: price * qty
    }
  })

  const total_amount = safeItems.reduce((s, i) => s + i.total, 0)

  // ===== IDEMPOTENCY =====
  // Защита от двойных заказов при double-click / refresh / network retry.
  // Хэш = phone + sorted productId:qty + total. Если за 5 мин такой же заказ был —
  // возвращаем существующий orderId, новый не создаём.
  const idempotencyHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      phone: String(customer_phone).trim(),
      items: safeItems.map(i => `${i.productId}:${i.qty}`).sort(),
      total: total_amount
    }))
    .digest('hex')
    .slice(0, 32)

  try {
    const existingOrderId = await getIdempotency(idempotencyHash)
    if (existingOrderId) {
      return { ok: true, orderId: existingOrderId, duplicate: true }
    }
  } catch (e) {
    console.error('Idempotency check failed (continuing):', e.message)
  }

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

  // 2. Create order items (используем safeItems с серверными ценами)
  const orderItems = safeItems.map(i => ({
    order_id: order.id,
    product_id: i.productId,
    product_name: i.name,
    product_article: i.article,
    product_photo: i.photo,
    qty: i.qty,
    price: i.price,
    total: i.total
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Order items insert error:', itemsError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create order items' })
  }

  // Сохраняем idempotency-маркер ПОСЛЕ успешного insert. Если упадём раньше — клиент может ретрайнуть.
  try {
    await setIdempotency(idempotencyHash, order.id, 300)
  } catch (e) {
    console.error('Idempotency save failed (non-fatal):', e.message)
  }

  // 3. Telegram notification
  const deliveryLabels = {
    pickup: 'Самовывоз (Калининград)',
    courier: 'Курьер по Калининграду',
    transport: 'Транспортная компания по РФ'
  }

  const itemsText = safeItems.map(i => `• ${i.name} × ${i.qty} — ${i.total.toLocaleString()} ₽`).join('\n')

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
        ${safeItems.map(i => `<li>${i.name} × ${i.qty} — ${i.total.toLocaleString()} ₽</li>`).join('')}
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

const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
const OWNER_CHAT_ID = (process.env.TELEGRAM_OWNER_CHAT_ID || '').trim()

// Триггерные слова в сообщении КЛИЕНТА — на них шлём пуш в реалтайме.
// Регулярки — границы слов где осмысленно, корни-фрагменты для морфологии русского.
const USER_TRIGGERS = [
  { re: /\bтелефон/i, label: 'телефон' },
  { re: /\bпозвон/i, label: 'позвонить' },
  { re: /\bперезвон/i, label: 'перезвонить' },
  { re: /связаться|свяжитесь/i, label: 'связаться' },
  { re: /\bконтакт/i, label: 'контакт' },
  { re: /\bкупить\b|\bкуплю\b/i, label: 'купить' },
  { re: /\bзаказ|\bзакаж/i, label: 'заказ' },
  { re: /\bбронир|забронир/i, label: 'бронь' },
  { re: /\bадрес/i, label: 'адрес' },
  { re: /\bменеджер/i, label: 'менеджер' },
  { re: /\bконсультант/i, label: 'консультант' },
  { re: /(хочу|надо|можно)\s+(?:говорить|поговорить)\s+с\s+человек/i, label: 'хочет человека' },
  { re: /оператор/i, label: 'оператор' },
]

function detectTrigger (text) {
  if (!text || typeof text !== 'string') return null
  for (const t of USER_TRIGGERS) {
    if (t.re.test(text)) return t.label
  }
  return null
}

function escapeHtml (s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function tgSend (payload, method = 'sendMessage') {
  if (!BOT_TOKEN || !OWNER_CHAT_ID) return
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: OWNER_CHAT_ID, ...payload })
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error(`[TG] ${method} failed ${res.status}: ${errText.slice(0, 200)}`)
    }
  } catch (e) {
    console.error('[TG] network error:', e.message)
  }
}

// Карточка владельцу — только когда нужно реагировать:
// 1) mode='manual' (клиент попросил перевести на человека или этим тегом ходит)
// 2) В сообщении клиента сработал триггер (телефон/перезвонить/купить и т.п.)
// Остальные сообщения молча идут в дайджест.
export async function sendOwnerCard ({ sessionId, userText, aiReply, mode }) {
  if (!BOT_TOKEN || !OWNER_CHAT_ID) return

  const isManual = mode === 'manual'
  const trigger = detectTrigger(userText)
  if (!isManual && !trigger) return

  const tag = isManual
    ? '👤 КЛИЕНТ ПРОСИТ ЧЕЛОВЕКА'
    : `📞 ТРИГГЕР: «${trigger}»`

  const shortId = (sessionId || '').slice(0, 8) || '—'

  const lines = [
    `<b>${tag}</b>`,
    `<i>Сессия</i> <code>${escapeHtml(shortId)}</code>`,
    '',
    `<b>👤 Клиент</b>`,
    escapeHtml(userText || '').slice(0, 1500)
  ]
  if (aiReply) {
    lines.push('', '<b>🤖 AI ответил</b>', escapeHtml(aiReply).slice(0, 1500))
  }

  await tgSend({
    text: lines.join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true
  })
}

// Дайджест за день: текст-саммари + .txt-файл с полными диалогами.
// Используется из cron-эндпоинта.
export async function sendOwnerDigest ({ summary, dialogsTxt, dateLabel }) {
  if (!BOT_TOKEN || !OWNER_CHAT_ID) return

  // Сначала саммари как текст
  await tgSend({
    text: `<b>📊 Дайджест чатов · ${escapeHtml(dateLabel)}</b>\n\n${escapeHtml(summary).slice(0, 3500)}`,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  })

  // Потом файл с полными диалогами через sendDocument (multipart)
  if (dialogsTxt && dialogsTxt.length > 0) {
    try {
      const form = new FormData()
      form.append('chat_id', OWNER_CHAT_ID)
      const filename = `dialogs_${dateLabel}.txt`
      form.append('document', new Blob([dialogsTxt], { type: 'text/plain; charset=utf-8' }), filename)
      form.append('caption', `Полные диалоги за ${dateLabel}`)
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: form
      })
      if (!res.ok) {
        const errText = await res.text()
        console.error(`[TG] sendDocument failed ${res.status}: ${errText.slice(0, 200)}`)
      }
    } catch (e) {
      console.error('[TG] sendDocument error:', e.message)
    }
  }
}

import {
  addHistory,
  getHistory,
  getMode
} from '~/server/utils/store.js';
import { sendOwnerCard } from '~/server/utils/telegram.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { sessionId, text } = body || {};

  if (!sessionId || !text || !text.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'sessionId and text are required' });
  }

  const cleanText = text.trim();

  const previousHistory = await getHistory(sessionId);
  await addHistory(sessionId, 'user', cleanText);

  const mode = await getMode(sessionId);

  if (mode === 'manual') {
    await sendOwnerCard({ sessionId, userText: cleanText, aiReply: null, mode: 'manual' });
    return {
      reply: 'Сообщение передано владельцу. Он ответит здесь.',
      mode: 'manual'
    };
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `Ты — консультант студии аквариумного дизайна Scaper's House (Калининград).
Отвечай только по-русски. Пиши тепло, живо, как эксперт-друг — не как робот. Без лишней официальности.
Без Markdown: никаких звёздочек, решёток, сносок [1][2], тире-списков. Только обычный текст.

Студия предлагает:
— Проектирование аквариумов под ключ (травники, природный стиль, офисные, домашние)
— Монтаж и запуск аквариумов
— Регулярное обслуживание (еженедельное, ежемесячное)
— Продажа аквариумов, оборудования, растений, рыб

Как консультировать:
— Помогай по темам: выбор аквариума, травники, фильтрация, освещение, CO2, грунты, растения, рыбы, запуск, обслуживание
— Если вопрос расплывчатый — задай 1-2 уточняющих вопроса, не больше
— По ценам: называй средние ориентировочные цены по рынку Калининграда, честно говори что точная стоимость зависит от объёма и комплектации — и предлагай оставить заявку для расчёта

Как собирать заявки:
— Если клиент хочет заказать или узнать точную цену — мягко предложи оставить заявку
— Для расчёта попроси: объём или размеры аквариума, место установки (дом/офис/ресторан), примерный бюджет
— В конце скажи: "Оставьте контакт или напишите нам в Telegram @scapers_house — рассчитаем под вас"

Никогда не придумывай конкретные цены на оборудование конкретных брендов.`
        },
        ...previousHistory.slice(-10).map(h => ({ role: h.role, content: h.content })),
        {
          role: 'user',
          content: cleanText
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Perplexity error:', response.status, errText);
    throw createError({ statusCode: 500, statusMessage: 'AI request failed' });
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || 'Не удалось получить ответ.';
  const reply = raw
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\[[\d,\s]+\]/g, '')
    .replace(/^[-•]\s/gm, '— ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  await addHistory(sessionId, 'assistant', reply);
  await sendOwnerCard({ sessionId, userText: cleanText, aiReply: reply, mode: 'ai' });

  return { reply, mode: 'ai' };
});

// api/telegram/route.js – JAVASCRIPT (без TS ошибок)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    const { question, aiAnswer, clientChatId, clientId } = data;
    
    console.log('📱 Уведомление:', { question: question?.slice(0,50), clientId });
    
    const telegramRes = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID,
        text: `🐟 *Клиент #${clientId}*\n\n❓ ${question}\n\n🤖 ${aiAnswer}\n\n💬 Ваш ответ:`,
        parse_mode: 'Markdown'
      })
    });
    
    const result = await telegramRes.json();
    console.log('Telegram result:', result.ok ? '✅' : '❌', result);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram error:', error);
    return NextResponse.json({ ok: false });
  }
}

// app/api/telegram/route.ts – НОВЫЙ
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { question, aiAnswer, clientChatId, clientId } = data;
    
    console.log('📱 Получено уведомление:', { question: question?.slice(0,50), clientId });
    
    // Отправляем владельцу
    const telegramRes = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID,
        text: `🐟 *Новый клиент #${clientId}*\n\n❓ *Вопрос*:\n${question}\n\n🤖 *ИИ ответил*:\n${aiAnswer}\n\n💬 Напишите ответ:`,
        parse_mode: 'Markdown'
      })
    });
    
    if (telegramRes.ok) {
      console.log('✅ Telegram отправлено!');
    } else {
      console.error('❌ Telegram error:', await telegramRes.text());
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram route error:', error);
    return NextResponse.json({ ok: false });
  }
}

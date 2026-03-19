// chat.js
const chatState = {
  open: false,
  history: []
};

function createChatElements() {
  const btn = document.createElement('button');
  btn.id = 'ai-chat-toggle';
  btn.textContent = 'Задать вопрос';
  document.body.appendChild(btn);

  const box = document.createElement('div');
  box.id = 'ai-chat-box';
  box.innerHTML = `
    <div class="ai-chat-header">
      <span>Консультант по аквариумам</span>
      <button class="ai-chat-close">×</button>
    </div>
    <div class="ai-chat-messages"></div>
    <form class="ai-chat-form">
      <input type="text" name="text" placeholder="Опишите задачу..." autocomplete="off" />
      <button type="submit">▶</button>
    </form>
  `;
  document.body.appendChild(box);

  btn.addEventListener('click', () => toggleChat(true));
  box.querySelector('.ai-chat-close').addEventListener('click', () => toggleChat(false));
  box.querySelector('.ai-chat-form').addEventListener('submit', onChatSubmit);
}

function toggleChat(open) {
  chatState.open = open;
  document.getElementById('ai-chat-box').classList.toggle('open', open);
}

function addMessage(role, text) {
  const wrap = document.querySelector('.ai-chat-messages');
  const el = document.createElement('div');
  el.className = `ai-chat-msg ai-chat-${role}`;
  el.textContent = text;
  wrap.appendChild(el);
  wrap.scrollTop = wrap.scrollHeight;
}

async function onChatSubmit(e) {
  e.preventDefault();
  const input = e.target.elements.text;
  const text = input.value.trim();
  if (!text) return;

  addMessage('user', text);
  input.value = '';
  chatState.history.push({ role: 'user', content: text });

  addMessage('assistant', 'Думаю над ответом...');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatState.history })
    });

    const data = await res.json();
    const reply = data.reply || 'Что-то пошло не так.';

    // заменяем последний "думаю..." на нормальный ответ
    const msgs = document.querySelectorAll('.ai-chat-msg.ai-chat-assistant');
    msgs[msgs.length - 1].textContent = reply;

    chatState.history.push({ role: 'assistant', content: reply });
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', createChatElements);

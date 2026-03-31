const chatState = {
  open: false,
  history: []
};

const sessionId =
  sessionStorage.getItem('scapers_chat_session') ||
  (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

sessionStorage.setItem('scapers_chat_session', sessionId);

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
  addMessage('assistant', 'Думаю над ответом...');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, text })
    });

    const data = await res.json();
    const reply = data.reply || 'Что-то пошло не так.';
    const msgs = document.querySelectorAll('.ai-chat-msg.ai-chat-assistant');
    msgs[msgs.length - 1].textContent = reply;
  } catch (err) {
    console.error(err);
    const msgs = document.querySelectorAll('.ai-chat-msg.ai-chat-assistant');
    msgs[msgs.length - 1].textContent = 'Ошибка соединения.';
  }
}

async function pollManualReplies() {
  try {
    const res = await fetch('/api/chat-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    const data = await res.json();
    (data.pending || []).forEach(msg => addMessage('assistant', msg.content));
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  createChatElements();
  setInterval(pollManualReplies, 4000);
});

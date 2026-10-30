const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const messagesElement = document.getElementById('messages');
const welcomeElement = document.getElementById('welcome');
const chatListElement = document.getElementById('chat-list');
const newChatButton = document.getElementById('new-chat');
const sidebar = document.getElementById('sidebar');
const mobileMenu = document.getElementById('mobile-menu');

const STORAGE_KEY = 'gatot_ai_chats_v1';
let chats = loadChats();
let currentChatId = chats[0]?.id ?? null;
let isSending = false;

function loadChats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveChats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function currentChat() {
  return chats.find(chat => chat.id === currentChatId);
}

function createChat() {
  const chat = { id: makeId(), title: 'Percakapan baru', conversation: [], updatedAt: Date.now() };
  chats.unshift(chat);
  currentChatId = chat.id;
  saveChats();
  renderAll();
  input.focus();
  sidebar.classList.remove('open');
}

function renderChatList() {
  chatListElement.replaceChildren();

  chats.forEach(chat => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chat-item${chat.id === currentChatId ? ' active' : ''}`;
    button.textContent = chat.title || 'Percakapan baru';
    button.title = button.textContent;
    button.addEventListener('click', () => {
      currentChatId = chat.id;
      renderAll();
      sidebar.classList.remove('open');
    });
    chatListElement.appendChild(button);
  });
}

function addMessage(role, text, extraClass = '') {
  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? 'K' : 'G';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${extraClass}`.trim();
  bubble.textContent = text;

  row.append(avatar, bubble);
  messagesElement.appendChild(row);
  messagesElement.scrollIntoView({ block: 'end', behavior: 'smooth' });
  return bubble;
}

function renderMessages() {
  messagesElement.replaceChildren();
  const chat = currentChat();
  const conversation = chat?.conversation ?? [];

  welcomeElement.hidden = conversation.length > 0;

  conversation.forEach(item => {
    addMessage(item.role === 'user' ? 'user' : 'assistant', item.text);
  });
}

function renderAll() {
  renderChatList();
  renderMessages();
}

function setLoading(loading) {
  isSending = loading;
  sendButton.disabled = loading;
  input.disabled = loading;
  sendButton.innerHTML = loading ? '…' : '<span>➤</span>';
}

function resizeInput() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
}

async function sendMessage(text) {
  const message = text.trim();
  if (!message || isSending) return;

  if (!currentChat()) {
    const chat = { id: makeId(), title: 'Percakapan baru', conversation: [], updatedAt: Date.now() };
    chats.unshift(chat);
    currentChatId = chat.id;
  }

  const chat = currentChat();
  chat.conversation.push({ role: 'user', text: message });

  if (chat.conversation.length === 1) {
    chat.title = message.length > 34 ? `${message.slice(0, 34)}…` : message;
  }

  chat.updatedAt = Date.now();
  saveChats();
  input.value = '';
  resizeInput();
  renderAll();

  const typingBubble = addMessage('assistant', 'GATOT AI sedang berpikir...', 'typing');
  setLoading(true);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let response;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: chat.conversation }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Server merespons dengan status ${response.status}.`);
    }

    const answer = data.result || data.reply;
    if (typeof answer !== 'string' || !answer.trim()) {
      throw new Error('Server tidak mengirimkan jawaban. Coba kirim ulang pesan.');
    }

    chat.conversation.push({ role: 'model', text: answer.trim() });
    chat.updatedAt = Date.now();
    saveChats();
    typingBubble.textContent = answer.trim();
    typingBubble.classList.remove('typing');
    renderChatList();
  } catch (error) {
    let message = error.message || 'Terjadi kesalahan yang tidak diketahui.';
    if (error.name === 'AbortError') {
      message = 'Permintaan terlalu lama (lebih dari 90 detik). Coba kirim pesan yang lebih singkat.';
    } else if (message === 'Failed to fetch') {
      message = 'Browser tidak dapat terhubung ke server. Pastikan terminal npm start masih berjalan dan halaman dibuka dari http://localhost:3000.';
    }
    typingBubble.textContent = `Maaf, ${message}`;
    typingBubble.classList.remove('typing');
    typingBubble.classList.add('error');
  } finally {
    setLoading(false);
    input.focus();
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener('input', resizeInput);
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

newChatButton.addEventListener('click', createChat);
mobileMenu.addEventListener('click', () => sidebar.classList.toggle('open'));

document.querySelectorAll('[data-prompt]').forEach(button => {
  button.addEventListener('click', () => sendMessage(button.dataset.prompt));
});

if (!chats.length) {
  createChat();
} else {
  renderAll();
}
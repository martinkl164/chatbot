// --- Config ---
// CONFIG structure:
//   api: { openrouter_url } - API endpoint configuration
//   ai: { model, temperature, max_tokens, etc } - AI model settings
let CONFIG = {
  api: { openrouter_url: "https://openrouter.ai/api/v1/chat/completions" },
  ai: { model: "openai/gpt-3.5-turbo", temperature: 0.7, max_tokens: 200, top_p: 1, frequency_penalty: 0, presence_penalty: 0 }
};
let SYSTEM_PROMPT = 'You are a proactive assistant helping users sell or buy cars. Use memory to drive the conversation.';
let ENV_API_KEY = null;

// Load configurations
fetch('config.json').then(r => r.json()).then(cfg => CONFIG = cfg).catch(() => {});
fetch('system_prompt.md').then(r => r.text()).then(p => SYSTEM_PROMPT = p.trim()).catch(() => {});
fetch('.env.local').then(r => r.text()).then(env => {
  const match = env.match(/OPENROUTER_API_KEY=(.+)/);
  if (match) ENV_API_KEY = match[1].trim();
}).catch(() => {});

// --- Memory ---
const MEMORY_KEY = 'carbot_memory_v1';
function getMemory() {
  return JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]');
}
function setMemory(memory) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}
function addToMemory(role, content) {
  const mem = getMemory();
  mem.push({ role, content });
  if (mem.length > 20) mem.shift(); // keep last 20
  setMemory(mem);
}
function clearMemory() {
  setMemory([]);
}

// --- Learning Loop: Extract Key Elements ---
function extractKeyElements(message) {
  // Simple: look for car, intent, recipient, etc.
  const lower = message.toLowerCase();
  const keys = {};
  if (lower.includes('wife')) keys.recipient = 'wife';
  if (lower.includes('husband')) keys.recipient = 'husband';
  if (lower.includes('buy')) keys.intent = 'buy';
  if (lower.includes('sell')) keys.intent = 'sell';
  if (lower.includes('gift')) keys.intent = 'gift';
  if (lower.includes('car')) keys.topic = 'car';
  return keys;
}
function storeKeyElements(elements) {
  let keys = JSON.parse(localStorage.getItem('carbot_keys') || '{}');
  keys = { ...keys, ...elements };
  localStorage.setItem('carbot_keys', JSON.stringify(keys));
}
function getKeyElements() {
  return JSON.parse(localStorage.getItem('carbot_keys') || '{}');
}

// --- UI ---
const chatArea = document.getElementById('chatArea');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');

function appendMessage(role, content) {
  const msg = document.createElement('div');
  msg.className = 'message ' + (role === 'user' ? 'user' : 'bot');
  msg.textContent = content;
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}
function showLoading() {
  appendMessage('bot', '...');
}
function removeLoading() {
  const last = chatArea.lastChild;
  if (last && last.textContent === '...') chatArea.removeChild(last);
}
function showProactiveGreeting() {
  if (getMemory().length === 0) {
    const greeting = "Hi! I'm your car selling assistant. What brings you here today?";
    appendMessage('bot', greeting);
    addToMemory('assistant', greeting);
  }
}

// --- API Key ---
function getApiKey() {
  return ENV_API_KEY;
}

// --- Chat Logic ---
chatForm.onsubmit = async e => {
  e.preventDefault();
  const msg = userInput.value.trim();
  if (!msg) return;
  appendMessage('user', msg);
  addToMemory('user', msg);
  storeKeyElements(extractKeyElements(msg));
  userInput.value = '';
  showLoading();
  const reply = await getBotReply();
  removeLoading();
  appendMessage('bot', reply);
  addToMemory('assistant', reply);
};

async function getBotReply() {
  const apiKey = getApiKey();
  if (!apiKey) return 'API key not configured. Please set OPENROUTER_API_KEY in .env.local (local) or GitHub Secrets (deployment).';
  const memory = getMemory();
  const keyElements = getKeyElements();
  // Build context prompt
  let context = SYSTEM_PROMPT;
  if (Object.keys(keyElements).length) {
    context += '\nKnown user info: ' + JSON.stringify(keyElements);
  }
  const messages = [
    { role: 'system', content: context },
    ...memory.slice(-10).map(m => ({ ...m, role: m.role === 'bot' ? 'assistant' : m.role }))
  ];
  try {
    const res = await fetch(CONFIG.api.openrouter_url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Car Seller Chatbot'
      },
      body: JSON.stringify({
        model: CONFIG.ai.model,
        messages,
        max_tokens: CONFIG.ai.max_tokens,
        temperature: CONFIG.ai.temperature,
        top_p: CONFIG.ai.top_p,
        frequency_penalty: CONFIG.ai.frequency_penalty,
        presence_penalty: CONFIG.ai.presence_penalty
      })
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Sorry, I did not understand.';
  } catch (e) {
    return 'Error contacting OpenRouter: ' + e.message;
  }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  // Migrate old 'bot' roles to 'assistant' in stored memory
  const mem = getMemory();
  if (mem.some(m => m.role === 'bot')) {
    setMemory(mem.map(m => ({ ...m, role: m.role === 'bot' ? 'assistant' : m.role })));
  }
  chatArea.innerHTML = '';
  showProactiveGreeting();
});

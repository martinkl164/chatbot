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
  clearKeyElements();
}

// --- Security: Input Sanitization ---
const MAX_INPUT_LENGTH = 500; // chars

// Injection-tag patterns to neutralize in user input before sending to API
const INJECTION_TAG_PATTERN = /<\/?\s*(system|memory|reply|prompt|instruction|context|assistant|user|role|input|output|cmd|command|task|tool)[^>]*>/gi;

function sanitizeUserInput(text) {
  // 1. Hard cap length
  let safe = text.slice(0, MAX_INPUT_LENGTH);
  // 2. Strip XML/HTML tags that could bleed into the prompt template
  safe = safe.replace(INJECTION_TAG_PATTERN, '');
  // 3. Remove null bytes and non-printable control characters (except newline/tab)
  safe = safe.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return safe.trim();
}

// --- Learning Loop: AI-driven Key Elements ---
const KEYS_STORAGE_KEY = 'carbot_keys';
const TRACKED_FIELDS = [
  'intent', 'budget', 'carType', 'make', 'model', 'year',
  'mileage', 'condition', 'timeline', 'location',
  'tradeIn', 'financing', 'sellerAsk', 'recipient'
];

// Allowlists for enum-typed fields — reject out-of-range values from AI
const FIELD_ALLOWLISTS = {
  intent:    ['buy', 'sell'],
  tradeIn:   ['yes', 'no'],
  financing: ['yes', 'no', 'cash']
};

// Per-field max string length — prevents runaway data storage
const FIELD_MAX_LENGTH = 80;

function getKeyElements() {
  return JSON.parse(localStorage.getItem(KEYS_STORAGE_KEY) || '{}');
}
function mergeKeyElements(newFields) {
  // Only accept known fields, validate values, merge into stored object
  const current = getKeyElements();
  const changed = {};
  for (const field of TRACKED_FIELDS) {
    const raw = newFields[field];
    if (raw === undefined || raw === null || raw === '') continue;
    // Must be a string
    if (typeof raw !== 'string') continue;
    // Check allowlist for enum fields
    if (FIELD_ALLOWLISTS[field] && !FIELD_ALLOWLISTS[field].includes(raw.toLowerCase())) continue;
    // Enforce max length per field
    const value = raw.slice(0, FIELD_MAX_LENGTH).trim();
    if (!value) continue;
    if (current[field] !== value) {
      changed[field] = value;
    }
    current[field] = value;
  }
  localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(current));
  return changed; // returns only fields that changed
}
function clearKeyElements() {
  localStorage.removeItem(KEYS_STORAGE_KEY);
}

// Parse <reply>...</reply> and <memory>{...}</memory> from raw AI output
function parseAIResponse(raw) {
  const replyMatch = raw.match(/<reply>\s*([\s\S]*?)\s*<\/reply>/i);
  const memoryMatch = raw.match(/<memory>\s*([\s\S]*?)\s*<\/memory>/i);
  const reply = replyMatch ? replyMatch[1].trim() : raw.trim();
  let memoryData = null;
  if (memoryMatch) {
    try { memoryData = JSON.parse(memoryMatch[1].trim()); } catch (e) {}
  }
  return { reply, memoryData };
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
function showMemoryToast(changedFields) {
  const toast = document.getElementById('memoryToast');
  if (!toast) return;
  const fieldLabels = {
    intent: 'Intent', budget: 'Budget', carType: 'Car type', make: 'Make',
    model: 'Model', year: 'Year', mileage: 'Mileage', condition: 'Condition',
    timeline: 'Timeline', location: 'Location', tradeIn: 'Trade-in',
    financing: 'Financing', sellerAsk: 'Asking price', recipient: 'Recipient'
  };
  const items = Object.entries(changedFields)
    .map(([k, v]) => `<li><strong>${fieldLabels[k] || k}:</strong> ${v}</li>`)
    .join('');
  toast.innerHTML = `<span class="toast-title">&#x1F9E0; Memory updated</span><ul>${items}</ul>`;
  toast.classList.remove('toast-hide');
  toast.classList.add('toast-show');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
  }, 4500);
}
function appendWelcomeMessage() {
  const welcome = document.createElement('div');
  welcome.className = 'welcome-message';
  welcome.innerHTML = `
    <div class="welcome-icon">&#x1F697;</div>
    <h2>Welcome to Car Seller Chatbot</h2>
    <p>I'm here to help you <strong>buy or sell a car</strong>.<br>Ask me anything to get started!</p>
  `;
  chatArea.appendChild(welcome);
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

// Character counter
const charCount = document.getElementById('charCount');
if (charCount) {
  userInput.addEventListener('input', () => {
    const len = userInput.value.length;
    charCount.textContent = `${len}/500`;
    charCount.classList.toggle('warn', len > 450);
  });
}

// --- Chat Logic ---
const sendButton = chatForm.querySelector('button[type="submit"]');

function setSending(isSending) {
  sendButton.disabled = isSending;
  userInput.disabled = isSending;
  sendButton.textContent = isSending ? '...' : 'Send';
}

chatForm.onsubmit = async e => {
  e.preventDefault();
  const raw = userInput.value.trim();
  if (!raw) return;
  const msg = sanitizeUserInput(raw);
  if (!msg) return;
  appendMessage('user', msg);
  addToMemory('user', msg);
  userInput.value = '';
  if (charCount) { charCount.textContent = '0/500'; charCount.classList.remove('warn'); }
  setSending(true);
  showLoading();
  const { reply, changedFields } = await getBotReply();
  removeLoading();
  setSending(false);
  appendMessage('bot', reply);
  addToMemory('assistant', reply);
  if (changedFields && Object.keys(changedFields).length > 0) {
    showMemoryToast(changedFields);
  }
  userInput.focus();
};

async function getBotReply() {
  const apiKey = getApiKey();
  if (!apiKey) return {
    reply: 'API key not configured. Please set OPENROUTER_API_KEY in .env.local (local) or GitHub Secrets (deployment).',
    changedFields: {}
  };

  const memory = getMemory();
  const keyElements = getKeyElements();

  // Build system message with known user context
  let context = SYSTEM_PROMPT;
  const knownFields = Object.entries(keyElements)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `  ${k}: ${v}`);
  if (knownFields.length) {
    context += '\n\n## Known user info:\n' + knownFields.join('\n');
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
    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || '';

    if (!raw) return { reply: 'Sorry, I did not understand.', changedFields: {} };

    const { reply, memoryData } = parseAIResponse(raw);

    // Merge extracted memory and collect changes
    let changedFields = {};
    if (memoryData && typeof memoryData === 'object') {
      changedFields = mergeKeyElements(memoryData);
      console.groupCollapsed('[CarBot] Memory updated');
      console.log('New fields:', changedFields);
      console.log('Full knowledge base:', getKeyElements());
      console.groupEnd();
    }

    return { reply, changedFields };
  } catch (e) {
    return { reply: 'Error contacting OpenRouter: ' + e.message, changedFields: {} };
  }
}

// --- Start Over ---
function startOver() {
  clearMemory();
  chatArea.innerHTML = '';
  appendWelcomeMessage();
  showProactiveGreeting();
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  // Migrate old 'bot' roles to 'assistant' in stored memory
  const mem = getMemory();
  if (mem.some(m => m.role === 'bot')) {
    setMemory(mem.map(m => ({ ...m, role: m.role === 'bot' ? 'assistant' : m.role })));
  }
  chatArea.innerHTML = '';
  appendWelcomeMessage();
  showProactiveGreeting();

  document.getElementById('startOverBtn').addEventListener('click', startOver);
});

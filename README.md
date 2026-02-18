# Car Seller Chatbot

A secure, proactive chatbot for buying and selling cars. Runs entirely in the browser — no backend required. Deployable to GitHub Pages.


https://github.com/user-attachments/assets/4cbaf527-82de-4a18-9530-9ee67f6e956d


## Features

- **AI-driven memory loop** — after every reply the AI extracts structured facts (budget, car type, make, model, timeline, etc.) and stores them in `localStorage`. Those facts are fed back into every subsequent request so the bot never asks the same question twice.
- **Secure system prompt** — hardened against prompt injection, jailbreak attempts, persona swaps, and topic drift. Bot stays strictly on car buying/selling.
- **Input sanitization** — XML injection tags stripped from user input; 500-character cap enforced at both HTML and JS layers.
- **Memory field validation** — only whitelisted field names and allowlisted enum values are accepted from AI output.
- **Send button lock** — input and button are disabled while a request is in flight; re-enabled and focused on reply.
- **Memory toast** — a non-intrusive badge appears top-right listing which facts were updated each turn, with a full console dump for debugging.
- **Configurable** — system prompt, model, temperature and all AI parameters are editable without touching code.
- **No backend** — pure client-side, zero dependencies.
- **OpenRouter integration** — compatible with any OpenAI-format model.
- **Responsive UI** — clean design, works on mobile and desktop.

## Quick Start

### Local Development

1. Copy `.env.local.example` to `.env.local` inside `frontend/`:
   ```bash
   cd frontend
   copy .env.local.example .env.local   # Windows
   cp .env.local.example .env.local     # Mac / Linux
   ```
2. Add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
   ```
3. Start a local server:
   ```bash
   python -m http.server 8000
   ```
4. Open http://localhost:8000

### GitHub Pages Deployment

1. Add repository secret `OPENROUTER_API_KEY` (Settings → Secrets and variables → Actions)
2. Enable GitHub Pages with source set to **GitHub Actions** (Settings → Pages)
3. Push to `main` — the workflow deploys automatically

See [SETUP.md](SETUP.md) for full step-by-step instructions.

## Configuration

### System Prompt

`frontend/system_prompt.md` controls the bot's identity, security rules, output format, and tracked fields. Edit it to adjust personality or add new fields. The file is loaded at runtime — refresh the page to apply changes.

### AI & API Settings

`frontend/config.json`:

```json
{
  "api": {
    "openrouter_url": "https://openrouter.ai/api/v1/chat/completions"
  },
  "ai": {
    "model": "openrouter/aurora-alpha",
    "temperature": 0.3,
    "max_tokens": 400,
    "top_p": 1,
    "frequency_penalty": 0.3,
    "presence_penalty": 0.1
  }
}
```

| Field | Value | Description |
|---|---|---|
| `model` | `openrouter/aurora-alpha` | Any OpenRouter-compatible model ID |
| `temperature` | `0.3` | Low creativity — keeps replies consistent and on-task. A sales assistant should be predictable, not creative. |
| `max_tokens` | `400` | Enough for a 2-3 sentence reply plus the memory JSON block. Trimmed from 500 to reduce cost without losing output quality. |
| `top_p` | `1` | Full token pool considered — no benefit to restricting this for a task-focused bot. |
| `frequency_penalty` | `0.3` | Mild penalty for repeating the same words. Prevents the bot from opening every reply with "Great choice!" or similar filler. |
| `presence_penalty` | `0.1` | Small nudge to vary follow-up questions across turns instead of cycling through the same ones. |

### API Key

- **Local:** `.env.local` file (never committed)
- **Deployed:** GitHub Secret `OPENROUTER_API_KEY` (injected at build time)

## How the Memory Loop Works

```
User sends message
  └─► sanitizeUserInput()       strip injection tags, cap at 500 chars
  └─► addToMemory('user', msg)  append to rolling 20-turn history
  └─► getBotReply()
        ├─ build system message = system_prompt.md + ## Known user info
        ├─ send last 10 turns to OpenRouter
        └─ receive raw response
              ├─ parseAIResponse()     extract <reply> and <memory> blocks
              ├─ mergeKeyElements()    validate + store new facts
              └─ showMemoryToast()     display changed fields
  └─► addToMemory('assistant', reply)  store clean reply text only
```

**Tracked fields:** `intent`, `budget`, `carType`, `make`, `model`, `year`, `mileage`, `condition`, `timeline`, `location`, `tradeIn`, `financing`, `sellerAsk`, `recipient`

**localStorage keys:**
- `carbot_memory_v1` — conversation history (last 20 turns)
- `carbot_keys` — accumulated user profile (14 fields)

## Security

| Layer | Mechanism |
|---|---|
| Prompt | Identity lock, topic restriction, injection pattern blacklist, no self-disclosure |
| Input | XML tag stripping, control character removal, 500-char hard cap |
| Memory | Field whitelist, enum allowlists (`intent`, `tradeIn`, `financing`), 80-char per-field cap |
| UI | `maxlength="500"` on input, send button disabled during requests |
| API key | Never in code; `.env.local` excluded from git; GitHub Secrets for deployment |

## Project Structure

```
chatbot/
├── frontend/
│   ├── index.html           # UI shell + memory toast element
│   ├── style.css            # Styles incl. disabled states + toast
│   ├── script.js            # Memory loop, sanitization, API, UI logic
│   ├── config.json          # API endpoint + AI parameters
│   ├── system_prompt.md     # Bot identity, security rules, output format
│   └── .env.local.example   # API key template
├── .github/workflows/
│   └── deploy.yml           # CI/CD: inject secret → build → deploy
├── README.md
├── SETUP.md
├── IMPLEMENTATION.md
└── TESTING.md
```

## Technology

- Pure HTML / CSS / JavaScript — no frameworks, no bundler
- `localStorage` for conversation history and user profile
- OpenRouter REST API (OpenAI-compatible)
- GitHub Actions + GitHub Pages for deployment

## License

MIT

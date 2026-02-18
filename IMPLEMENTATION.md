# Implementation Notes

## Architecture Overview

Pure client-side single-page application. No backend, no build step, no framework.

```
browser
  ├── fetch config.json        → AI parameters
  ├── fetch system_prompt.md   → bot identity + security rules
  ├── fetch .env.local         → API key (local dev)
  └── localStorage
        ├── carbot_memory_v1   → rolling 20-turn conversation history
        └── carbot_keys        → accumulated user profile (14 fields)
```

---

## Feature Implementation

### AI-Driven Memory Loop

The bot extracts structured user facts from every reply without a separate extraction call.

**How it works:**
1. The system prompt instructs the AI to respond in a strict two-block format:
   ```
   <reply>conversational text</reply>
   <memory>{"field": "value"}</memory>
   ```
2. `parseAIResponse()` in `script.js` regex-extracts both blocks from the raw API output.
3. `mergeKeyElements()` validates the JSON against a field whitelist + enum allowlists and merges changes into `localStorage['carbot_keys']`.
4. Changed fields are returned and passed to `showMemoryToast()` for UI feedback.
5. On each request, the accumulated profile is injected into the system message under `## Known user info:` so the AI never re-asks a known question.

**Tracked fields:** `intent`, `budget`, `carType`, `make`, `model`, `year`, `mileage`, `condition`, `timeline`, `location`, `tradeIn`, `financing`, `sellerAsk`, `recipient`

**Enum allowlists:**
- `intent`: `buy` | `sell`
- `tradeIn`: `yes` | `no`
- `financing`: `yes` | `no` | `cash`

### Prompt Security

`system_prompt.md` is structured in named sections:

| Section | Purpose |
|---|---|
| IDENTITY & IMMUTABLE ROLE | Permanent persona, cannot be overridden |
| SECURITY RULES | Injection patterns, topic lock, no self-disclosure |
| OPERATING INSTRUCTIONS | Dual-output contract (reply + memory) |
| REQUIRED OUTPUT FORMAT | Exact `<reply>`/`<memory>` template |
| TRACKED FIELDS | Authoritative field list |
| Known user info | Injected at runtime by `getBotReply()` |

### Input Sanitization

`sanitizeUserInput()` runs on every submission before anything touches memory or the API:
1. Hard-truncate to 500 characters
2. Strip XML/HTML tags matching injection-sensitive names (`<system>`, `<memory>`, `<reply>`, `<prompt>`, etc.)
3. Remove non-printable control characters (null bytes, escape sequences)

HTTP-level enforcement: `maxlength="500"` on the `<input>` element.

### Send Button Lock

`setSending(true/false)` disables both the text input and the Send button for the duration of every API call:
- Button label changes from `Send` → `...` while in-flight
- Both re-enable and input regains focus on completion
- Prevents duplicate submissions and queue build-up

### Memory Toast

`showMemoryToast(changedFields)` displays a fixed-position badge (top-right) listing each updated field and its new value. Auto-fades after 4.5 s. Simultaneously, a `console.groupCollapsed('[CarBot] Memory updated')` log prints new fields and the full current knowledge base.

### Conversation History

`localStorage['carbot_memory_v1']` stores `{role, content}` pairs. Capped at 20 entries (oldest dropped on overflow). Only the last 10 turns are sent with each API request to manage token usage. The stored `content` for assistant turns is the clean reply text only — never the raw `<reply>`/`<memory>` output.

---

## File Reference

| File | Role |
|---|---|
| `frontend/index.html` | Shell, `#chatArea`, `#chatForm`, `#memoryToast` |
| `frontend/style.css` | Layout, message bubbles, disabled states, toast animation |
| `frontend/script.js` | All logic: config loading, sanitization, memory, API, UI |
| `frontend/config.json` | API URL + AI parameters |
| `frontend/system_prompt.md` | Bot identity, security rules, output format, field schema |
| `frontend/.env.local.example` | Template for local API key |
| `.github/workflows/deploy.yml` | Injects GitHub Secret → builds `.env.local` → deploys to Pages |

---

## Security Model

| Threat | Mitigation |
|---|---|
| Prompt injection via user message | Injection tag stripping in `sanitizeUserInput()`; system prompt explicitly rejects instruction-like patterns |
| Jailbreak / persona swap | Named in system prompt; identity declared immutable |
| System prompt disclosure | System prompt instructs no self-disclosure; raw prompt never sent to client after load |
| Memory poisoning via AI output | Field whitelist + enum allowlists + 80-char cap in `mergeKeyElements()` |
| Token flooding / cost attack | 500-char input cap (HTML + JS) |
| API key exposure | Key only in `.env.local` (gitignored) or GitHub Secret; never in source |

---

## Configuration Values (current)

```json
{
  "model": "openrouter/aurora-alpha",
  "temperature": 0.7,
  "max_tokens": 500,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0
}
```

`max_tokens: 500` provides ~375 tokens for conversational reply and ~125 tokens for the JSON memory block — sufficient for concise 2–3 sentence replies.

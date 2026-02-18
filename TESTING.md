# Testing Checklist

## Local Testing
- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Add your OpenRouter API key to `.env.local`
- [ ] Run `python -m http.server 8000` in `frontend/` folder
- [ ] Visit http://localhost:8000
- [ ] Bot greets you proactively
- [ ] Send message: "I want to buy a car for my wife"
- [ ] Bot responds and asks follow-up questions
- [ ] Refresh page - conversation persists in memory
- [ ] Check localStorage (F12 → Application → localStorage) for:
  - `carbot_memory_v1` (conversation history)
  - `carbot_keys` (extracted key elements)

## Configuration Testing
- [ ] Edit `frontend/system_prompt.md` and change prompt
- [ ] Refresh browser and verify bot behavior changed
- [ ] Edit `frontend/config.json` and change `ai.temperature` to 1.5
- [ ] Refresh and verify responses are more creative
- [ ] Change `ai.model` in `config.json` to test different models

## GitHub Pages Testing
- [ ] Add `OPENROUTER_API_KEY` to repository secrets
- [ ] Enable GitHub Pages with "GitHub Actions" source
- [ ] Push to main branch
- [ ] Check Actions tab - deployment succeeds
- [ ] Visit GitHub Pages URL
- [ ] Bot works with API key from secret
- [ ] Test conversation flow

## Example Queries Testing
- [ ] "I want to buy a car for my wife" - Bot extracts intent=buy, recipient=wife
- [ ] "What will be the best gift for the New Year?" - Bot suggests car-related gifts
- [ ] Bot drives conversation proactively
- [ ] Bot asks relevant follow-up questions

## Memory & Learning Loop
- [ ] Send several messages mentioning "SUV", "budget $30k", "wife"
- [ ] Check localStorage `carbot_keys` - verify elements are stored
- [ ] Send new message - bot uses context from previous messages
- [ ] After 20+ messages, verify old messages are removed (keeps last 20)

## UI/UX Testing
- [ ] Messages display correctly (user: right/blue, bot: left/gray)
- [ ] Loading indicator shows while waiting for response
- [ ] Auto-scroll to bottom on new messages
- [ ] Input clears after sending message
- [ ] Responsive on mobile/tablet/desktop

## Pass Criteria
All critical features working:
- Proactive conversation ✓
- Memory persistence ✓
- Learning loop ✓
- Configurable prompt & settings ✓
- API key from .env.local OR GitHub secrets ✓

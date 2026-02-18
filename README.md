# Car Seller Chatbot

A simple, proactive chatbot for assisting users in selling and buying cars. Runs entirely in the browser, deployable to GitHub Pages.

## Features
- **Proactive conversation** - Bot initiates and drives the conversation
- **Memory** - Stores conversation history in browser localStorage (last 20 turns)
- **Learning loop** - Extracts key elements (intent, recipient, topic) and builds context
- **Configurable** - Customize system prompt, temperature, and AI model settings
- **No backend** - Runs entirely client-side
- **OpenRouter integration** - Direct REST API calls
- **Modern UI** - Clean, responsive design

## Quick Start

### Local Development
1. Copy `.env.local.example` to `.env.local` in the `frontend/` folder
2. Add your OpenRouter API key to `.env.local`:
   ```
   OPENROUTER_API_KEY=your_actual_key_here
   ```
3. Run local server:
   ```bash
   cd frontend
   python -m http.server 8000
   ```
4. Visit http://localhost:8000

### GitHub Pages Deployment
1. Create repository and push code
2. Go to repository Settings → Secrets and variables → Actions
3. Add secret: `OPENROUTER_API_KEY` with your OpenRouter API key
4. Go to Settings → Pages
5. Set source to "GitHub Actions"
6. Push to `main` branch - auto-deployment will trigger

See [SETUP.md](SETUP.md) for detailed instructions.

## Configuration

### System Prompt
Edit `frontend/system_prompt.md` to customize the bot's behavior and personality.

### AI Settings & API Configuration
Edit `frontend/config.json` to configure all settings:

**API Section (`api`):**
- `openrouter_url` - OpenRouter API endpoint

**AI Settings Section (`ai`):**
- `model` - AI model to use (default: `openai/gpt-3.5-turbo`)
- `temperature` - Response creativity (0-2, default: 0.7)
- `max_tokens` - Response length limit (default: 200)
- `top_p` - Nucleus sampling (0-1)
- `frequency_penalty` - Reduce repetition (-2 to 2)
- `presence_penalty` - Encourage new topics (-2 to 2)

### API Key Configuration
- **Local development:** Use `.env.local` file (copy from `.env.local.example`)
- **GitHub Pages:** Use GitHub Secrets (see SETUP.md)

## Project Structure
```
chatbot/
├── frontend/
│   ├── index.html           # Main UI
│   ├── style.css            # Styling
│   ├── script.js            # Logic, memory, API integration
│   ├── config.json          # API & AI settings (editable)
│   ├── system_prompt.md     # Bot system prompt (editable)
│   └── .env.local.example   # Environment template
├── .github/workflows/
│   └── deploy.yml           # Auto-deployment pipeline
├── README.md                # This file
├── SETUP.md                 # Setup instructions
└── assignment.md            # Original requirements
```

## Technology
- Pure HTML/CSS/JavaScript (no frameworks)
- localStorage for memory
- OpenRouter API for AI responses
- GitHub Actions for deployment
- GitHub Pages for hosting

## License
MIT

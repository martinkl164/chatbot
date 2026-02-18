# Setup Guide

## Prerequisites

- GitHub account
- OpenRouter account (free): https://openrouter.ai/
- Python 3 (for local development server)

---

## Local Development

### 1. Get an OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign up or log in
3. Navigate to **Keys**
4. Create a new API key and copy it

### 2. Configure the Local Environment

```bash
cd frontend
copy .env.local.example .env.local    # Windows
cp .env.local.example .env.local      # Mac / Linux
```

Edit `.env.local` and replace the placeholder:

```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

> `.env.local` is listed in `.gitignore` and will never be committed.

### 3. Start the Local Server

```bash
cd frontend
python -m http.server 8000
```

Visit http://localhost:8000

---

## GitHub Pages Deployment

### 1. Create a GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g. `car-seller-chatbot`)
3. Do **not** initialise with a README — the project already has one

### 2. Add the API Key as a GitHub Secret

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `OPENROUTER_API_KEY`
4. Value: your OpenRouter API key
5. Click **Add secret**

### 3. Enable GitHub Pages

1. Repository **Settings** → **Pages**
2. Under "Build and deployment" set Source to **GitHub Actions**
3. Save

### 4. Push the Code

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 5. Verify Deployment

1. Go to the **Actions** tab — watch the "Deploy to GitHub Pages" workflow
2. Green checkmark = deployed
3. **Settings** → **Pages** shows your live URL: `https://<username>.github.io/<repo>/`

---

## Configuration

### System Prompt

Edit `frontend/system_prompt.md` to adjust the bot's persona, security rules, output format, or tracked fields. Changes take effect on the next page load.

The file contains:
- **Identity & role** — CarBot, car buying/selling only
- **Security rules** — injection rejection, topic lock, no self-disclosure
- **Output format** — required `<reply>` / `<memory>` structure
- **Tracked fields** — the 14 user-profile fields the AI extracts

### AI Settings (`frontend/config.json`)

```json
{
  "api": {
    "openrouter_url": "https://openrouter.ai/api/v1/chat/completions"
  },
  "ai": {
    "model": "openrouter/aurora-alpha",
    "temperature": 0.7,
    "max_tokens": 500,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0
  }
}
```

| Field | Description |
|---|---|
| `model` | Any OpenRouter model ID |
| `temperature` | 0 = precise, 2 = creative |
| `max_tokens` | 500 recommended — covers reply + memory JSON |
| `top_p` | Nucleus sampling |
| `frequency_penalty` | Reduce repetition |
| `presence_penalty` | Encourage new topics |

---

## Updating a Deployment

```bash
git add .
git commit -m "Describe your change"
git push
```

GitHub Actions rebuilds and redeploys automatically.

---

## Troubleshooting

### "API key not configured"
- **Local:** confirm `frontend/.env.local` exists and contains `OPENROUTER_API_KEY=your_key`
- **Deployed:** confirm the `OPENROUTER_API_KEY` secret is set in repository Settings → Secrets

### Deployment fails
- Check the **Actions** tab for error details
- Confirm GitHub Pages is enabled with **GitHub Actions** as the source
- Public repositories work on the free plan; private repositories require GitHub Pro

### Bot does not respond
- Open DevTools → **Console** — look for errors
- Open DevTools → **Network** — inspect the failed OpenRouter request
- Confirm your OpenRouter account is active and has credits

### Memory not updating
- Open DevTools → **Console** — the `[CarBot] Memory updated` log group shows extracted fields after each reply
- Open DevTools → **Application** → **localStorage** — inspect `carbot_keys`
- If the AI reply doesn't contain a `<memory>` block the toast won't appear; no new facts were extracted that turn

### Changes not appearing after deploy
- Hard-refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- Wait 1–2 minutes for GitHub Pages CDN to propagate

---

## Security Notes

- Never commit `.env.local` to git (it is in `.gitignore`)
- Never hardcode the API key in any source file
- GitHub Secrets are encrypted at rest and redacted from logs
- The system prompt enforces topic lock and injection resistance; see `system_prompt.md` for details

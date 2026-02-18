# Setup Guide

## Prerequisites
- GitHub account
- OpenRouter account (free): https://openrouter.ai/

## Local Development Setup

### 1. Get OpenRouter API Key
1. Go to https://openrouter.ai/
2. Sign up or log in
3. Navigate to Keys section
4. Create a new API key
5. Copy the key

### 2. Configure Local Environment
1. Navigate to `frontend/` folder
2. Copy `.env.local.example` to `.env.local`:
   ```bash
   cd frontend
   copy .env.local.example .env.local    # Windows
   # or
   cp .env.local.example .env.local      # Linux/Mac
   ```
3. Edit `.env.local` and replace `your_api_key_here` with your actual OpenRouter API key:
   ```
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
   ```

### 3. Run Locally
```bash
cd frontend
python -m http.server 8000
```
Visit http://localhost:8000

**Note:** `.env.local` is in `.gitignore` and will NOT be committed to git.

## GitHub Pages Deployment

### 1. Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., "car-seller-chatbot")
3. Do NOT initialize with README (we already have one)

### 2. Add OpenRouter API Key as GitHub Secret
**IMPORTANT:** For the chatbot to work on GitHub Pages, you must add your API key as a secret.

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `OPENROUTER_API_KEY`
5. Value: Your OpenRouter API key (e.g., `sk-or-v1-xxxxxxxxxxxxx`)
6. Click **Add secret**

### 3. Enable GitHub Pages with Actions
1. Go to repository **Settings** → **Pages**
2. Under "Build and deployment", set Source to: **GitHub Actions**
3. Save

### 4. Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Car seller chatbot"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 5. Verify Deployment
1. Go to **Actions** tab in your repository
2. You should see "Deploy to GitHub Pages" workflow running
3. Wait for green checkmark (deployment complete)
4. Go to **Settings** → **Pages** to get your site URL
5. Visit: `https://<your-username>.github.io/<your-repo>/`

### 6. Test the Chatbot
1. Open your deployed site
2. The chatbot should load and greet you
3. Start chatting!

**Note:** The API key from GitHub Secrets will be automatically injected during deployment.

## Configuration

### Customize System Prompt
Edit `frontend/system_prompt.md` to change how the bot behaves:
```
You are a proactive assistant helping users sell or buy cars...
```

### Adjust AI Settings & API Configuration
Edit `frontend/config.json` to configure all settings:
```json
{
  "api": {
    "openrouter_url": "https://openrouter.ai/api/v1/chat/completions"
  },
  "ai": {
    "model": "openai/gpt-3.5-turbo",
    "temperature": 0.7,
    "max_tokens": 200,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0
  }
}
```

**API settings (`api` section):**
- `openrouter_url` - OpenRouter API endpoint URL

**AI settings (`ai` section):**
- `model` - Which AI model to use (see OpenRouter for options)
- `temperature` - Creativity/randomness (0 = focused, 2 = creative)
- `max_tokens` - Maximum response length
- `top_p` - Nucleus sampling (0-1)
- `frequency_penalty` - Reduce repetition (-2 to 2)
- `presence_penalty` - Encourage new topics (-2 to 2)

## Updating Your Deployment

After making changes to code or configuration:
```bash
git add .
git commit -m "Your changes description"
git push
```

The GitHub Actions workflow will automatically redeploy.

## Troubleshooting

### "API key not configured" message
- **Local:** Check that `.env.local` exists in `frontend/` folder with correct key format: `OPENROUTER_API_KEY=your_key`
- **GitHub Pages:** Verify `OPENROUTER_API_KEY` secret is set in repository Settings → Secrets → Actions

### Deployment fails
- Check **Actions** tab for error messages
- Verify GitHub Pages is enabled with "GitHub Actions" as source
- Ensure repository is public (or you have GitHub Pro for private repos)

### Bot doesn't respond
- Open browser console (F12) → Console tab
- Look for errors
- Check Network tab for failed API requests
- Verify OpenRouter account is active and has credits

### Changes not appearing
- Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Wait a few minutes for GitHub Pages to rebuild

## Security Notes

- Never commit `.env.local` to git (it's in `.gitignore`)
- Never hardcode API keys in code
- GitHub Secrets are encrypted and secure

## Get Help

- Check OpenRouter documentation: https://openrouter.ai/docs
- Review GitHub Actions logs in **Actions** tab
- Check browser console for JavaScript errors

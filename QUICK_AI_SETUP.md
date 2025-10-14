# ⚡ Quick AI Setup (5 Minutes)

## Step 1: Get Google AI API Key (2 min)

1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy your key (starts with `AIza...`)

## Step 2: Add API Key to Supabase (1 min)

1. Open: https://supabase.com/dashboard
2. Select your project
3. Go to: **Settings** → **Edge Functions** → **Secrets**
4. Click "Add Secret"
   - Name: `GOOGLE_AI_API_KEY`
   - Value: (paste your API key)
5. Click "Save"

## Step 3: Deploy Functions (1 min)

### Windows:
```cmd
deploy_ai_functions.bat
```

### Mac/Linux:
```bash
chmod +x deploy_ai_functions.sh
./deploy_ai_functions.sh
```

## Step 4: Test It! (1 min)

### Web App:
```bash
cd web
npm run dev
```
Open: http://localhost:3000/dashboard/ai-copilot

### Mobile App:
```bash
cd mobile
flutter run
```

## ✅ Done!

Your AI Copilot is now powered by real Google AI!

**Try asking:**
- "Help me create an invoice"
- "Show me sales analysis"
- "Generate a business report"

---

**Need help?** See `AI_COPILOT_REAL_AI_SETUP.md` for detailed guide.


# ✅ Complete Setup Checklist

## 📋 Follow These Steps in Order:

---

## ✅ Step 1: Database Setup (5 minutes)

### 1.1 Open Supabase SQL Editor
Go to: https://app.supabase.com → Your Project → SQL Editor

### 1.2 Run Workshop Table Script
```sql
-- Copy contents from: supabase/create_workshop_table_with_data.sql
-- Paste in SQL Editor
-- Click "Run"
-- ✅ Result: 48 workshop records inserted
```

### 1.3 Run FAQ Table Script
```sql
-- Copy contents from: supabase/insert_faq_data.sql
-- Paste in SQL Editor
-- Click "Run"
-- ✅ Result: 37 FAQ records inserted
```

### 1.4 Verify Data
```sql
-- Check workshop count
SELECT COUNT(*) FROM workshop;
-- Should show: 48

-- Check FAQ count
SELECT COUNT(*) FROM faq;
-- Should show: 37
```

✅ **Database Ready!**

---

## ✅ Step 2: Environment Setup (2 minutes)

### 2.1 Create .env.local File
Location: `/Users/roadserve/Downloads/astric/web/.env.local`

### 2.2 Add These Keys:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Google AI (for chatbot)
GOOGLE_AI_API_KEY=your_google_ai_key_here

# Site Config
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Astric.ai
NODE_ENV=development
```

### 2.3 Get Your Keys:

**Supabase Keys:**
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy "Project URL" and "anon public" key

**Google AI Key:**
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (FREE!)

✅ **Environment Configured!**

---

## ✅ Step 3: Run the Application (1 minute)

### 3.1 Open Terminal
```bash
cd /Users/roadserve/Downloads/astric/web
```

### 3.2 Install Dependencies (if needed)
```bash
npm install
```

### 3.3 Start Dev Server
```bash
npm run dev
```

### 3.4 Open Browser
Visit: **http://localhost:3000**

✅ **App Running!**

---

## ✅ Step 4: Test Chatbots (2 minutes)

### Test 1: Floating Chatbot (Purple Circle)
1. ✅ Look for purple button (bottom-right corner)
2. ✅ Click it
3. ✅ Type: "Show me workshops in Mumbai"
4. ✅ Should list Mumbai workshops
5. ✅ Type: "What is MY FNG?"
6. ✅ Should give FAQ answer

### Test 2: Header Chatbot ("Ask AI" Button)
1. ✅ Look for "Ask AI" button in header
2. ✅ Click it (large modal opens)
3. ✅ Type: "Do you provide doorstep service?"
4. ✅ Should give FAQ answer
5. ✅ Type: "Where is your Pune workshop?"
6. ✅ Should list Pune workshops

✅ **Chatbots Working!**

---

## 🎯 Quick Troubleshooting:

### Issue: "Missing Supabase environment variables"
**Fix:** Check `.env.local` file exists in `/web` folder

### Issue: "Google AI API key not configured"
**Fix:** Add `GOOGLE_AI_API_KEY` to `.env.local` and restart server

### Issue: No data in chatbot responses
**Fix:** Run the SQL scripts in Supabase SQL Editor

### Issue: Chat button doesn't appear
**Fix:** Clear browser cache (Ctrl+Shift+R) and refresh

---

## 📊 What You Get:

### 🗄️ Database:
- ✅ 48 workshop locations (Mumbai, Pune, Thane)
- ✅ 37 FAQ records (MY FNG car service)
- ✅ RLS policies for security
- ✅ Public read access

### 🤖 Chatbots:
- ✅ Floating chatbot (purple button, bottom-right)
- ✅ Header chatbot ("Ask AI" button)
- ✅ AI-powered responses (Google Gemini)
- ✅ Database integration
- ✅ Smart search

### 🎨 Features:
- ✅ Find workshops by location
- ✅ Answer FAQs automatically
- ✅ Multilingual (English + Hindi)
- ✅ No login required
- ✅ Beautiful UI
- ✅ Mobile responsive

---

## 🎊 Success Checklist:

Mark these off as you complete them:

- [ ] Supabase workshop table created (48 records)
- [ ] Supabase FAQ table created (37 records)
- [ ] `.env.local` file created with all keys
- [ ] `npm run dev` running successfully
- [ ] Homepage opens at localhost:3000
- [ ] Floating chatbot (purple button) visible
- [ ] "Ask AI" header button visible
- [ ] Workshop queries work
- [ ] FAQ queries work
- [ ] Both chatbots respond correctly

---

## 📚 Reference Documentation:

| File | Purpose |
|------|---------|
| `✅_DATABASE_READY.md` | Complete database guide |
| `🚀_START_HERE.md` | Detailed setup instructions |
| `QUICK_START_3_STEPS.md` | Simplest setup guide |
| `TWO_CHATBOTS_EXPLAINED.md` | Chatbot comparison |
| `CHATBOT_SETUP_COMPLETE.md` | Advanced chatbot guide |

---

## 🚀 You're Done!

If all checkboxes are ✅, you have:
- **Working database** with 48 workshops + 37 FAQs
- **2 AI chatbots** ready to help users
- **Smart search** that queries your data
- **Beautiful UI** that's mobile responsive

**Start asking questions to your chatbot!** 🤖

---

## 💬 Example Questions to Test:

### Workshop Queries:
- "Show me workshops in Mumbai"
- "Where is your Andheri location?"
- "List all Pune workshops"
- "Give me workshop near Thane"

### FAQ Queries:
- "What is MY FNG?"
- "Do you provide doorstep service?"
- "What services do you provide?"
- "Do you give warranty?"
- "How does the service process work?"

### Combined Queries:
- "Do you have workshops in Pune and what's the warranty?"
- "Show me Mumbai locations and tell me about your services"

---

**Need help? Check the documentation files above!**

**Happy building! 🚀✨**


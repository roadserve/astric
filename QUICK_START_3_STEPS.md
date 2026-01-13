# ⚡ Quick Start - 3 Steps Only!

## 🎯 Get Your AI Chatbot Running in 5 Minutes

---

## Step 1️⃣: Setup Database (2 minutes)

Go to your **Supabase SQL Editor** and run:

```sql
-- File: supabase/setup_chatbot_tables.sql
-- (Copy and paste the entire file contents)
```

This creates the `workshop`, `price`, and `faq` tables with sample data.

✅ **Done? Great! Tables are ready.**

---

## Step 2️⃣: Add API Keys (2 minutes)

Create file: `/Users/roadserve/Downloads/astric/web/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
GOOGLE_AI_API_KEY=your_google_ai_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Astric.ai
NODE_ENV=development
```

**Get Keys:**
- **Supabase**: https://app.supabase.com → Your Project → Settings → API
- **Google AI**: https://aistudio.google.com/app/apikey (Free!)

✅ **Done? Perfect! Configuration ready.**

---

## Step 3️⃣: Run the App (1 minute)

Open Terminal:

```bash
cd /Users/roadserve/Downloads/astric/web
npm run dev
```

Open browser: **http://localhost:3000**

✅ **Done? Amazing! Look for the purple chat button! 🤖**

---

## 🎉 That's It!

You now have a **working AI chatbot** on your homepage!

### Try These Questions:
- "What workshops do you offer?"
- "How much does it cost?"
- "Tell me about your pricing"
- "What is Astric.ai?"

---

## 🆘 Having Issues?

### Issue: "Missing Supabase environment variables"
**Fix**: Make sure `.env.local` exists in the `/web` folder and has the correct keys.

### Issue: "Google AI API key not configured"
**Fix**: Add `GOOGLE_AI_API_KEY` to `.env.local` and restart server.

### Issue: Chat button doesn't appear
**Fix**: 
1. Check browser console (F12)
2. Make sure you're on http://localhost:3000
3. Clear cache (Ctrl+Shift+R)

### Issue: No data in responses
**Fix**: Run the SQL script in Supabase SQL Editor.

---

## 📚 More Info?

Check these detailed guides:
- **🚀_START_HERE.md** - Comprehensive setup
- **✅_CHATBOT_READY.md** - Complete documentation
- **CHATBOT_SETUP_COMPLETE.md** - Advanced customization

---

## 🎊 Your Chatbot Features:

✅ AI-powered (Google Gemini)  
✅ Searches your database  
✅ Beautiful UI  
✅ No login required  
✅ Mobile friendly  
✅ Real-time responses  

---

**Questions? All the docs are in the project folder!**

**Happy chatting! 🚀**


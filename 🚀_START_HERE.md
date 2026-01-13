# 🚀 START HERE - Quick Setup Guide

## ✨ What's New: AI Chatbot Added!

I've added an **AI-powered chatbot** to your Astric homepage that answers questions using your Supabase data:
- ✅ Queries `workshop`, `price`, and `faq` tables
- ✅ Beautiful floating chat button
- ✅ Powered by Google Gemini AI
- ✅ Works without login

---

## 🎯 Two Ways to Run:

### Option 1: Automated Setup (Recommended)

```bash
cd /Users/roadserve/Downloads/astric
./SETUP_AND_RUN.sh
```

This script will:
- Create `.env.local` template if needed
- Check dependencies
- Start the dev server

### Option 2: Manual Setup

Follow the steps below:

---

## 📋 Manual Setup Steps

### Step 1: Create Environment File

```bash
cd /Users/roadserve/Downloads/astric/web
```

Create a file named `.env.local` with this content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google AI API Key (for Gemini AI Chatbot)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Astric.ai
NODE_ENV=development
```

### Step 2: Get Your API Keys

#### Supabase Keys:
1. Go to https://app.supabase.com
2. Select your project
3. Click **Settings** → **API**
4. Copy:
   - **Project URL** → Put in `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Put in `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Google AI Key (for Chatbot):
1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy the key → Put in `GOOGLE_AI_API_KEY`

### Step 3: Run the Project

```bash
cd /Users/roadserve/Downloads/astric/web
npm run dev
```

### Step 4: Open in Browser

Visit: **http://localhost:3000**

Look for the **purple chat button** in the bottom-right corner! 🤖

---

## 🎨 What You'll See

1. **Homepage** - Beautiful landing page with all features
2. **Chat Button** - Purple floating button (bottom-right)
3. **AI Chatbot** - Click to open and ask questions!

---

## 💬 Try These Questions in the Chatbot:

- "What workshops do you offer?"
- "How much does it cost?"
- "What are your pricing plans?"
- "Tell me about training programs"
- "What's included in the subscription?"

The AI will search your Supabase tables and give accurate answers!

---

## 🗄️ Database Tables Required

Make sure these tables exist in Supabase with **RLS enabled for public SELECT**:

### 1. `workshop` table
Example columns:
- `title` or `name`
- `description`
- `price`
- `duration`
- `date`
- `location`

### 2. `price` table
Example columns:
- `name` or `plan_name`
- `price`
- `description`
- `features`
- `billing_period`

### 3. `faq` table
Required columns:
- `question`
- `answer`

---

## 🔧 Enable Public Access to Tables

Run this in Supabase SQL Editor:

```sql
-- Allow public to read workshop data
CREATE POLICY "Public can view workshops"
ON workshop FOR SELECT
TO public
USING (true);

-- Allow public to read pricing data
CREATE POLICY "Public can view pricing"
ON price FOR SELECT
TO public
USING (true);

-- Allow public to read FAQs
CREATE POLICY "Public can view FAQs"
ON faq FOR SELECT
TO public
USING (true);
```

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables" error:
- Make sure `.env.local` file exists in `/web` directory
- Check that you replaced `your_supabase_project_url_here` with actual URL
- Restart the dev server after editing `.env.local`

### "Google AI API key not configured" error:
- Add `GOOGLE_AI_API_KEY` to `.env.local`
- Get free key from https://aistudio.google.com/app/apikey
- Restart dev server

### Chat button doesn't appear:
- Check browser console (F12) for errors
- Make sure you're on the homepage (http://localhost:3000)
- Clear browser cache and refresh

### No data in chatbot responses:
- Verify your tables exist in Supabase
- Check RLS policies allow public SELECT
- Make sure tables have data

---

## 📁 Files Created/Modified

### New Files:
- ✅ `/web/components/chatbot.tsx` - Chatbot UI component
- ✅ `/web/app/api/chat/route.ts` - API endpoint for AI
- ✅ `/CHATBOT_SETUP_COMPLETE.md` - Detailed documentation
- ✅ `/SETUP_AND_RUN.sh` - Automated setup script

### Modified Files:
- ✅ `/web/app/page.tsx` - Added chatbot to homepage

---

## 🎉 That's It!

You're all set! The chatbot will:
- ✅ Answer questions using your database
- ✅ Provide accurate information about workshops, pricing, FAQs
- ✅ Work for all visitors (no login required)
- ✅ Look beautiful and professional

---

## 📚 Additional Documentation

- **Complete Chatbot Guide**: See `CHATBOT_SETUP_COMPLETE.md`
- **Project README**: See `README.md`
- **Quick Start**: See `QUICK_START_GUIDE.md`

---

## 🆘 Need Help?

If something doesn't work:
1. Check the terminal for error messages
2. Open browser DevTools (F12) → Console tab
3. Verify all API keys are correct in `.env.local`
4. Make sure you restarted the dev server after editing `.env.local`

---

**Happy coding! 🚀**


# 🤖 AI Chatbot Setup Complete! 

## ✅ What's Been Done

I've successfully added an AI-powered chatbot to your Astric homepage that can answer questions using data from your Supabase tables:
- **workshop** table
- **price** table  
- **faq** table

### Files Created/Modified:

1. **`/web/components/chatbot.tsx`** - Beautiful floating chatbot UI component
2. **`/web/app/api/chat/route.ts`** - API endpoint that queries Supabase and uses AI
3. **`/web/app/page.tsx`** - Homepage updated with chatbot

---

## 🚀 How to Run Locally

### Step 1: Set Up Environment Variables

Create a `.env.local` file in the `/web` directory:

```bash
cd /Users/roadserve/Downloads/astric/web
```

Create the file with these contents (replace with your actual values):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google AI API Key (for Gemini)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Astric.ai
NODE_ENV=development
```

**Where to get these keys:**

1. **Supabase Keys:**
   - Go to https://app.supabase.com
   - Select your project
   - Click Settings → API
   - Copy "Project URL" and "anon/public" key

2. **Google AI API Key (Gemini):**
   - Go to https://aistudio.google.com/app/apikey
   - Create a new API key
   - Copy the key

### Step 2: Install Dependencies

```bash
cd /Users/roadserve/Downloads/astric/web
npm install
```

### Step 3: Run the Development Server

```bash
npm run dev
```

The app will start at: **http://localhost:3000**

---

## 🎯 How the Chatbot Works

### User Experience:
1. **Floating Button**: A purple chat button appears in the bottom-right corner
2. **Click to Open**: Opens a beautiful chat interface
3. **AI-Powered**: Uses Google's Gemini AI to answer questions
4. **Data-Driven**: Queries your Supabase tables for accurate answers

### Technical Flow:
```
User Question 
    ↓
Chatbot Component (chatbot.tsx)
    ↓
API Endpoint (/api/chat/route.ts)
    ↓
Query Supabase Tables (workshop, price, faq)
    ↓
Build Context from Data
    ↓
Send to Google Gemini AI
    ↓
Get AI Response
    ↓
Display to User
```

### Smart Query Logic:
- **Workshop queries**: Detects keywords like "workshop", "training", "course"
- **Pricing queries**: Detects "price", "pricing", "cost", "plan", "subscription"
- **FAQ matching**: Searches FAQ table for relevant questions/answers
- **Context-aware**: AI uses database data to give accurate answers

---

## 💡 Example Questions to Ask:

- "What workshops do you offer?"
- "How much does it cost?"
- "What are your pricing plans?"
- "Tell me about your training programs"
- "What's included in the subscription?"
- Any question from your FAQ table!

---

## 🎨 Features of the Chatbot:

✅ Beautiful gradient design matching your brand  
✅ Smooth animations and transitions  
✅ Mobile responsive  
✅ Auto-scroll to latest message  
✅ Loading indicators  
✅ Error handling  
✅ Conversation history  
✅ Clean, modern UI with user/bot avatars  

---

## 🔧 Customization Options

### Change Chatbot Colors:
Edit `/web/components/chatbot.tsx`:
```tsx
// Line 56: Change gradient colors
className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
```

### Change AI Model:
Edit `/web/app/api/chat/route.ts`:
```typescript
// Line 124: Change model
`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_KEY}`

// Options: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash
```

### Modify System Prompt:
Edit `/web/app/api/chat/route.ts` around line 49-64 to customize how the AI responds.

---

## 📊 Database Tables Required

Make sure these tables exist in your Supabase:

### 1. **workshop** table
Should contain workshop/training information:
- `title` or `name` - Workshop name
- `description` - What it's about
- `price` - Cost
- `duration` - How long
- `date` - When it happens
- `location` - Where

### 2. **price** table  
Should contain pricing/plan information:
- `name` or `plan_name` - Plan name
- `price` - Cost
- `description` - What's included
- `features` - Feature list
- `billing_period` - Monthly/Yearly

### 3. **faq** table
Should contain FAQ entries:
- `question` - The question
- `answer` - The answer

**Note:** The chatbot will work even if some fields are missing, it just won't show that information.

---

## 🔒 Security Notes

- The chatbot works without user login (public access)
- Make sure your Supabase RLS (Row Level Security) policies allow public read access to workshop, price, and faq tables
- The GOOGLE_AI_API_KEY is kept server-side only (not exposed to browser)

---

## 🐛 Troubleshooting

### Chatbot button doesn't appear:
- Check browser console for errors
- Make sure you imported Chatbot component in page.tsx

### "Google AI API key not configured" error:
- Add `GOOGLE_AI_API_KEY` to your `.env.local` file
- Restart the dev server after adding environment variables

### "Supabase configuration missing" error:
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
- Make sure the keys start with `NEXT_PUBLIC_` (these are exposed to browser)

### No data in responses:
- Check that your tables exist in Supabase
- Verify RLS policies allow public SELECT access
- Check table/column names match what's in the code

### API errors:
- Open browser DevTools → Network tab
- Send a message in the chatbot
- Check the `/api/chat` request for error details

---

## 📈 Next Steps / Enhancements

Want to make it even better? Here are some ideas:

1. **Add more tables**: Modify `/web/app/api/chat/route.ts` to query additional tables
2. **User authentication**: Connect to user profiles for personalized responses
3. **Analytics**: Track what questions users ask most
4. **Voice input**: Add speech-to-text functionality
5. **File uploads**: Allow users to upload documents
6. **Multi-language**: Add language detection and translation
7. **Email integration**: Send conversation transcripts via email
8. **Suggested questions**: Show quick-reply buttons with common questions

---

## 📞 Need Help?

If you encounter any issues:
1. Check the console logs in your browser (F12 → Console)
2. Check the terminal where `npm run dev` is running
3. Verify all environment variables are set correctly
4. Make sure your Supabase tables are accessible

---

## 🎉 You're All Set!

Your AI chatbot is ready to go! Just:
1. Set up your `.env.local` file
2. Run `npm run dev`
3. Visit http://localhost:3000
4. Click the chat button in the bottom-right corner

Enjoy your new AI-powered assistant! 🚀


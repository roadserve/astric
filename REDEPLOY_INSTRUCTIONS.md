# 🚀 Redeploy Edge Functions

## Via Supabase Dashboard:

1. **Go to:** https://supabase.com/dashboard/project/YOUR_PROJECT/functions

2. **For each function (`ai_chat`, `ai_reply_suggest`, `ai_invoice_parse`):**
   - Click on the function name
   - Click "Deploy new version" or "Redeploy"
   - Confirm deployment

3. **Or use the Supabase CLI if installed:**
   ```bash
   npx supabase functions deploy ai_chat
   npx supabase functions deploy ai_reply_suggest
   npx supabase functions deploy ai_invoice_parse
   ```

## After Deployment:

1. Wait 30 seconds for functions to start
2. Refresh your web app: http://localhost:3000/dashboard/ai-copilot
3. Clear browser cache (Ctrl + Shift + R)
4. Try asking: "Hello, what can you help me with?"

✅ You should now get REAL AI responses!


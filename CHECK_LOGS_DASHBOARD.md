# 📊 Check Logs via Supabase Dashboard

## ✅ **Current Status:**
- ✅ Meta sending webhooks (events visible in Meta Dashboard)
- ✅ Latest message: "Nnn" at 03:50:10
- ❌ Supabase CLI not installed
- ❌ Need to check logs via Dashboard

---

## 🔍 **Step 1: Check Supabase Dashboard Logs**

### **A. Go to Supabase Dashboard:**

1. **Open:** https://supabase.com/dashboard/project/nazedodnkzkuxvsuedmb
2. **Click:** "Edge Functions" (left sidebar)
3. **Click:** "Functions"
4. **Click:** `webhook_inbound` function
5. **Click:** "Logs" tab

### **B. Check Recent Logs:**

**Look for:**
- `🔔 ========== WEBHOOK RECEIVED ==========`
- `📦 Payload object: whatsapp_business_account`
- `📨 Found 1 message(s) in webhook`

**If you see these:** ✅ Webhooks reaching Supabase!
**If you don't see these:** ❌ Webhooks not reaching Supabase

---

## 🔍 **Step 2: Real-Time Test**

### **A. Keep Dashboard Open:**

1. **Supabase Dashboard:** Edge Functions → `webhook_inbound` → Logs tab
2. **Keep this tab open**

### **B. Send Test Message:**

1. **From WhatsApp:** Send message to Business number
2. **Immediately check:** Supabase Dashboard logs
3. **Should see:** New log entry within 2-3 seconds

**Expected Log:**
```
🔔 ========== WEBHOOK RECEIVED ==========
📦 Payload object: whatsapp_business_account
📨 Found 1 message(s) in webhook
Handling incoming message: { phoneNumber: "+917007543565", messageId: "wamid.xxx" }
```

---

## 🔍 **Step 3: Check Meta Activity Log**

1. **Meta Dashboard:** Activity log (left sidebar, bottom)
2. **Filter:** Select "Webhooks"
3. **Check recent deliveries:**
   - ✅ **Green entries** = Meta successfully sent
   - ❌ **Red entries** = Failed (check error)

**If Green but Supabase logs empty:**
- Meta sending ✅
- But not reaching Supabase ❌
- **Check:** Webhook URL mismatch

---

## 🔧 **Possible Issues:**

### **Issue 1: Webhook URL Mismatch**

**Check:**
1. **Meta Dashboard:** Webhooks page → Callback URL
2. **Should be exactly:**
   ```
   https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound
   ```
3. **No trailing slash**
4. **HTTPS (not HTTP)**

### **Issue 2: Function Not Deployed**

**Fix:**
- Use Supabase Dashboard to deploy
- Or install Supabase CLI:
  ```bash
  npm install -g supabase
  ```

### **Issue 3: Network/Firewall**

- Supabase Edge Functions publicly accessible hain
- Firewall blocking nahi hona chahiye

---

## ✅ **Quick Test:**

1. **Open:** Supabase Dashboard → Edge Functions → `webhook_inbound` → Logs
2. **Send:** Message from WhatsApp
3. **Watch:** Logs tab for new entries
4. **Check:** Meta Activity Log for delivery status

---

## 🎯 **Next Steps:**

1. **Check Supabase Dashboard logs** - See if webhooks reaching
2. **Verify Meta webhook URL** - Exact match karein
3. **Test real-time** - Send message and watch logs
4. **Check Meta Activity Log** - See delivery status

---

**Last Updated:** Dashboard logs checking guide


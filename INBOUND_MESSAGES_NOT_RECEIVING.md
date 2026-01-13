# 🔍 Inbound Messages Not Receiving - Debug Guide

## ❌ **Problem:**
- ✅ Outbound messages ja rahe hain (send working)
- ❌ Inbound messages nahi aa rahe
- ❌ Status updates nahi aa rahe
- ❌ Webhook logs nahi aa rahe

---

## 🔍 **Root Cause:**
Meta se webhook calls hi nahi aa rahe hain. Ye possible reasons:

1. **Meta not sending webhooks:**
   - Webhook not verified properly
   - App still in Development mode
   - Phone Number ID not registered for webhooks

2. **Webhook URL not accessible:**
   - Supabase Edge Function not deployed
   - Network/firewall blocking
   - URL wrong

---

## 🧪 **Step-by-Step Testing:**

### **Step 1: Test Webhook Manually (MOST IMPORTANT)**

1. **Meta Dashboard:** Webhooks page
2. **Find:** `messages` field
3. **Click:** "Test" button (next to Subscribe toggle)
4. **Check Supabase logs immediately:**
   ```bash
   cd /Users/roadserve/Downloads/astric/supabase
   supabase functions logs webhook_inbound --tail
   ```

**Expected:**
```
🔔 ========== WEBHOOK RECEIVED ==========
📦 Payload object: whatsapp_business_account
🔍 Processing webhook field: messages
📨 Found 1 message(s) in webhook
```

**If you see this:** ✅ Webhook function is working!
**If you don't see this:** ❌ Webhook not reaching Supabase

---

### **Step 2: Check Meta Activity Log**

1. **Meta Dashboard:** Left sidebar → "Activity log" (bottom)
2. **Filter:** Select "Webhooks"
3. **Check recent activity:**

**What to Look For:**
- ✅ **Green entries** = Meta successfully sent webhooks
- ❌ **Red entries** = Meta tried but failed (check error)
- ⚠️ **No entries** = Meta not sending webhooks

**If Green Entries:**
- Meta is sending ✅
- But not reaching Supabase ❌
- **Check:** Webhook URL, network

**If Red Entries:**
- Meta tried but failed ❌
- **Check:** Error message in Activity Log
- **Common errors:**
  - 404 Not Found = Wrong URL
  - 403 Forbidden = Token mismatch
  - 500 Internal Server Error = Function error

**If No Entries:**
- Meta not sending ❌
- **Possible reasons:**
  - App still in Development mode
  - Webhook not verified
  - Phone Number ID issue

---

### **Step 3: Verify Webhook URL**

**Test URL in browser:**
```
https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound
```

**Expected:** Error message (like "Method not allowed" for GET)
**If 404:** Edge Function not deployed

**Redeploy if needed:**
```bash
cd /Users/roadserve/Downloads/astric/supabase
supabase functions deploy webhook_inbound
```

---

### **Step 4: Real-time Monitoring**

**Open terminal:**
```bash
cd /Users/roadserve/Downloads/astric/supabase
supabase functions logs webhook_inbound --tail
```

**Send message from another phone:**
1. **From WhatsApp:** Send message to your Business number
2. **Watch terminal:** Should see webhook within 2-3 seconds

**Expected:**
```
🔔 ========== WEBHOOK RECEIVED ==========
📦 Payload object: whatsapp_business_account
📨 Found 1 message(s) in webhook
Handling incoming message: { phoneNumber: "+91xxx", messageId: "wamid.xxx" }
```

---

### **Step 5: Check Webhook Configuration**

**Meta Dashboard → Webhooks:**

1. **Product:** "Whatsapp Business Account" selected ✅
2. **Callback URL:** 
   ```
   https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound
   ```
   - ✅ Should match exactly
   - ✅ No trailing slash
   - ✅ HTTPS (not HTTP)

3. **Verify Token:**
   - ✅ Database se match karein
   - ✅ Same token in Meta Dashboard

4. **Subscribed Fields:**
   - ✅ `messages` field subscribed (MUST BE ON)

---

## 🔧 **Common Fixes:**

### **Fix 1: Re-verify Webhook**

1. **Meta Dashboard:** Remove subscription
2. **Wait:** 1 minute
3. **Re-add:**
   - Callback URL: `https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound`
   - Verify Token: Database se copy karein
4. **Click:** "Verify and Save"
5. **Subscribe:** To `messages` field

### **Fix 2: Check App Mode**

1. **Meta Dashboard:** Check App Mode toggle
2. **Should be:** "Live" (not Development)
3. **If Development:** Switch to Live

### **Fix 3: Verify Phone Number ID**

1. **Check:** Settings page mein Phone Number ID
2. **Verify:** Same Phone Number ID registered in Meta Dashboard
3. **Check:** Phone Number ID active hai ya nahi

---

## 📊 **Expected Flow:**

```
1. Someone sends message to your Business number
   ↓
2. Meta receives message
   ↓
3. Meta sends webhook to your URL (1-2 seconds)
   ↓
4. webhook_inbound receives
   ↓
5. handleIncomingMessage processes
   ↓
6. Database saves message
   ↓
7. Real-time subscription updates UI
   ↓
8. Message appears in conversations
```

---

## ✅ **Testing Checklist:**

- [ ] Test webhook manually (Meta Dashboard → Test button)
- [ ] Check Supabase logs for test webhook
- [ ] Check Meta Activity Log for webhook deliveries
- [ ] Verify webhook URL in browser
- [ ] Send message from another phone
- [ ] Monitor Supabase logs in real-time
- [ ] Check database for incoming messages

---

## 🎯 **Most Likely Issue:**

**Meta is not sending webhooks.** 

**Check Meta Activity Log first** - ye sabse important hai. Agar waha bhi logs nahi hain, to Meta hi webhooks nahi bhej raha.

**Possible reasons:**
1. App still in Development mode
2. Webhook not properly verified
3. Phone Number ID not registered for webhooks
4. Account restrictions

---

**Last Updated:** Complete debugging guide for inbound messages


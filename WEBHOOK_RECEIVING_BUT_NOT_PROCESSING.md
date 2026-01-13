# 🔍 Webhook Receiving But Not Processing - Fix Guide

## ✅ **Good News:**
- ✅ Meta is sending webhooks (events visible in Meta Dashboard)
- ✅ Latest event: Incoming message "Hhb" from +917007543565
- ✅ Payload structure correct: `whatsapp_business_account` with `messages` field

## ❌ **Problem:**
- ❌ Webhooks not reaching Supabase logs
- ❌ Inbound messages not appearing in UI

---

## 🔍 **Possible Causes:**

### **1. Webhook URL Mismatch**
- Meta Dashboard mein URL: Check karein exact URL
- Supabase Edge Function URL: Should match exactly

### **2. Supabase Edge Function Not Accessible**
- Function not deployed
- Network/firewall blocking
- URL wrong

### **3. Webhook Function Error**
- Function receiving but crashing
- Error not logged properly
- Response not 200 OK

---

## 🧪 **Step 1: Verify Webhook URL**

### **A. Check Meta Dashboard URL:**
1. **Meta Dashboard:** Webhooks page
2. **Check:** Callback URL field
3. **Should be:** `https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound`

### **B. Test URL in Browser:**
```
https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound
```

**Expected:** Error message (like "Method not allowed" for GET)
**If 404:** Edge Function not deployed

**Redeploy:**
```bash
cd /Users/roadserve/Downloads/astric/supabase
supabase functions deploy webhook_inbound
```

---

## 🧪 **Step 2: Check Supabase Logs**

### **A. Real-time Monitoring:**
```bash
cd /Users/roadserve/Downloads/astric/supabase
supabase functions logs webhook_inbound --tail
```

### **B. Send Test Message:**
1. **From WhatsApp:** Send message to Business number
2. **Watch terminal:** Should see webhook within 2-3 seconds

**Expected:**
```
🔔 ========== WEBHOOK RECEIVED ==========
📦 Payload object: whatsapp_business_account
📨 Found 1 message(s) in webhook
Handling incoming message: { phoneNumber: "+917007543565", messageId: "wamid.xxx" }
```

---

## 🔧 **Step 3: Check Webhook Response**

Meta expects **200 OK** response. Agar function error de raha hai, Meta retry karega but eventually stop kar dega.

### **Check Function Response:**
Webhook function should return:
```json
{ "success": true }
```

With status: `200 OK`

---

## 🔧 **Step 4: Verify Phone Number ID**

Meta payload mein dikh raha hai:
```json
"phone_number_id": "884937351372876"
```

**Check:**
1. **Settings page:** Phone Number ID match karein
2. **Database:** `whatsapp_accounts` table mein same `phone_number_id` hai ya nahi

**If mismatch:**
- Webhook function phone_number_id se account find nahi kar payega
- Message save nahi hoga

---

## 🐛 **Common Issues:**

### **Issue 1: URL Mismatch**
**Symptoms:**
- Meta sending webhooks ✅
- Supabase logs empty ❌

**Fix:**
- Verify exact URL in Meta Dashboard
- Should match Supabase Edge Function URL exactly
- No trailing slash
- HTTPS (not HTTP)

### **Issue 2: Function Not Deployed**
**Symptoms:**
- Browser test: 404 error
- Meta webhooks: Not reaching

**Fix:**
```bash
cd /Users/roadserve/Downloads/astric/supabase
supabase functions deploy webhook_inbound
```

### **Issue 3: Phone Number ID Mismatch**
**Symptoms:**
- Webhooks reaching ✅
- Messages not saving ❌
- Logs show: "WhatsApp account not found"

**Fix:**
- Check Settings page: Phone Number ID
- Check Database: `whatsapp_accounts.phone_number_id`
- Should match Meta payload: `884937351372876`

---

## 📊 **Expected Flow:**

```
1. Message sent to Business number
   ↓
2. Meta receives message
   ↓
3. Meta sends webhook to your URL
   ↓
4. Supabase Edge Function receives
   ↓
5. Logs show: "🔔 WEBHOOK RECEIVED"
   ↓
6. handleIncomingMessage processes
   ↓
7. Database saves message
   ↓
8. Real-time subscription updates UI
```

---

## ✅ **Quick Fix Checklist:**

- [ ] Verify webhook URL in Meta Dashboard
- [ ] Test URL in browser (should not be 404)
- [ ] Redeploy Edge Function if needed
- [ ] Check Phone Number ID matches
- [ ] Monitor Supabase logs in real-time
- [ ] Send test message and watch logs

---

## 🎯 **Most Likely Issue:**

Based on your Meta Dashboard events, **Meta is sending webhooks correctly**. 

**Check:**
1. **Webhook URL:** Exact match karein Meta Dashboard aur Supabase ke beech
2. **Phone Number ID:** Database mein same ID hai ya nahi (`884937351372876`)
3. **Edge Function:** Properly deployed hai ya nahi

---

**Last Updated:** Fix guide for webhooks receiving but not processing


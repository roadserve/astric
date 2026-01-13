# 🔍 Webhook Status Debug Guide

## ❌ **Problem:**
Message send ho raha hai, lekin status updates (delivered/read) nahi aa rahe hain.

## 🔍 **Root Cause:**
Meta se webhook calls nahi aa rahe hain. Ye possible reasons ho sakte hain:

1. ❌ Webhook URL properly configured nahi hai
2. ❌ `message_status` event subscribe nahi hai
3. ❌ Webhook URL wrong hai ya accessible nahi hai

---

## ✅ **Step-by-Step Fix:**

### **Step 1: Get Your Webhook URL** 🔗

Your webhook URL should be:
```
https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound
```

**Verify:**
1. Go to: Supabase Dashboard → Edge Functions → `webhook_inbound`
2. Copy the URL from there
3. Test in browser: Should return `Method not allowed` (this is correct for GET request)

---

### **Step 2: Configure Webhook in Meta Dashboard** ⚙️

1. **Go to:** https://developers.facebook.com/apps
2. **Select your WhatsApp app**
3. **Go to:** WhatsApp → Configuration
4. **Scroll to "Webhook" section**
5. **Click "Edit"**

6. **Enter:**
   - **Callback URL:** `https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound`
   - **Verify Token:** (Get from Settings page - `webhook_verify_token` field)

7. **Click "Verify and Save"**
   - ✅ Should show "Webhook verified successfully"

---

### **Step 3: Subscribe to Events** 📋

**CRITICAL:** After verification, you MUST subscribe to events:

1. **In the same Webhook section**, scroll down to **"Webhook fields"**
2. **Click "Manage"** or **"Subscribe"**
3. **Check these boxes:**
   - ✅ `messages` - For incoming messages
   - ✅ `message_status` - **THIS IS CRITICAL FOR STATUS UPDATES**
   - ✅ `message_template_status_update` - For template approval
   - ✅ `account_update` - For account changes

4. **Click "Save"**

**⚠️ IMPORTANT:** Agar `message_status` subscribe nahi hai, to status updates nahi aayenge!

---

### **Step 4: Verify Webhook is Working** ✅

#### **A. Check Webhook Logs:**

1. **Go to:** Supabase Dashboard → Edge Functions → `webhook_inbound` → Logs
2. **Send a test message**
3. **Check logs:**
   - Should see: `🔔 ========== WEBHOOK RECEIVED ==========`
   - Should see: `📊 Processing X status update(s)`

#### **B. Check Meta Webhook Logs:**

1. **Go to:** Meta Developers → Your App → WhatsApp → Configuration
2. **Scroll to "Webhook" section**
3. **Click "View webhook logs"** or **"Test webhook"**
4. **Check recent deliveries:**
   - ✅ Green = Success
   - ❌ Red = Failed (check error message)

---

### **Step 5: Test Status Updates** 🧪

1. **Send a message** from your CRM to a WhatsApp number
2. **Check webhook logs** (should see status updates):
   ```
   📊 Processing 1 status update(s)
   📨 Handling message status update: { whatsappMessageId: "wamid.xxx", status: "sent" }
   📊 Processing 1 status update(s)
   📨 Handling message status update: { whatsappMessageId: "wamid.xxx", status: "delivered" }
   ```

3. **Check UI:** Status should update in real-time:
   - Sent → Single checkmark (gray)
   - Delivered → Double checkmark (gray)
   - Read → Double checkmark (blue)

---

## 🐛 **Common Issues & Fixes:**

### **Issue 1: No webhook logs at all**
**Cause:** Webhook URL wrong ya accessible nahi hai
**Fix:**
- Verify webhook URL is correct
- Check Supabase Edge Function is deployed
- Test URL in browser (should return error, not 404)

### **Issue 2: Webhook verified but no status updates**
**Cause:** `message_status` event subscribe nahi hai
**Fix:**
- Go to Meta Dashboard → Webhook → Subscribe to `message_status`
- Save and wait 1-2 minutes

### **Issue 3: Webhook calls failing**
**Cause:** Verify token mismatch
**Fix:**
- Check `webhook_verify_token` in database matches Meta dashboard
- Re-verify webhook in Meta dashboard

### **Issue 4: Status updates received but UI not updating**
**Cause:** Real-time subscription issue
**Fix:**
- Check browser console for errors
- Verify Supabase Realtime is enabled
- Refresh page

---

## 📊 **Debug Commands:**

### **Check Recent Messages:**
```sql
SELECT 
  id, 
  message_id, 
  whatsapp_message_id, 
  status, 
  delivered_at, 
  read_at,
  created_at
FROM whatsapp_messages 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Check Webhook Logs:**
```bash
supabase functions logs webhook_inbound --tail
```

### **Check Status Logs:**
```sql
SELECT * 
FROM whatsapp_message_status_log 
ORDER BY timestamp DESC 
LIMIT 20;
```

---

## ✅ **Expected Flow:**

```
1. Send Message
   ↓
2. WhatsApp API receives message
   ↓
3. Meta sends webhook: status = "sent"
   ↓
4. webhook_inbound function receives it
   ↓
5. Database updates: status = "sent"
   ↓
6. Real-time subscription triggers
   ↓
7. UI updates: Single checkmark (gray)
   ↓
8. Meta sends webhook: status = "delivered" (1-2 seconds later)
   ↓
9. Database updates: status = "delivered", delivered_at = timestamp
   ↓
10. UI updates: Double checkmark (gray)
    ↓
11. When recipient reads: status = "read"
    ↓
12. UI updates: Double checkmark (blue)
```

---

## 🎯 **Quick Checklist:**

- [ ] Webhook URL configured in Meta Dashboard
- [ ] Webhook verified successfully
- [ ] `message_status` event subscribed
- [ ] `messages` event subscribed
- [ ] Webhook URL accessible (test in browser)
- [ ] Edge Function deployed
- [ ] Webhook logs showing incoming calls
- [ ] Status updates appearing in logs

---

## 📞 **Still Not Working?**

1. **Check Meta Webhook Logs:**
   - Go to Meta Dashboard → Webhook → View logs
   - Check for errors

2. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for errors or missing logs

3. **Test Webhook Manually:**
   - Use Meta's "Test webhook" feature
   - Send a test event

4. **Verify Database:**
   - Check `whatsapp_accounts` table has correct `webhook_verify_token`
   - Check `whatsapp_messages` table has `message_id` populated

---

**Last Updated:** After adding enhanced logging to webhook function


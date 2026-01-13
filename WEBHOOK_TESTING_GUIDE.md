# 🧪 Webhook Testing Guide - After Setup

## ✅ **Current Status:**
- ✅ "Whatsapp Business Account" product selected
- ✅ Webhook URL configured
- ✅ Verify token set
- ✅ `messages` field subscribed
- ❌ Status updates still not coming

---

## 🧪 **Step 1: Test Webhook Manually**

### **A. Test from Meta Dashboard:**

1. **Meta Dashboard:** Webhooks page
2. **Find:** `messages` field in the list
3. **Click:** "Test" button (next to Subscribe toggle)
4. **Wait:** 1-2 seconds

### **B. Check Supabase Logs:**

```bash
cd /Users/roadserve/Downloads/astric/supabase
supabase functions logs webhook_inbound --tail
```

**Expected Output:**
```
🔔 ========== WEBHOOK RECEIVED ==========
📦 Payload object: whatsapp_business_account
🔍 Processing webhook field: messages
📋 Full value object: { ... }
```

**If you see this:** ✅ Webhook function is working!
**If you don't see this:** ❌ Webhook not reaching Supabase

---

## 🧪 **Step 2: Send Real Message and Monitor**

### **A. Open Terminal for Real-time Monitoring:**

```bash
cd /Users/roadserve/Downloads/astric/supabase
supabase functions logs webhook_inbound --tail
```

### **B. Send Message from CRM:**

1. **Go to:** `/dashboard/whatsapp/conversations`
2. **Send a test message**
3. **Watch terminal** - Should see webhook within 2-3 seconds

**Expected Logs:**
```
🔔 ========== WEBHOOK RECEIVED ==========
📦 Payload object: whatsapp_business_account
📊 ✅ FOUND 1 STATUS UPDATE(S) IN WEBHOOK!
📊 Status update details: { id: "wamid.xxx", status: "sent" }
✅ Updated message status to sent
```

---

## 🔍 **Step 3: Check Meta Activity Log**

### **A. Go to Activity Log:**

1. **Meta Dashboard:** Left sidebar → "Activity log" (bottom)
2. **Filter:** Select "Webhooks"
3. **Check recent activity:**

**What to Look For:**
- ✅ **Green entries** = Meta successfully sent webhooks
- ❌ **Red entries** = Meta tried but failed (check error message)
- ⚠️ **No entries** = Meta not sending webhooks

### **B. If Green Entries:**

- Meta is sending webhooks ✅
- But not reaching Supabase ❌
- **Check:** Webhook URL, network, firewall

### **C. If Red Entries:**

- Meta tried to send but failed ❌
- **Check:** Error message in Activity Log
- **Common errors:**
  - 404 Not Found = Wrong URL
  - 403 Forbidden = Token mismatch
  - 500 Internal Server Error = Function error

### **D. If No Entries:**

- Meta not sending webhooks ❌
- **Possible reasons:**
  - App still in Development mode
  - Phone Number ID not registered
  - Account restrictions

---

## 🔍 **Step 4: Verify Message ID Matching**

### **A. Check Database:**

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
LIMIT 5;
```

**Check:**
- ✅ `message_id` populated hai ya nahi
- ✅ `whatsapp_message_id` populated hai ya nahi
- ✅ `status` field update ho raha hai ya nahi

### **B. If message_id Missing:**

- WhatsApp API se message_id nahi mil raha
- **Check:** `whatsapp_send` function logs
- **Expected:** `whatsappMessageId: "wamid.xxx"`

---

## 🐛 **Common Issues & Fixes:**

### **Issue 1: Test Webhook Works But Production Doesn't**

**Symptoms:**
- ✅ Test webhook: Works
- ❌ Production webhooks: Not coming

**Possible Causes:**
1. App still in Development mode
2. Phone Number ID not registered for webhooks
3. Account restrictions

**Fix:**
- Check App Mode: Should be "Live"
- Verify Phone Number ID in Meta Dashboard
- Check account status

### **Issue 2: Webhooks Coming But Status Not Updating**

**Symptoms:**
- ✅ Webhooks received in logs
- ❌ Database status not updating

**Possible Causes:**
1. Message ID mismatch
2. Database update failing
3. Real-time subscription not working

**Fix:**
- Check message_id matching in logs
- Check database update errors
- Verify real-time subscription

### **Issue 3: No Webhooks At All**

**Symptoms:**
- ❌ No webhooks in Supabase logs
- ❌ No entries in Meta Activity Log

**Possible Causes:**
1. Webhook not verified
2. App not published
3. Phone Number ID issue

**Fix:**
- Re-verify webhook
- Check app status
- Verify Phone Number ID

---

## 📊 **Expected Flow:**

```
1. Send Message
   ↓
2. WhatsApp API accepts (immediate)
   ↓
3. Meta sends webhook: status = "sent" (1-2 seconds)
   ↓
4. webhook_inbound receives
   ↓
5. Database updates: status = "sent"
   ↓
6. Real-time subscription updates UI
   ↓
7. Meta sends webhook: status = "delivered" (2-3 seconds)
   ↓
8. Database updates: status = "delivered"
   ↓
9. UI updates: Double checkmark (gray)
```

---

## ✅ **Testing Checklist:**

- [ ] Test webhook manually (Meta Dashboard → Test button)
- [ ] Check Supabase logs for test webhook
- [ ] Send real message from CRM
- [ ] Monitor Supabase logs in real-time
- [ ] Check Meta Activity Log for webhook deliveries
- [ ] Verify message_id in database
- [ ] Check status updates in UI

---

## 🎯 **Next Steps:**

1. **Test webhook manually** - Verify function is working
2. **Check Meta Activity Log** - See if Meta is sending
3. **Send test message** - Monitor logs in real-time
4. **Check database** - Verify message_id and status

---

**Last Updated:** Complete testing guide after webhook setup


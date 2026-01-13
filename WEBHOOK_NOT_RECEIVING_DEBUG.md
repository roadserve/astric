# 🔍 Webhook Not Receiving - Complete Debug Guide

## ❌ **Problem:**
- ✅ Message send ho raha hai
- ✅ Send logs aa rahe hain
- ❌ Inbound webhook logs nahi aa rahe
- ❌ Status updates (delivered/read) nahi pata chal rahe

---

## 🔍 **Step-by-Step Debugging:**

### **Step 1: Check Meta Activity Log (MOST IMPORTANT)**

1. **Go to:** Meta Dashboard
2. **Click:** "Activity log" (left sidebar, bottom)
3. **Filter:** Select "Webhooks"
4. **Check recent activity:**
   - ✅ **Green entries** = Meta successfully sent webhooks
   - ❌ **Red entries** = Meta tried but failed (check error)
   - ⚠️ **No entries** = Meta not sending webhooks at all

**Ye sabse important step hai!**

---

### **Step 2: Test Webhook Manually**

1. **Meta Dashboard:** WhatsApp → Configuration → Webhook
2. **Scroll to:** "Webhook fields" section
3. **Find:** `messages` field
4. **Click:** "Test" button (next to Subscribe toggle)
5. **Wait:** 1-2 seconds
6. **Check Supabase logs:**
   ```bash
   supabase functions logs webhook_inbound --tail
   ```

**Expected:**
```
🔔 ========== WEBHOOK RECEIVED ==========
📦 Payload object: whatsapp_business_account
```

**If this works:** Webhook function is fine, Meta is not sending production webhooks
**If this doesn't work:** Webhook function or URL issue

---

### **Step 3: Verify Webhook URL**

**Test URL in browser:**
```
https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound
```

**Expected:** Error message (like "Method not allowed" for GET request)
**If 404:** Edge Function not deployed

**Redeploy if needed:**
```bash
cd /Users/roadserve/Downloads/astric/supabase
supabase functions deploy webhook_inbound
```

---

### **Step 4: Check Webhook Configuration**

**Meta Dashboard → WhatsApp → Configuration → Webhook:**

1. **Callback URL:** 
   ```
   https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound
   ```
   - ✅ Should match exactly
   - ✅ No trailing slash
   - ✅ HTTPS (not HTTP)

2. **Verify Token:**
   - ✅ Database se `webhook_verify_token` copy karein
   - ✅ Meta Dashboard mein same token hai ya nahi check karein

3. **Subscribed Fields:**
   - ✅ `messages` field subscribed hai (MUST BE ON)
   - ✅ Other fields optional

---

### **Step 5: Re-verify Webhook**

1. **Meta Dashboard:** Remove subscription
2. **Wait:** 1 minute
3. **Re-add:**
   - Callback URL: `https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound`
   - Verify Token: Database se copy karein
4. **Click:** "Verify and Save"
5. **Subscribe:** To `messages` field
6. **Save**

---

### **Step 6: Check Phone Number ID**

**Important:** Status updates only come for messages sent from the correct Phone Number ID.

1. **Check:** Settings page mein Phone Number ID
2. **Verify:** Same Phone Number ID use ho raha hai message send mein
3. **Check:** Meta Dashboard mein same Phone Number ID registered hai

---

## 🧪 **Quick Test:**

### **Test 1: Send Message and Monitor**

1. **Open terminal:**
   ```bash
   cd /Users/roadserve/Downloads/astric/supabase
   supabase functions logs webhook_inbound --tail
   ```

2. **Send message** from CRM

3. **Watch terminal:**
   - Should see `🔔 WEBHOOK RECEIVED` within 2-3 seconds
   - If not, Meta is not sending webhooks

### **Test 2: Check Meta Activity Log**

1. **Send message** from CRM
2. **Immediately check:** Meta Dashboard → Activity log → Webhooks
3. **Look for:** Recent webhook delivery entry
   - ✅ Green = Success (but not reaching Supabase?)
   - ❌ Red = Failed (check error message)
   - ⚠️ No entry = Meta not sending

---

## 🐛 **Common Issues & Fixes:**

### **Issue 1: Meta Sending But Not Reaching**

**Symptoms:**
- Meta Activity Log: Green entries
- Supabase Logs: No webhook received

**Possible Causes:**
1. **Network/Firewall blocking**
2. **Supabase Edge Function not accessible**
3. **Webhook URL wrong**

**Fix:**
- Test webhook URL in browser
- Check Supabase Edge Function is deployed
- Verify URL matches exactly

### **Issue 2: Meta Not Sending At All**

**Symptoms:**
- Meta Activity Log: No entries
- Supabase Logs: No webhook received

**Possible Causes:**
1. **App not published** (but you said it's live)
2. **Webhook not verified**
3. **Events not subscribed**
4. **Phone Number ID mismatch**

**Fix:**
- Re-verify webhook
- Check `messages` field subscribed
- Verify Phone Number ID matches

### **Issue 3: Test Webhook Works But Production Doesn't**

**Symptoms:**
- Test webhook: Works ✅
- Production webhooks: Not coming ❌

**Possible Causes:**
1. **App still in Development mode**
2. **Webhook subscription issue**
3. **Phone Number ID not registered**

**Fix:**
- Check app is published
- Re-subscribe to `messages` field
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
6. Meta sends webhook: status = "delivered" (2-3 seconds)
   ↓
7. Database updates: status = "delivered"
   ↓
8. Meta sends webhook: status = "read" (when read)
   ↓
9. Database updates: status = "read"
```

---

## ✅ **Checklist:**

- [ ] Meta Activity Log checked (most important!)
- [ ] Test webhook tried manually
- [ ] Webhook URL tested in browser
- [ ] Webhook verified in Meta Dashboard
- [ ] `messages` field subscribed
- [ ] Phone Number ID matches
- [ ] Edge Function deployed
- [ ] Supabase logs monitored

---

## 🎯 **Most Likely Issue:**

Based on your description, **Meta is not sending webhooks**. 

**Check Meta Activity Log first** - ye sabse important hai. Agar waha bhi logs nahi hain, to Meta hi webhooks nahi bhej raha.

**Possible reasons:**
1. App still in Development mode (check App Mode toggle)
2. Webhook not properly verified
3. Phone Number ID not registered for webhooks
4. Meta account restrictions

---

**Last Updated:** Complete debugging guide for webhook issues


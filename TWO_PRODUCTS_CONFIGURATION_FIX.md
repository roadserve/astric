# 🔍 Two Products Active - Incoming Messages Not Coming

## ❌ **Current Issue:**

**Do products active hain Meta Dashboard mein:**
1. ✅ **Graph API Webhooks** (User product) - Active
2. ✅ **WhatsApp Business Messaging** - Active
3. ❌ **Incoming messages nahi aa rahe** (send ho raha hai ✅)

---

## 🔍 **Root Cause Analysis:**

### **Issue 1: Wrong Product Selected for Webhooks**

**Meta Dashboard → Webhooks → "Select product"**

**Current:** "User" product selected ❌  
**Required:** "Whatsapp Business Account" product selected ✅

**Why:**
- "User" product = Facebook user events (not WhatsApp)
- "Whatsapp Business Account" = WhatsApp Business Platform events
- Incoming messages sirf "Whatsapp Business Account" product se aayenge

---

### **Issue 2: Development Mode**

**Meta Dashboard → App Settings → Basic**

**Current:** App Mode: "Development" ❌  
**Required:** App Mode: "Live" ✅

**Why (from documentation):**
> "Apps in development mode can only receive test notifications initiated through the app dashboard or notifications initiated by people who have a role on the app."

**Translation:**
- Development mode = Sirf test webhooks kaam karte hain
- Live mode = Real messages ke liye webhooks enabled

---

## ✅ **Complete Fix Guide:**

### **Step 1: Switch App Mode to Live**

**Meta Dashboard → Top Bar → App Mode Toggle**

1. **Find:** "App Mode" toggle (top bar)
2. **Current:** "Development" ❌
3. **Switch:** Toggle ko "Live" par switch karein ✅
4. **Confirm:** Dialog mein confirm karein

**OR**

**Meta Dashboard → App Settings → Basic → App Mode**

1. **Go to:** App Settings → Basic
2. **Find:** "App Mode" section
3. **Switch:** "Development" se "Live" par switch karein
4. **Save**

---

### **Step 2: Select Correct Product for Webhooks**

**Meta Dashboard → Webhooks → Configuration**

1. **Find:** "Select product" dropdown (top of webhook configuration)
2. **Current:** "User" ❌
3. **Select:** "Whatsapp Business Account" ✅
4. **Wait:** Page refresh hoga

**Important:** Ye step **MUST** hai - WhatsApp messages ke liye correct product select karna zaroori hai!

---

### **Step 3: Configure WhatsApp Business Account Webhook**

**After selecting "Whatsapp Business Account" product:**

1. **Callback URL:**
   ```
   https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound
   ```

2. **Verify Token:**
   - Database se `webhook_verify_token` copy karein
   - Ya Settings page se copy karein
   - Example: `token_1764965334603`

3. **Click:** "Verify and Save"

---

### **Step 4: Subscribe to Messages Field**

**Meta Dashboard → Webhooks → Webhook Fields**

**After verification, scroll down to "Webhook fields" table:**

**MUST Subscribe to:**
- ✅ **`messages`** - For incoming messages AND status updates (MUST!)
- ✅ `message_template_status_update` - For template approval (optional)
- ✅ `account_update` - For account changes (optional)

**Important:** `messages` field subscribe karna **MUST** hai!

**How to subscribe:**
1. Find `messages` row in table
2. Toggle switch ko **ON** karein (blue = subscribed)
3. Save

---

### **Step 5: Verify WhatsApp Configuration**

**Meta Dashboard → WhatsApp → Configuration**

**Check:**
- ✅ Phone Number ID: `884937351372876` (your actual ID)
- ✅ Phone number active hai
- ✅ Webhooks enabled for this phone number

**If not enabled:**
- Enable webhooks for this phone number
- Save

---

### **Step 6: Test with Real Message**

**After all steps:**

1. **Send:** Real message from phone to WhatsApp Business number
2. **Check:** Supabase logs
   ```bash
   # Supabase Dashboard → Edge Functions → webhook_inbound → Logs
   ```
3. **Expected:** Webhook received log dikhna chahiye
   ```
   🔔 ========== WEBHOOK RECEIVED ==========
   📦 Payload object: whatsapp_business_account
   📨 Found 1 message(s) in webhook
   ✅ Saved incoming message
   ```

---

## 📋 **Complete Checklist:**

### **App Mode:**
- [ ] App Mode: "Live" (NOT "Development")
- [ ] Toggle switched to "Live" position

### **Webhook Product:**
- [ ] Product: "Whatsapp Business Account" selected (NOT "User")
- [ ] Page refreshed after product selection

### **Webhook Configuration:**
- [ ] Callback URL: `https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound`
- [ ] Verify Token: Database se match karein
- [ ] Webhook verified successfully

### **Webhook Fields:**
- [ ] `messages` field subscribed (toggle ON)
- [ ] Other fields subscribed (optional)

### **WhatsApp Configuration:**
- [ ] Phone Number ID correct
- [ ] Phone number active
- [ ] Webhooks enabled for phone number

---

## 🐛 **Common Issues:**

### **Issue 1: Still Not Receiving Messages**

**Check:**
1. App Mode: "Live" ✅
2. Product: "Whatsapp Business Account" ✅
3. `messages` field subscribed ✅
4. Webhook verified ✅

**If all correct but still not working:**
- Re-verify webhook (remove and re-add)
- Check Supabase logs for errors
- Check Meta Activity Log for webhook delivery status

---

### **Issue 2: Test Webhooks Work But Real Don't**

**Cause:** App Mode still "Development"

**Fix:**
- Switch App Mode to "Live"
- Re-verify webhook
- Test with real message

---

### **Issue 3: Wrong Product Selected**

**Symptoms:**
- Webhooks aa rahe hain ✅
- But WhatsApp messages nahi aa rahe ❌

**Fix:**
- Select "Whatsapp Business Account" product
- Re-verify webhook
- Subscribe to `messages` field

---

## 📚 **Documentation References:**

1. **WhatsApp Business Messaging Overview:**
   - [WhatsApp Overview](https://developers.facebook.com/documentation/business-messaging/whatsapp/overview)

2. **Graph API Webhooks:**
   - [Webhooks Documentation](https://developers.facebook.com/docs/graph-api/webhooks/)

3. **Key Points:**
   - Development mode: Test webhooks only
   - Live mode: Real messages webhooks enabled
   - Product selection: "Whatsapp Business Account" for WhatsApp
   - `messages` field: Must subscribe for incoming messages

---

## ✅ **Quick Fix Summary:**

1. ✅ **Switch App Mode to "Live"** - Top bar toggle
2. ✅ **Select "Whatsapp Business Account" product** - Webhooks page
3. ✅ **Configure webhook** - Callback URL + Verify Token
4. ✅ **Subscribe to `messages` field** - Webhook fields table
5. ✅ **Test with real message** - Phone se message send karein
6. ✅ **Check Supabase logs** - Webhook received dikhna chahiye

---

## 🎯 **Most Important Steps:**

1. **App Mode: "Live"** ✅ (Development mode = test only)
2. **Product: "Whatsapp Business Account"** ✅ (NOT "User")
3. **`messages` field subscribed** ✅ (MUST for incoming messages)

---

**Last Updated:** Complete fix guide for two products configuration issue


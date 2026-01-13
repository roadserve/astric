# ✅ WhatsApp Webhook Setup - Correct Configuration

## ❌ **Current Issue:**
Screenshot mein "User" product selected hai, lekin WhatsApp webhooks ke liye **"Whatsapp Business Account"** select karna hoga.

---

## ✅ **Correct Setup Steps:**

### **Step 1: Select WhatsApp Business Account Product**

1. **Meta Dashboard:** Webhooks page (current page)
2. **"Select product" dropdown** mein click karein
3. **Select:** "Whatsapp Business Account" (NOT "User")
4. **Wait:** Page refresh hoga

---

### **Step 2: Configure Webhook**

1. **Callback URL:**
   ```
   https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound
   ```

2. **Verify Token:**
   - Database se `webhook_verify_token` copy karein
   - Ya Settings page se copy karein

3. **Click:** "Verify and Save"

---

### **Step 3: Subscribe to Events**

After verification, scroll down to "Webhook fields":

**MUST Subscribe to:**
- ✅ **`messages`** - For incoming messages AND status updates
- ✅ `message_template_status_update` - For template approval
- ✅ `account_update` - For account changes

**Important:** `messages` field subscribe karna **MUST** hai - ye status updates bhi deta hai!

---

## 🔍 **Why "Whatsapp Business Account" Important:**

- ✅ **"User" product** = Facebook user events (not WhatsApp)
- ✅ **"Whatsapp Business Account"** = WhatsApp Business Platform events
- ✅ Status updates sirf WhatsApp Business Account product se aayenge

---

## 📋 **Complete Setup Checklist:**

- [ ] Product: "Whatsapp Business Account" selected
- [ ] Callback URL: `https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound`
- [ ] Verify Token: Database se match karein
- [ ] Webhook verified successfully
- [ ] `messages` field subscribed
- [ ] Other fields subscribed (optional)

---

## 🧪 **After Setup - Test:**

1. **Send a message** from CRM
2. **Check Supabase logs:**
   ```bash
   supabase functions logs webhook_inbound --tail
   ```
3. **Expected:**
   ```
   🔔 ========== WEBHOOK RECEIVED ==========
   📦 Payload object: whatsapp_business_account
   📊 ✅ FOUND 1 STATUS UPDATE(S) IN WEBHOOK!
   ```

---

## ⚠️ **Important Notes:**

1. **Product Selection:**
   - ❌ "User" = Wrong (Facebook user events)
   - ✅ "Whatsapp Business Account" = Correct (WhatsApp events)

2. **Webhook URL:**
   - Same URL rahega dono products ke liye
   - Lekin product select karna important hai

3. **Status Updates:**
   - Sirf "Whatsapp Business Account" product se aayenge
   - "User" product se WhatsApp status updates nahi aayenge

---

## 🎯 **Quick Fix:**

1. **Current page:** Webhooks configuration
2. **"Select product"** dropdown mein click karein
3. **Select:** "Whatsapp Business Account"
4. **Configure:** Callback URL aur Verify Token
5. **Verify and Save**
6. **Subscribe:** To `messages` field
7. **Test:** Send message and check logs

---

**Last Updated:** WhatsApp Business Account product selection guide


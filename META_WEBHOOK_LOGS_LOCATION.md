# 📍 Meta Webhook Logs - Kaha Dikhenge

## ✅ **Verification Logs:**
- ✅ Supabase logs mein verification logs aa rahe hain
- ✅ Ye sahi hai - webhook verify ho gaya hai

## 🔍 **Meta Webhook Logs Kaha Check Karein:**

### **Method 1: Webhook Section Mein (Easiest)**

1. **Go to:** Meta Dashboard → WhatsApp → Configuration
2. **Scroll down** to "Subscribe to webhooks" section
3. **Look for:**
   - **"View webhook logs"** button (blue/gray button)
   - Ya **"Test webhook"** button
4. **Click on it** - Webhook delivery logs dikhenge

**Kya dikhega:**
- ✅ **Green entries** = Successful webhook deliveries
- ❌ **Red entries** = Failed deliveries (with error)
- **Timestamp** = When webhook was sent
- **Status** = Success/Failed
- **Payload** = What data was sent

---

### **Method 2: Activity Log (Alternative)**

1. **Go to:** Meta Dashboard
2. **Click:** "Activity log" (left sidebar, bottom)
3. **Filter:** Select "Webhooks" or "WhatsApp"
4. **Check recent activity**

---

### **Method 3: Graph API Explorer (Advanced)**

1. **Go to:** https://developers.facebook.com/tools/explorer/
2. **Select your app**
3. **Query:**
   ```
   GET /{app-id}/webhook_subscriptions
   ```
4. **Or check webhook deliveries:**
   ```
   GET /{app-id}/webhook_deliveries
   ```

---

## 🐛 **Agar "View webhook logs" Button Nahi Dikhe:**

### **Reason 1: Webhook Not Verified Yet**
- **Fix:** "Verify and save" button click karein
- **Wait:** 1-2 minutes
- **Refresh:** Page refresh karein
- **Check:** Button ab dikhega

### **Reason 2: No Webhook Activity**
- **Fix:** Send a test message
- **Wait:** 1-2 seconds
- **Check:** Logs ab dikhenge

### **Reason 3: UI Update**
- **Fix:** Page refresh karein
- **Or:** Clear browser cache

---

## 🧪 **Test Webhook Manually:**

### **Step 1: In Meta Dashboard**
1. **Go to:** WhatsApp → Configuration → Webhook
2. **Scroll to "Webhook fields"**
3. **Find:** `messages` field
4. **Click:** "Test" button (next to Subscribe toggle)

### **Step 2: Check Logs**
1. **Meta Dashboard:** Webhook logs mein test entry dikhegi
2. **Supabase Logs:** 
   ```bash
   supabase functions logs webhook_inbound --tail
   ```
3. **Should see:**
   ```
   🔔 ========== WEBHOOK RECEIVED ==========
   📦 Payload object: whatsapp_business_account
   ```

---

## 📊 **What to Look For:**

### **✅ Good Signs:**
- Meta Dashboard: Green "Success" entries
- Timestamp: Recent (last few minutes)
- Status: "200 OK" or "Success"
- Payload: Contains `statuses` array

### **❌ Bad Signs:**
- Meta Dashboard: Red "Failed" entries
- Error: "404 Not Found" = Webhook URL wrong
- Error: "403 Forbidden" = Token mismatch
- Error: "500 Internal Server Error" = Function error

---

## 🔍 **Detailed Location:**

### **Exact Path:**
```
Meta Dashboard
  → Apps
    → Select "AI wp business" (your app)
      → WhatsApp (left sidebar)
        → Configuration
          → Scroll to "Subscribe to webhooks"
            → "View webhook logs" button
```

### **Screenshot Guide:**
1. **Current page:** WhatsApp → Configuration (jo aap dekh rahe ho)
2. **Scroll down:** "Subscribe to webhooks" section tak
3. **Look for:** Blue/Gray button saying "View webhook logs" or "Test webhook"
4. **Click:** Webhook delivery history dikhegi

---

## 💡 **Quick Check:**

### **If Button Not Visible:**
1. **Send a test message** from your CRM
2. **Wait 2-3 seconds**
3. **Refresh Meta Dashboard page**
4. **Check again** - Logs ab dikhenge

### **If Still Not Visible:**
1. **Check:** Webhook verified hai ya nahi
2. **Check:** `messages` field subscribed hai ya nahi
3. **Try:** Different browser ya incognito mode

---

## 🎯 **Expected Flow:**

```
1. You send message
   ↓
2. Meta sends webhook (status update)
   ↓
3. Meta Dashboard → Webhook logs → Green entry
   ↓
4. Supabase receives webhook
   ↓
5. Supabase logs → "🔔 WEBHOOK RECEIVED"
   ↓
6. Database updates → status = "delivered"
```

---

## 📝 **Note:**

- **Verification logs** = Webhook setup successful ✅
- **Delivery logs** = Actual message/status webhooks
- **Agar delivery logs nahi dikh rahe** = Meta webhooks nahi bhej raha (check subscription)

---

**Last Updated:** Guide for finding Meta webhook logs


# 🔍 Check Webhook Events - Step by Step

## ✅ **Current Status:**
- ✅ App Mode: Live
- ✅ Activity Log visible
- ❌ Webhook filter nahi dikh raha

---

## ✅ **Step 1: Go to Webhooks Page**

**Meta Dashboard → Left Sidebar → "Webhooks"**

**Expected:**
- Webhooks configuration page
- Callback URL aur Verify Token dikhna chahiye
- "View webhook logs" ya "Webhook events" option dikhna chahiye

---

## ✅ **Step 2: Check Webhook Logs**

**Webhooks Page → "View webhook logs" ya "Webhook events"**

**Look for:**
- ✅ **Green entries** = Successfully sent
- ❌ **Red entries** = Failed (check error)
- ⚠️ **No entries** = Not sending

**Expected:**
- Recent webhook events dikhne chahiye
- Timestamp, field, payload dikhna chahiye

---

## ✅ **Step 3: Alternative - Check Activity Log with Search**

**Activity Log Page → Search Bar**

**Search for:**
- "webhook"
- "POST"
- "callback"

**Expected:**
- Webhook-related activities dikhne chahiye

---

## ✅ **Step 4: Check Webhook Configuration**

**Webhooks Page → Configuration**

**Check:**
1. **Callback URL:** `https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound`
   - ✅ Exact match hona chahiye
   - ❌ Trailing slash nahi hona chahiye

2. **Verify Token:** `token_1764965334603`
   - ✅ Database mein same token hona chahiye

3. **Webhook Fields:**
   - ✅ `messages` field subscribed (toggle ON)

---

## ✅ **Step 5: Test Webhook Manually**

**Webhooks Page → "Test" or "Send test webhook"**

1. **Select:** "messages" field
2. **Click:** "Send test webhook"
3. **Check:** Supabase logs
4. **Expected:** Webhook received log dikhna chahiye

---

## 🐛 **Common Issues:**

### **Issue 1: Webhook Logs Not Visible**

**Symptoms:**
- Webhooks page par logs nahi dikh rahe ❌

**Fix:**
- Check if webhook is properly subscribed
- Check if test webhooks work
- Check Supabase logs directly

---

### **Issue 2: No Webhook Events**

**Symptoms:**
- Webhook logs empty ❌
- But Meta sending webhooks ✅

**Fix:**
- Check webhook URL
- Check network connectivity
- Check Supabase function status

---

## ✅ **Quick Action:**

1. ✅ **Go to Webhooks page** - Left sidebar → "Webhooks"
2. ✅ **Check webhook logs** - "View webhook logs" ya "Webhook events"
3. ✅ **Test webhook** - Manual test from Meta Dashboard
4. ✅ **Check Supabase logs** - Direct check in Supabase Dashboard

---

**Last Updated:** Guide to check webhook events




# 📊 How to Check Logs - Step by Step Guide

## 🔍 **Meta Dashboard - Webhook Logs**

### **Step 1: Go to Meta Developers Dashboard**
1. Open: https://developers.facebook.com/apps
2. **Select your WhatsApp app**

### **Step 2: Navigate to Webhook Section**
1. **Click:** WhatsApp (left sidebar)
2. **Click:** Configuration
3. **Scroll down** to "Webhook" section

### **Step 3: View Webhook Logs**
1. **Click:** "View webhook logs" button (or "Test webhook")
2. **You'll see:**
   - ✅ **Green entries** = Successful webhook calls
   - ❌ **Red entries** = Failed webhook calls (check error message)
   - **Timestamp** = When webhook was called
   - **Status** = Success/Failed
   - **Payload** = What data was sent

### **Step 4: Check Recent Activity**
- Look for recent webhook calls (last hour/day)
- Check if status updates are being sent
- If no logs = Meta is not sending webhooks

---

## 🔍 **Supabase Dashboard - Edge Function Logs**

### **Step 1: Go to Supabase Dashboard**
1. Open: https://supabase.com/dashboard
2. **Select your project:** `nazedodnkzkuxvsuedmb`

### **Step 2: Navigate to Edge Functions**
1. **Click:** "Edge Functions" (left sidebar)
2. **Click:** "Functions"

### **Step 3: Select Function**
1. **Click:** `webhook_inbound` function
2. **Click:** "Logs" tab

### **Step 4: View Logs**
You'll see:
- **Timestamp** = When function executed
- **Level** = INFO, ERROR, LOG
- **Message** = Log content

**Look for:**
- `🔔 ========== WEBHOOK RECEIVED ==========` = Webhook call received
- `📊 ✅ FOUND X STATUS UPDATE(S)` = Status updates found
- `📨 Handling message status update` = Processing status

---

## 💻 **Terminal - Real-time Logs**

### **Step 1: Open Terminal**
```bash
cd /Users/roadserve/Downloads/astric/supabase
```

### **Step 2: View Real-time Logs**
```bash
# View webhook_inbound logs
supabase functions logs webhook_inbound --tail

# View whatsapp_send logs
supabase functions logs whatsapp_send --tail

# View all functions logs
supabase functions logs --tail
```

### **Step 3: Filter Logs**
```bash
# View last 50 logs
supabase functions logs webhook_inbound --limit 50

# View logs from specific time
supabase functions logs webhook_inbound --since 1h
```

---

## 🗄️ **Database - Check Message Status**

### **Step 1: Go to Supabase Dashboard**
1. **Click:** "SQL Editor" (left sidebar)
2. **Click:** "New query"

### **Step 2: Run Query**
```sql
-- Check recent messages and their status
SELECT 
  id, 
  message_id, 
  whatsapp_message_id,
  content,
  status, 
  delivered_at, 
  read_at,
  created_at
FROM whatsapp_messages 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Step 3: Check Status Logs**
```sql
-- Check status update history
SELECT 
  wmsl.*,
  wm.content,
  wm.status as current_status
FROM whatsapp_message_status_log wmsl
JOIN whatsapp_messages wm ON wm.id = wmsl.message_id
ORDER BY wmsl.timestamp DESC 
LIMIT 20;
```

---

## 🧪 **Test Webhook Manually**

### **In Meta Dashboard:**
1. Go to: WhatsApp → Configuration → Webhook
2. **Click:** "Test" button next to `messages` field
3. **Check Supabase logs** immediately:
   ```bash
   supabase functions logs webhook_inbound --tail
   ```
4. **Should see:**
   ```
   🔔 ========== WEBHOOK RECEIVED ==========
   📦 Payload object: whatsapp_business_account
   ```

---

## 📋 **What to Look For:**

### **✅ Good Signs:**
- Meta Dashboard: Green "Success" entries
- Supabase Logs: `🔔 WEBHOOK RECEIVED` messages
- Database: `status` field updating (sent → delivered → read)

### **❌ Bad Signs:**
- Meta Dashboard: Red "Failed" entries
- Supabase Logs: No `🔔 WEBHOOK RECEIVED` messages
- Database: Status stuck at "sent" (never updates)

---

## 🔧 **Quick Debugging:**

### **If No Webhook Logs in Supabase:**
1. Check Meta Dashboard → Webhook logs
2. If red errors → Check webhook URL
3. If no logs → Meta not sending webhooks

### **If Webhook Logs But No Status Updates:**
1. Check logs for `📊 ✅ FOUND X STATUS UPDATE(S)`
2. If not found → Check payload structure
3. If found but not updating → Check database query

### **If Status Updates But UI Not Updating:**
1. Check browser console (F12)
2. Check real-time subscription logs
3. Refresh page

---

## 📍 **Quick Links:**

- **Meta Dashboard:** https://developers.facebook.com/apps
- **Supabase Dashboard:** https://supabase.com/dashboard/project/nazedodnkzkuxvsuedmb
- **Webhook URL:** https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound

---

**Last Updated:** Guide for checking logs


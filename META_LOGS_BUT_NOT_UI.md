# 🔍 Meta Logs But Not in UI - Debug Guide

## ✅ **Current Status:**
- ✅ Meta sending webhooks (events visible in Meta Dashboard)
- ✅ Latest message: "Hhh" at 04:30:14
- ✅ Phone Number ID correct: `884937351372876`
- ❌ UI mein message nahi dikh raha

---

## 🔍 **Step 1: Check Supabase Logs**

**Supabase Dashboard → Edge Functions → `webhook_inbound` → Logs**

**Look for recent logs (after 04:30:14):**
- `🔔 ========== WEBHOOK RECEIVED ==========`
- `📨 Found 1 message(s) in webhook`
- `✅ Saved incoming message` - **SUCCESS!**
- `❌ Error saving message` - **ERROR!**

**If Success:**
- Message saved ✅
- Check database next

**If No Logs:**
- Webhook Supabase tak nahi pahunch raha ❌
- Check webhook URL

**If Error:**
- Check error message
- Verify status is `pending`

---

## 🔍 **Step 2: Check Database**

**Supabase Dashboard → SQL Editor**

```sql
SELECT 
  id, 
  conversation_id,
  contact_id,
  direction,
  content,
  status,
  created_at
FROM whatsapp_messages 
WHERE direction = 'inbound'
ORDER BY created_at DESC 
LIMIT 5;
```

**Check:**
- ✅ Messages database mein hain ya nahi
- ✅ Latest message "Hhh" hai ya nahi
- ✅ `conversation_id` populated hai ya nahi

**If messages found:** ✅ Database working!
**If no messages:** ❌ Message not saving

---

## 🔍 **Step 3: Check Conversation**

```sql
SELECT 
  id,
  contact_id,
  last_message_at,
  last_message_preview,
  status
FROM whatsapp_conversations 
WHERE contact_id IN (
  SELECT id FROM whatsapp_contacts 
  WHERE phone_number = '+917007543565'
)
ORDER BY last_message_at DESC;
```

**Check:**
- ✅ Conversation exists
- ✅ `last_message_at` updated
- ✅ `last_message_preview` updated

---

## 🔍 **Step 4: Check UI - Conversation Selection**

1. **Go to:** `/dashboard/whatsapp/conversations`
2. **Check:** Conversation list mein conversation dikh raha hai ya nahi
3. **Click:** Conversation select karein
4. **Check:** Messages load ho rahe hain ya nahi

**If conversation not in list:**
- Conversation create nahi hua
- Check webhook function logs

**If conversation in list but no messages:**
- Messages load nahi ho rahe
- Check `loadMessages` function

---

## 🔍 **Step 5: Check Browser Console**

1. **Open:** Browser Console (F12)
2. **Look for:**
   - `📨 New message received via real-time`
   - `✅ Adding message to selected conversation UI`
   - `⚠️ Message for different conversation`

**If you see these logs:** ✅ Real-time subscription working!
**If you don't see these logs:** ❌ Real-time subscription not working

---

## 🐛 **Common Issues:**

### **Issue 1: Webhook Not Reaching Supabase**

**Symptoms:**
- Meta Dashboard: Events visible ✅
- Supabase logs: Empty ❌

**Fix:**
- Check webhook URL exact match
- Re-verify webhook
- Check Meta Activity Log for delivery status

### **Issue 2: Message Not Saving**

**Symptoms:**
- Webhooks aa rahe hain ✅
- But database mein messages nahi hain ❌

**Fix:**
- Check Supabase logs for save errors
- Verify status is `pending`
- Check required fields

### **Issue 3: Real-time Subscription Not Working**

**Symptoms:**
- Messages database mein hain ✅
- But UI update nahi ho raha ❌

**Fix:**
- Check browser console for errors
- Verify Supabase Realtime enabled
- Check subscription logs

### **Issue 4: Conversation Not Selected**

**Symptoms:**
- Messages database mein hain ✅
- But UI mein nahi dikh rahe ❌

**Fix:**
- Select conversation from list
- Check `loadMessages` function called
- Verify conversation_id matches

---

## ✅ **Quick Fix:**

1. **Check Supabase logs** - Webhook aa raha hai ya nahi
2. **Check database** - Message save ho raha hai ya nahi
3. **Select conversation** - UI mein conversation click karein
4. **Check browser console** - Real-time logs dikh rahe hain ya nahi
5. **Refresh page** - Force reload conversations

---

## 🎯 **Most Likely Issue:**

**Webhook Supabase tak nahi pahunch raha ya message save nahi ho raha.**

**Check:**
1. Supabase logs - Webhook received dikh raha hai ya nahi
2. Database - Message save ho raha hai ya nahi
3. Conversation - Conversation select kiya hai ya nahi

---

**Last Updated:** Debug guide for Meta logs but not in UI




# 🔍 Messages Not Appearing in UI - Debug Guide

## ✅ **Current Status:**
- ✅ Webhooks aa rahe hain Supabase tak
- ✅ Messages process ho rahe hain
- ❌ Messages UI mein nahi dikh rahe

---

## 🔍 **Step 1: Check Database**

### **SQL Query:**

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
ORDER BY created_at DESC 
LIMIT 10;
```

**Check:**
- ✅ Messages database mein save ho rahe hain ya nahi
- ✅ `conversation_id` populated hai ya nahi
- ✅ `direction` = 'inbound' hai ya nahi

---

## 🔍 **Step 2: Check Conversations**

```sql
SELECT 
  id,
  contact_id,
  last_message_at,
  last_message_preview,
  status
FROM whatsapp_conversations 
ORDER BY last_message_at DESC 
LIMIT 10;
```

**Check:**
- ✅ Conversations update ho rahe hain ya nahi
- ✅ `last_message_at` update ho raha hai ya nahi

---

## 🔍 **Step 3: Check Real-time Subscription**

### **Browser Console Check:**

1. **Open:** `/dashboard/whatsapp/conversations`
2. **Open:** Browser Console (F12)
3. **Look for:**
   - `📨 New message received via real-time`
   - `✅ Adding message to selected conversation UI`
   - `⚠️ Message for different conversation`

**If you see these logs:** ✅ Real-time subscription working!
**If you don't see these logs:** ❌ Real-time subscription not working

---

## 🔍 **Step 4: Check Supabase Logs**

**Look for:**
- `✅ Saved incoming message` - Message saved successfully
- `❌ Error saving message` - Error saving message

**If error:** Check error message in logs

---

## 🐛 **Common Issues:**

### **Issue 1: Message Save Error**

**Symptoms:**
- Webhooks aa rahe hain ✅
- Messages process ho rahe hain ✅
- But save error ❌

**Fix:**
- Check Supabase logs for error
- Verify database schema
- Check required fields

### **Issue 2: Conversation ID Mismatch**

**Symptoms:**
- Messages save ho rahe hain ✅
- But UI mein nahi dikh rahe ❌

**Fix:**
- Check `conversation_id` matches
- Verify conversation exists
- Check real-time subscription

### **Issue 3: Real-time Subscription Not Working**

**Symptoms:**
- Messages database mein hain ✅
- But UI update nahi ho raha ❌

**Fix:**
- Check browser console for errors
- Verify Supabase Realtime enabled
- Check subscription logs

---

## ✅ **Quick Fix:**

1. **Check database** - Messages save ho rahe hain ya nahi
2. **Check browser console** - Real-time subscription logs
3. **Check Supabase logs** - Message save errors
4. **Refresh page** - Force reload conversations

---

## 🎯 **Most Likely Issue:**

**Messages save ho rahe hain but real-time subscription properly kaam nahi kar raha.**

**Check:**
1. Browser console - Real-time logs dikh rahe hain ya nahi
2. Database - Messages save ho rahe hain ya nahi
3. Conversation selection - Correct conversation selected hai ya nahi

---

**Last Updated:** Debug guide for messages not appearing


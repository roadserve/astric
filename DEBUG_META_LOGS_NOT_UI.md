# 🔍 Meta Logs But Not in UI - Step-by-Step Debug

## ✅ **Current Status:**
- ✅ Meta sending webhooks (events visible in Meta Dashboard)
- ✅ Latest message: "Hhh" at 04:30:14
- ✅ Phone Number ID: `884937351372876`
- ❌ UI mein message nahi dikh raha

---

## 🔍 **Step 1: Check Supabase Logs (MOST IMPORTANT)**

**Supabase Dashboard → Edge Functions → `webhook_inbound` → Logs**

**Look for logs around 04:30:14:**

### **Expected Logs:**
```
🔔 ========== WEBHOOK RECEIVED ==========
📦 Payload object: whatsapp_business_account
📨 Processing WhatsApp webhook...
📨 Found 1 message(s) in webhook
Handling incoming message: { phoneNumber: '917007543565', messageId: 'wamid...', phoneNumberId: '884937351372876' }
Found WhatsApp account by exact phone_number_id match: 884937351372876
Found WhatsApp account: { organizationId: '...', whatsappAccountId: '...' }
Saving message to database: { ... }
✅ Saved incoming message wamid... from 917007543565
```

### **If You See These Logs:**
✅ **Webhook received and processed!**
→ **Go to Step 2** (Check Database)

### **If You DON'T See These Logs:**
❌ **Webhook not reaching Supabase!**
→ **Check:**
- Webhook URL exact match: `https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound`
- Meta Activity Log → Check delivery status (green/red)
- Network issues

---

## 🔍 **Step 2: Check Database**

**Supabase Dashboard → SQL Editor**

### **Query 1: Check Latest Messages**
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

**Expected:**
- ✅ Message "Hhh" should be visible
- ✅ `created_at` around 04:30:14
- ✅ `status` = `pending`

**If Found:** ✅ **Message saved!** → **Go to Step 3**
**If Not Found:** ❌ **Message not saving** → **Check Supabase logs for errors**

---

### **Query 2: Check Conversation**
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
  WHERE phone_number = '917007543565'
)
ORDER BY last_message_at DESC;
```

**Expected:**
- ✅ Conversation exists
- ✅ `last_message_at` updated (around 04:30:14)
- ✅ `last_message_preview` = "Hhh"

**If Found:** ✅ **Conversation updated!** → **Go to Step 3**
**If Not Found:** ❌ **Conversation not created/updated** → **Check webhook function logs**

---

## 🔍 **Step 3: Check UI - Conversation Selection**

1. **Go to:** `http://localhost:3000/dashboard/whatsapp/conversations`
2. **Check:** Conversation list mein conversation dikh raha hai ya nahi
   - **Expected:** Conversation with phone `917007543565` should be visible
   - **Expected:** `last_message_preview` = "Hhh"
3. **Click:** Conversation select karein
4. **Check:** Messages load ho rahe hain ya nahi
   - **Expected:** Message "Hhh" should be visible

**If Conversation Not in List:**
- ❌ Conversation not created/updated
- **Fix:** Check webhook function logs

**If Conversation in List But No Messages:**
- ❌ Messages not loading
- **Fix:** Check `loadMessages` function

**If Messages Load But Not Real-time:**
- ⚠️ Real-time subscription issue
- **Fix:** Check browser console

---

## 🔍 **Step 4: Check Browser Console**

1. **Open:** Browser Console (F12)
2. **Go to:** `/dashboard/whatsapp/conversations`
3. **Select:** Conversation
4. **Send:** Test message from phone
5. **Look for:**
   - `📨 New message received via real-time`
   - `✅ Adding message to selected conversation UI`
   - `⚠️ Message for different conversation`

**If You See These Logs:**
✅ **Real-time subscription working!**
→ **Check:** Message should appear in UI

**If You DON'T See These Logs:**
❌ **Real-time subscription not working!**
→ **Check:**
- Supabase Realtime enabled
- Browser console errors
- Network tab → WebSocket connection

---

## 🔍 **Step 5: Force Refresh**

1. **Refresh:** Page (`Ctrl+R` or `Cmd+R`)
2. **Check:** Conversation list reload ho raha hai ya nahi
3. **Select:** Conversation again
4. **Check:** Messages load ho rahe hain ya nahi

**If Still Not Working:**
- Clear browser cache
- Hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`)

---

## 🐛 **Common Issues:**

### **Issue 1: Webhook Not Reaching Supabase**

**Symptoms:**
- Meta Dashboard: Events visible ✅
- Supabase logs: Empty ❌

**Fix:**
1. Check webhook URL exact match
2. Re-verify webhook in Meta Dashboard
3. Check Meta Activity Log → Delivery status

---

### **Issue 2: Message Not Saving**

**Symptoms:**
- Webhooks aa rahe hain ✅
- But database mein messages nahi hain ❌

**Fix:**
1. Check Supabase logs for save errors
2. Verify `status` = `pending` (not `received`)
3. Check required fields (`organization_id`, `whatsapp_account_id`, `contact_id`)

---

### **Issue 3: Real-time Subscription Not Working**

**Symptoms:**
- Messages database mein hain ✅
- But UI update nahi ho raha ❌

**Fix:**
1. Check browser console for errors
2. Verify Supabase Realtime enabled
3. Check subscription logs
4. Try manual refresh

---

### **Issue 4: Conversation Not Selected**

**Symptoms:**
- Messages database mein hain ✅
- But UI mein nahi dikh rahe ❌

**Fix:**
1. Select conversation from list
2. Check `loadMessages` function called
3. Verify `conversation_id` matches

---

## ✅ **Quick Fix Checklist:**

1. ✅ **Check Supabase logs** - Webhook aa raha hai ya nahi
2. ✅ **Check database** - Message save ho raha hai ya nahi
3. ✅ **Select conversation** - UI mein conversation click karein
4. ✅ **Check browser console** - Real-time logs dikh rahe hain ya nahi
5. ✅ **Refresh page** - Force reload conversations

---

## 🎯 **Most Likely Issue:**

**Webhook Supabase tak nahi pahunch raha ya message save nahi ho raha.**

**Check:**
1. Supabase logs - Webhook received dikh raha hai ya nahi
2. Database - Message save ho raha hai ya nahi
3. Conversation - Conversation select kiya hai ya nahi

---

**Last Updated:** Step-by-step debug guide for Meta logs but not in UI




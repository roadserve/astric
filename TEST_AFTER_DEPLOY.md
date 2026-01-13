# 🧪 Test After Deploy - Step by Step

## ✅ **Status:**
- ✅ Function deployed
- ✅ Status fix applied (`pending` instead of `received`)
- ⏳ Ready to test

---

## 🧪 **Step 1: Send Test Message**

1. **From WhatsApp:** Send message to your Business number
2. **Wait:** 2-3 seconds

---

## 🔍 **Step 2: Check Supabase Logs**

**Supabase Dashboard → Edge Functions → `webhook_inbound` → Logs**

**Look for:**
- `🔔 ========== WEBHOOK RECEIVED ==========`
- `📨 Found 1 message(s) in webhook`
- `✅ Saved incoming message` - **SUCCESS!**
- `❌ Error saving message` - **ERROR!**

**If Success:**
- Message saved ✅
- Check database next

**If Error:**
- Check error message
- Verify status is `pending`

---

## 🔍 **Step 3: Check Database**

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

**Expected:**
- At least 1 message
- `status` = `pending`
- `content` = Your message text

**If messages found:** ✅ Database working!
**If no messages:** ❌ Still not saving

---

## 🔍 **Step 4: Check UI**

1. **Go to:** `/dashboard/whatsapp/conversations`
2. **Select conversation** from list
3. **Check:** Message dikh raha hai ya nahi

**If message appears:** ✅ Everything working!
**If not:** Check browser console

---

## 🔍 **Step 5: Check Browser Console**

1. **Open:** Browser Console (F12)
2. **Look for:**
   - `📨 New message received via real-time`
   - `✅ Adding message to selected conversation UI`

**If you see these:** ✅ Real-time working!
**If not:** Real-time subscription issue

---

## 🐛 **If Still Not Working:**

### **Check 1: Latest Logs**

Supabase Dashboard → Logs → Check most recent logs (after deploy)

**Look for:**
- Latest `✅ Saved incoming message` entry
- Or latest error

### **Check 2: Status Value**

Verify status is `pending` in logs:
```
status: 'pending'
```

### **Check 3: Database Query**

Run query again:
```sql
SELECT * FROM whatsapp_messages 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## ✅ **Expected Flow:**

```
1. Send message from WhatsApp
   ↓
2. Meta sends webhook
   ↓
3. Supabase receives webhook
   ↓
4. Logs show: "✅ Saved incoming message"
   ↓
5. Database query shows message
   ↓
6. UI shows message (if conversation selected)
```

---

## 🎯 **Quick Test:**

1. **Send message** from WhatsApp
2. **Check Supabase logs** - Should see `✅ Saved incoming message`
3. **Check database** - Should see message
4. **Select conversation** - Should see message in UI

---

**Last Updated:** Test guide after deploy




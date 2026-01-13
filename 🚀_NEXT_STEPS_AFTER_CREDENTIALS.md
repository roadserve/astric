# 🚀 Next Steps - After Credentials Added

## ✅ **Credentials Added Successfully!**

Ab aap WhatsApp Business API se connect ho chuke hain. Ye steps follow karein:

---

## 📋 **Step-by-Step Guide:**

### **Step 1: Test Message Send Karein** ✅

**Purpose:** Verify ki credentials sahi se kaam kar rahe hain

**How to:**
1. Go to: `/dashboard/whatsapp/send`
2. **Add a Contact First:**
   - Go to: `/dashboard/whatsapp/contacts`
   - Click "Add Contact"
   - Enter phone number (with country code, e.g., +919876543210)
   - Enter name
   - Save

3. **Send Test Message:**
   - Go back to: `/dashboard/whatsapp/send`
   - Select the contact you just added
   - Choose "Text" message type
   - Type a test message: "Hello! This is a test message from WhatsApp CRM"
   - Click "Send Message"

4. **Check Result:**
   - ✅ Success: Message sent successfully
   - ❌ Error: Check error message and verify credentials

**Expected Result:**
- Message should send successfully
- You should see success notification
- Message will appear in WhatsApp of the recipient

---

### **Step 2: Webhook Configure Karein** 🔗

**Purpose:** Receive incoming messages and status updates

**How to:**

#### **A. Get Your Webhook URL:**
```
https://YOUR_PROJECT.supabase.co/functions/v1/webhook_inbound
```

**Replace `YOUR_PROJECT` with your Supabase project reference.**

#### **B. Configure in Meta:**

1. **Go to:** https://developers.facebook.com
2. **Select your WhatsApp app**
3. **Go to:** WhatsApp → Configuration
4. **Click "Edit" on Webhook section**
5. **Enter:**
   - **Callback URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/webhook_inbound`
   - **Verify Token:** (Get from Settings page - Webhook Verify Token)
6. **Click "Verify and Save"**

#### **C. Subscribe to Events:**
After verification, subscribe to:
- ✅ `messages` - Incoming messages
- ✅ `message_status` - Delivery/read status
- ✅ `message_template_status_update` - Template approval status
- ✅ `account_update` - Account changes

**Test Webhook:**
- Send a message TO your WhatsApp Business number
- Check `/dashboard/whatsapp/conversations`
- Message should appear automatically

---

### **Step 3: Create Message Templates** 📝

**Purpose:** Pre-approved messages for marketing/notifications

**How to:**

1. **Go to:** `/dashboard/whatsapp/templates`
2. **Click "Create Template"**
3. **Fill Details:**
   - **Name:** `welcome_message` (lowercase, underscores only)
   - **Language:** Select language (e.g., `en_US`)
   - **Category:** Choose (MARKETING, UTILITY, AUTHENTICATION)
   - **Header:** Optional (Text/Image/Video)
   - **Body:** Your message text (max 1024 chars)
   - **Footer:** Optional (max 60 chars)
   - **Buttons:** Optional (Quick Reply, Phone, URL)

4. **Click "Create Template"**
5. **Submit to WhatsApp:**
   - Template will be submitted for approval
   - Approval takes 24-48 hours
   - Status will show as "Pending" → "Approved"

**Template Guidelines:**
- ✅ Use approved templates for marketing messages
- ✅ Templates don't expire (24-hour window)
- ✅ Can include variables: `{{1}}`, `{{2}}`

---

### **Step 4: Add Contacts** 👥

**Purpose:** Manage your customer contacts

**How to:**

1. **Go to:** `/dashboard/whatsapp/contacts`
2. **Click "Add Contact"**
3. **Enter:**
   - Phone Number: `+919876543210` (with country code)
   - Name: Customer name
   - Tags: Optional (e.g., "VIP", "Customer", "Lead")
   - Notes: Optional

4. **Save**

**Bulk Import (Future):**
- Export contacts from other CRM
- Import CSV file
- Auto-create contacts

---

### **Step 5: Test Conversations** 💬

**Purpose:** Real-time messaging interface

**How to:**

1. **Go to:** `/dashboard/whatsapp/conversations`
2. **Send a message TO your WhatsApp Business number** (from another phone)
3. **Check Conversations page:**
   - Message should appear automatically (if webhook configured)
   - Click on conversation
   - Reply to message
   - See real-time updates

**Features:**
- ✅ Real-time chat interface
- ✅ Message status (sent, delivered, read)
- ✅ Media support
- ✅ Contact info

---

## 🎯 **Quick Checklist:**

```
□ Step 1: Test Message Sent Successfully
□ Step 2: Webhook Configured & Verified
□ Step 3: First Template Created
□ Step 4: Contacts Added
□ Step 5: Conversations Working
```

---

## 🔧 **Common Issues & Solutions:**

### **Issue: "Message not sending"**
**Check:**
- ✅ Credentials saved correctly?
- ✅ Phone number format correct? (+91XXXXXXXXXX)
- ✅ Contact has valid phone number?
- ✅ Edge Function deployed?

**Solution:**
- Test connection again in Settings
- Check Edge Function logs
- Verify phone number format

### **Issue: "Webhook not receiving messages"**
**Check:**
- ✅ Webhook URL correct?
- ✅ Verify token matches?
- ✅ Events subscribed?
- ✅ Edge Function deployed?

**Solution:**
- Re-verify webhook in Meta
- Check webhook logs
- Test webhook endpoint manually

### **Issue: "Template not approved"**
**Check:**
- ✅ Template name format correct? (lowercase, underscores)
- ✅ Content follows WhatsApp guidelines?
- ✅ Business verified?

**Solution:**
- Wait 24-48 hours for approval
- Check rejection reason in Templates page
- Fix issues and resubmit

---

## 📊 **What's Working Now:**

### **✅ Fully Functional:**
- Send text messages
- Send media (images, videos, documents)
- Manage contacts
- View conversations
- Create templates
- View analytics

### **⏳ Needs Setup:**
- Webhook (for incoming messages)
- Templates (need approval)
- Campaigns (need templates)

---

## 🎉 **You're Ready!**

**Ab aap:**
- ✅ WhatsApp Business API se connect ho chuke hain
- ✅ Messages send kar sakte hain
- ✅ Contacts manage kar sakte hain
- ✅ Templates create kar sakte hain

**Next:**
1. Test message send karein
2. Webhook configure karein
3. Templates create karein
4. Start using! 🚀

---

## 💡 **Pro Tips:**

1. **Always use country code** in phone numbers: `+91XXXXXXXXXX`
2. **Test with your own number first** before sending to customers
3. **Use templates for marketing** messages (required by WhatsApp)
4. **Respond within 24 hours** to maintain conversation window
5. **Monitor quality rating** in Settings page

---

## 📞 **Need Help?**

**Check:**
- Settings page for connection status
- Edge Function logs in Supabase
- Meta Developers Console for API errors

**Common Commands:**
```bash
# Check Edge Function logs
supabase functions logs whatsapp_send
supabase functions logs webhook_inbound

# Test webhook
curl "https://YOUR_PROJECT.supabase.co/functions/v1/webhook_inbound?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
```

---

**Status:** 🟢 **READY TO USE!**

**Start sending messages now!** 🚀


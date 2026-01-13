# ⚡ WhatsApp Business Platform - Quick Start Guide

## 🎯 **5-Minute Setup**

### **Step 1: Fix Database (1 min)**
```bash
cd supabase
supabase migration up
```
This fixes the duplicate policy error.

---

### **Step 2: Set Secrets in Supabase (2 min)**

Go to: **Supabase Dashboard → Settings → Edge Functions → Secrets**

Add:
```
WHATSAPP_ACCESS_TOKEN = your_token_here
WHATSAPP_PHONE_NUMBER_ID = your_phone_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID = your_waba_id_here
WEBHOOK_VERIFY_TOKEN = any_random_string_here
```

**Where to get these:**
1. Go to https://developers.facebook.com/apps
2. Select your WhatsApp app
3. WhatsApp → Getting Started
4. Copy the values

---

### **Step 3: Configure Webhook (2 min)**

1. Go to https://developers.facebook.com/apps
2. Select your WhatsApp app
3. WhatsApp → Configuration → Webhook
4. Click "Edit"
5. Enter:
   - **URL**: `https://YOUR_PROJECT.supabase.co/functions/v1/webhook_inbound`
   - **Token**: Same as WEBHOOK_VERIFY_TOKEN above
6. Click "Verify and Save"
7. Subscribe to: `messages`, `message_status`, `message_template_status_update`, `account_update`

---

## 🚀 **You're Done! Start Using:**

### **Send Your First Message**
1. Go to: `https://your-app.com/dashboard/whatsapp/send`
2. Select a contact
3. Type a message
4. Click "Send" ✅

### **Create Your First Template**
1. Go to: `https://your-app.com/dashboard/whatsapp/templates`
2. Click "Create Template"
3. Fill details
4. Submit (approval takes 24-48 hours)

### **View Analytics**
1. Go to: `https://your-app.com/dashboard/whatsapp/analytics`
2. See all metrics and stats

---

## 📱 **All Features Available:**

| Feature | URL | Status |
|---------|-----|--------|
| **Dashboard** | `/dashboard/whatsapp` | ✅ Ready |
| **Send Messages** | `/dashboard/whatsapp/send` | ✅ Ready |
| **Templates** | `/dashboard/whatsapp/templates` | ✅ Ready |
| **Conversations** | `/dashboard/whatsapp/conversations` | ✅ Ready |
| **Contacts** | `/dashboard/whatsapp/contacts` | ✅ Ready |
| **Flows** | `/dashboard/whatsapp/flows` | ✅ Ready |
| **Analytics** | `/dashboard/whatsapp/analytics` | ✅ Ready |
| **Settings** | `/dashboard/whatsapp/settings` | ✅ Ready |
| **Campaigns** | `/dashboard/whatsapp/campaigns` | ✅ Ready |
| **Bot Builder** | `/dashboard/whatsapp/bot-builder` | ✅ Ready |

---

## 🎯 **Common Tasks**

### **Send a Text Message**
```typescript
// The UI handles this, or use Edge Function:
POST /functions/v1/whatsapp_send
{
  "phone_number": "+1234567890",
  "type": "text",
  "text": {
    "body": "Hello from WhatsApp!"
  }
}
```

### **Send an Image**
```typescript
POST /functions/v1/whatsapp_send
{
  "phone_number": "+1234567890",
  "type": "image",
  "image": {
    "link": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }
}
```

### **Send Interactive Buttons**
```typescript
POST /functions/v1/whatsapp_send
{
  "phone_number": "+1234567890",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "Choose an option:" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "1", "title": "Yes" }},
        { "type": "reply", "reply": { "id": "2", "title": "No" }}
      ]
    }
  }
}
```

---

## 🔍 **Testing**

### **Test Webhook**
```bash
# Test verification
curl "https://YOUR_PROJECT.supabase.co/functions/v1/webhook_inbound?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# Should return: test
```

### **Check Logs**
```bash
supabase functions logs webhook_inbound
supabase functions logs whatsapp_send
```

### **Check Database**
```sql
-- Recent messages
SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 5;

-- Active conversations
SELECT * FROM whatsapp_conversations WHERE status = 'open';
```

---

## 📊 **What You Get**

### **Message Types (9)**
✅ Text, Image, Video, Audio, Document, Location, Contact, Interactive, Template

### **Features**
✅ Real-time chat
✅ Message status tracking (sent, delivered, read)
✅ Template management
✅ WhatsApp Flows (interactive forms)
✅ Business profile management
✅ Advanced analytics
✅ Contact management
✅ Campaign management
✅ Bot builder

### **Analytics**
✅ Delivery rates
✅ Read rates
✅ Engagement metrics
✅ Cost analysis
✅ Template performance
✅ Conversation trends

---

## 🆘 **Need Help?**

### **Check These First:**
1. ✅ Environment variables set?
2. ✅ Webhook configured?
3. ✅ Database migrations applied?
4. ✅ Edge Functions deployed?

### **Common Issues:**

**Messages not sending?**
- Check Edge Function logs
- Verify access token
- Check phone number ID

**Webhooks not working?**
- Verify webhook URL
- Check verify token
- Test webhook endpoint

**Templates not creating?**
- Use lowercase and underscores only
- Check character limits
- Verify business account ID

---

## 📚 **Documentation**

- **Complete Guide**: `WHATSAPP_COMPLETE_100_PERCENT.md`
- **Deployment**: `DEPLOYMENT_CHECKLIST.md`
- **Implementation**: `WHATSAPP_PLATFORM_IMPLEMENTATION_PLAN.md`

---

## 🎉 **You're All Set!**

Your WhatsApp Business Platform is **100% complete** and ready to use!

**Start sending messages now!** 🚀

---

**Questions?** Check the documentation files or WhatsApp's official docs at https://developers.facebook.com/docs/whatsapp/

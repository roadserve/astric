# 🚀 WhatsApp Business - Quick Setup Guide

## For New Business Customers

Welcome! This guide will help you connect your WhatsApp Business to our platform in just **15 minutes**.

---

## ✅ What You'll Need

Before starting, make sure you have:
- [ ] A business email address
- [ ] Your business phone number
- [ ] Business documents (for Meta verification)
- [ ] 15-20 minutes of time

---

## 📱 Step-by-Step Setup

### **Step 1: Register on Platform (2 minutes)**

1. Go to our website
2. Click "Sign Up"
3. Enter your:
   - Business name
   - Email
   - Password
4. Verify your email
5. Login to dashboard

✅ **You're now registered!**

---

### **Step 2: Create Meta Business Account (5 minutes)**

#### **What is Meta Business Account?**
This is Facebook's business management platform. You need it to use WhatsApp Business API (it's free!)

#### **How to Create:**

1. **Go to:** https://business.facebook.com

2. **Click "Create Account"**

3. **Fill in details:**
   - Business name
   - Your name
   - Business email

4. **Click "Submit"**

5. **Verify your email** (check inbox)

6. **Add business information:**
   - Address
   - Phone number
   - Website (optional)

✅ **Business Account Created!**

⚠️ **Note:** Business verification may take 1-3 days, but you can continue setup now.

---

### **Step 3: Create WhatsApp App (5 minutes)**

Now you'll create a WhatsApp app in Meta Developers:

1. **Go to:** https://developers.facebook.com

2. **Login** with same account

3. **Click "My Apps" → "Create App"**

4. **Select "Business" as app type**

5. **Fill in:**
   - App Name: "YourBusinessName WhatsApp"
   - Contact Email: Your email
   - Business Account: Select your business

6. **Click "Create App"**

7. **Find "WhatsApp" product → Click "Set up"**

8. **Add Phone Number:**
   - Click "Add Phone Number"
   - Enter your business phone
   - Verify with OTP (SMS/call)

✅ **WhatsApp App Created!**

---

### **Step 4: Get Your Credentials (3 minutes)**

Now copy 3 important credentials:

#### **A. Phone Number ID**
```
Location: WhatsApp → API Setup → Phone Number ID
Example: 123456789012345
Action: COPY THIS NUMBER
```

#### **B. Business Account ID**
```
Location: WhatsApp → API Setup → Top of page
Example: 123456789012345
Action: COPY THIS NUMBER
```

#### **C. Access Token (IMPORTANT!)**

**Temporary Token (24 hours):**
```
Location: WhatsApp → API Setup → "Temporary access token"
Action: COPY THIS (but we'll create permanent one next)
```

**Create Permanent Token (Recommended):**

1. Go to: **Business Settings** → **System Users**
2. Click "Add" → Create system user:
   - Name: "WhatsApp API User"
   - Role: Admin
3. Click "Add Assets"
4. Select **Apps** → Choose your WhatsApp app
5. Enable "WhatsApp Business Management" permission
6. Click "Generate Token"
7. Select your app
8. Enable all WhatsApp permissions
9. Click "Generate Token"
10. **COPY AND SAVE THIS TOKEN SECURELY!**

⚠️ **IMPORTANT:** This token is like a password. Never share it publicly!

✅ **All Credentials Copied!**

---

### **Step 5: Connect to Platform (2 minutes)**

Now let's connect everything:

1. **Login** to our platform

2. **Go to:** Dashboard → WhatsApp → Setup
   (Or click the "Setup WhatsApp" button)

3. **Enter your credentials:**

```
┌─────────────────────────────────────┐
│ Phone Number ID                     │
│ [Paste here]                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Business Account ID                 │
│ [Paste here]                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Access Token                        │
│ [Paste your permanent token]       │
└─────────────────────────────────────┘
```

4. **Click "Test Connection"** to verify

5. **Click "Save Configuration"**

✅ **Platform Connected!**

---

### **Step 6: Configure Webhook (Optional - 2 minutes)**

To receive messages, configure webhook:

1. In our platform, go to **Settings** → Copy webhook URL

2. In Meta Developers:
   - Go to: WhatsApp → Configuration → Webhook
   - Click "Edit"
   - **Callback URL:** Paste our webhook URL
   - **Verify Token:** Get from our platform
   - Click "Verify and Save"

3. **Subscribe to events:**
   - ✅ messages
   - ✅ message_status
   - ✅ message_template_status_update

✅ **Webhook Configured!**

---

## 🎉 You're All Set!

### **What You Can Do Now:**

#### **1. Send Messages**
```
Dashboard → WhatsApp → Send
- Choose contacts
- Type message
- Click Send
```

#### **2. Manage Conversations**
```
Dashboard → WhatsApp → Conversations
- View all chats
- Reply to customers
- Real-time messaging
```

#### **3. Create Templates**
```
Dashboard → WhatsApp → Templates
- Create message templates
- Submit for approval (24-48 hours)
- Use in bulk messaging
```

#### **4. View Analytics**
```
Dashboard → WhatsApp → Analytics
- Message delivery rates
- Read rates
- Engagement metrics
```

---

## 💡 Quick Tips

### **Best Practices:**

✅ **DO:**
- Get customer opt-in before messaging
- Respond to messages within 24 hours
- Use approved templates for promotions
- Keep your quality rating high

❌ **DON'T:**
- Send spam or unsolicited messages
- Use unapproved templates
- Ignore customer messages
- Share your access token

### **Quality Rating:**

Your WhatsApp account has a quality rating (Green, Yellow, Red):
- **Green:** Excellent! Keep it up
- **Yellow:** Warning - improve message quality
- **Red:** Risk of restrictions

**How to maintain GREEN:**
1. Only message opted-in customers
2. Respond quickly
3. Use approved templates
4. Don't send spam

---

## 📊 Understanding WhatsApp Pricing

### **Meta's Pricing (Charged by Meta, not us):**

WhatsApp charges per **conversation** (not per message):

**Conversation = 24-hour window with a customer**

#### **Types:**

1. **Marketing Conversations:** ₹XX per conversation
   - Promotions, offers, updates
   - Requires approved template

2. **Utility Conversations:** ₹XX per conversation
   - Order updates, receipts, alerts
   - Approved templates

3. **Service Conversations:** Free (first 1000/month)
   - Customer replies to you
   - No template needed

4. **Authentication:** ₹XX per conversation
   - OTPs, verification codes

#### **Free Tier:**
- First 1,000 conversations/month = FREE
- After that, charges apply

💡 **Tip:** Encourage customers to message you first (service conversations are cheaper!)

---

## ❓ Frequently Asked Questions

### **Q: How long does setup take?**
**A:** 15-20 minutes if you have all documents ready.

### **Q: Do I need to verify my business?**
**A:** Yes, but you can start using the API while verification is pending. Some features may be limited.

### **Q: Can I use my existing WhatsApp number?**
**A:** Yes! You can migrate your number, but it will move from WhatsApp Business app to API.

### **Q: Will customers see my messages?**
**A:** Yes, messages appear in their regular WhatsApp app, just like normal messages.

### **Q: How many messages can I send?**
**A:** Depends on your tier:
- Tier 1: 1,000 conversations/day
- Tier 2: 10,000 conversations/day
- Tier 3: 100,000 conversations/day
- Unlimited: No limits

You start at Tier 1 and upgrade automatically based on quality.

### **Q: How do I increase my message limit?**
**A:**
1. Maintain high quality rating (GREEN)
2. Send more messages
3. Get good response rates
4. WhatsApp automatically upgrades you

### **Q: What if my access token expires?**
**A:** Permanent tokens don't expire. If you used temporary token, create a permanent one (see Step 4).

### **Q: Can I have multiple users?**
**A:** Yes! Add team members in: Settings → Team Members

### **Q: Is my data safe?**
**A:** Yes, your data is isolated and secured. We use Row Level Security (RLS).

### **Q: Can I export my data?**
**A:** Yes, export contacts and analytics anytime from the dashboard.

---

## 🆘 Need Help?

### **Common Issues:**

#### **❌ "Connection Failed"**
**Solution:**
- Check Phone Number ID is correct
- Verify Access Token is valid
- Ensure token has WhatsApp permissions
- Try creating new permanent token

#### **❌ "Messages not sending"**
**Solution:**
- Check quality rating (Dashboard → Settings)
- Verify phone number status
- Ensure customer opted in
- Check message template approval

#### **❌ "Webhook not working"**
**Solution:**
- Verify webhook URL is correct
- Check verify token matches
- Test webhook endpoint
- Ensure subscriptions are enabled

#### **❌ "Quality rating is Yellow/Red"**
**Solution:**
- Stop sending promotional messages
- Only message opted-in customers
- Improve response time
- Use approved templates only

---

### **Contact Support:**

**Email:** support@yourplatform.com

**Live Chat:** Available in dashboard (bottom right)

**Knowledge Base:** https://yourplatform.com/help

**Video Tutorials:** https://youtube.com/@yourplatform

---

## 📚 Additional Resources

### **Official Documentation:**
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help](https://business.facebook.com/help)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)

### **Video Tutorials:**
- [ ] Complete Setup Guide (15 min)
- [ ] Sending Your First Message (5 min)
- [ ] Creating Message Templates (10 min)
- [ ] Understanding Analytics (8 min)

---

## ✅ Setup Checklist

Use this to track your progress:

```
□ Step 1: Registered on platform
□ Step 2: Created Meta Business Account
□ Step 3: Created WhatsApp App
□ Step 4: Copied all credentials
□ Step 5: Connected to platform
□ Step 6: Configured webhook
□ Step 7: Sent test message
□ Step 8: Created first template
□ Step 9: Invited team members
□ Step 10: Explored all features

🎉 COMPLETE!
```

---

## 🎯 Next Steps After Setup

### **Week 1: Get Familiar**
- [ ] Send 10 test messages
- [ ] Create 3 message templates
- [ ] Add 50 contacts
- [ ] Explore analytics

### **Week 2: Scale Up**
- [ ] Launch first campaign
- [ ] Setup auto-replies
- [ ] Create WhatsApp flows
- [ ] Train team members

### **Month 1: Optimize**
- [ ] Analyze performance
- [ ] Improve response time
- [ ] A/B test templates
- [ ] Scale to 100+ customers

---

## 🎊 Congratulations!

You're now ready to use WhatsApp Business API for your business!

**Start messaging your customers today!** 🚀

---

**Questions?** Contact us anytime - we're here to help!

**Email:** support@yourplatform.com  
**Chat:** Available 24/7 in dashboard


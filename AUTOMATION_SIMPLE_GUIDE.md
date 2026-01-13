# Automation - Simple Guide for Non-Technical Users
# Automation - गैर-तकनीकी Users के लिए आसान गाइड

## 📖 Overview / परिचय

This guide explains the Automation feature in **simple Hindi and English** for non-technical users. आपको कोई technical knowledge की जरूरत नहीं है!

---

## ✨ What is Automation? / Automation क्या है?

**Automation** means making repetitive tasks automatic so you don't have to do them manually every time.

**उदाहरण (Examples):**
- जब कोई नया customer आए → automatically welcome email भेजना
- हर रोज़ सुबह 9 बजे → sales report email करना
- जब payment receive हो → WhatsApp पर notification भेजना
- Database से data लेकर → उसे process करके email करना

**Benefit:** आपका time बचता है और कोई काम miss नहीं होता!

---

## 🚀 How to Start? / कैसे शुरू करें?

### Option 1: Simple Wizard (Recommended for Beginners)

1. Go to **Dashboard → Automation**
2. Click on **"Simple Wizard"** (green button)
3. Choose a template:
   - **ईमेल भेजें / Send Email Notification**
   - **व्हाट्सएप मेसेज / WhatsApp Alert**
   - **रोज़ाना रिपोर्ट / Daily Report**
4. Follow the step-by-step questions
5. Click **"Automation शुरू करें"** and done!

**यह तरीका सबसे आसान है - सब कुछ Hindi/English में समझाया जाता है!**

### Option 2: Advanced Editor (For Experienced Users)

If you know technical terms and want full control, use the **"Advanced Editor"** button.

---

## 📝 Common Workflows / आम Workflows

### 1. Email Notification

**Use Case:** जब कोई event हो तो email भेजना

**What you need:**
- Email provider (Gmail, Outlook, etc.)
- Your email and password
- Recipient email address
- Subject and message

**Example:**
- Trigger: New customer signup
- Action: Send welcome email

### 2. WhatsApp Alert

**Use Case:** Important updates WhatsApp पर भेजना

**What you need:**
- WhatsApp Business API Key
- Recipient phone number (format: 91XXXXXXXXXX)
- Message text

### 3. Daily Report

**Use Case:** हर दिन एक fixed time पर report email करना

**What you need:**
- Time (e.g., 09:00 AM)
- Email settings
- Report type (Sales, Customers, Inventory)

### 4. Conditional Actions (IF/THEN)

**Use Case:** "अगर ऐसा हो तो वो करो"

**Example:**
- IF: Payment > ₹10,000
- THEN: Send WhatsApp to manager

---

## 🔑 Important Terms / ज़रूरी शब्द

### Workflow
एक complete automation process। सभी steps को मिलाकर एक workflow बनता है।

### Trigger
वो चीज़ जो workflow को start करती है:
- **Webhook:** जब कोई external system आपको call करे
- **Schedule:** Time-based (e.g., हर दिन 9 बजे)
- **Manual:** आप खुद Test button से चलाएं

### Node
हर action को एक node कहते हैं:
- Send Email node
- Send WhatsApp node
- Database Query node
- IF Condition node

### Execution
जब workflow run होता है। आप logs में देख सकते हैं:
- ✅ Success: सब ठीक चला
- ❌ Error: कुछ गड़बड़ हुई (error message दिखेगा)

---

## 🛠️ How to Set Up Email (SMTP)

Gmail के लिए:

1. **SMTP Host:** `smtp.gmail.com`
2. **Port:** `587`
3. **Your Email:** जैसे `yourname@gmail.com`
4. **Password:** 
   - अगर 2-factor authentication है तो **App Password** बनाएं
   - Gmail Settings → Security → App Passwords → Generate
5. **To Email:** जिसको email भेजना है

---

## 📱 How to Set Up WhatsApp

You need **WhatsApp Business API** access:

1. Get API Key from a WhatsApp provider (e.g., Twilio, MessageBird)
2. Enter API Key in the wizard
3. Enter recipient number: `91XXXXXXXXXX` (include country code)
4. Write your message

---

## 📊 How to Check If Workflow is Working

1. Go to **Dashboard → Automation**
2. Click on your workflow
3. Click **"Test"** button
4. Check **"Recent Executions"** section:
   - **Success:** Green status, workflow चला
   - **Error:** Red status, click "View" to see error details

---

## 💡 Tips for Non-Technical Users

✅ **Start with Simple Wizard** - सब step-by-step समझाया जाएगा

✅ **Use Templates** - Ready-made workflows जो बस छोटे changes के साथ काम करेंगे

✅ **Test First** - पहले Test button से check करें, फिर Activate करें

✅ **Check Logs** - अगर कुछ गलत हो तो execution logs में reason दिखेगा

✅ **Save Credentials** - Email password, API keys - सब securely save हो जाते हैं

⚠️ **Mind the Limits** - आपके plan के हिसाब से:
- Maximum workflows per month
- Maximum executions per month

---

## ❓ Troubleshooting / समस्या हल करना

### Email नहीं जा रहा?

- Check SMTP settings सही हैं
- Gmail में App Password use करें (normal password काम नहीं करेगा अगर 2FA है)
- Check "To Email" सही है

### WhatsApp नहीं जा रहा?

- API Key valid है?
- Phone number सही format में है? (91XXXXXXXXXX)
- WhatsApp Business API active है?

### Workflow Execute नहीं हो रहा?

- Check workflow "Active" है (green status)
- Check trigger सही set है
- Logs में error message देखें

---

## 📚 Need More Help?

1. **Help Page:** Dashboard → Automation → Help button
2. **Simple Wizard:** सबसे आसान तरीका - वहाँ से शुरू करें
3. **Templates:** Ready-made workflows use करें
4. **Support Team:** Contact करें अगर problem solve नहीं हो रही

---

## 🎯 Quick Start Checklist

- [ ] Go to Dashboard → Automation
- [ ] Click "Simple Wizard"
- [ ] Choose a template (Email, WhatsApp, or Report)
- [ ] Fill in details step-by-step
- [ ] Click "Test" to check
- [ ] Click "Activate" to make it live
- [ ] Check execution logs to verify

**बस इतना ही! आपका first automation ready है! 🎉**

---

## 📞 Support

अगर कोई doubt है तो:
- Help page पढ़ें (Dashboard में Help button)
- Support team को contact करें
- Simple Wizard use करें - सब explain किया जाता है

**Remember:** Automation थोड़ा समय लेकर setup होता है, लेकिन एक बार set up हो जाए तो बहुत time बचाता है! 🚀

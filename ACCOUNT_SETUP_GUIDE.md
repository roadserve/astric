# 🔗 Account Connection Setup Guide

This guide will help you connect all the necessary accounts to your AI SME Copilot CRM application.

---

## 🎯 **Setup Priority Order**

1. **Supabase (Required)** - Database & Authentication
2. **Google My Business** - Local business management
3. **Social Media Accounts** - Marketing & engagement
4. **WhatsApp Business** - Customer communication
5. **Payment Processing** - Billing & payments

---

## 1. 🗄️ **Supabase Setup (REQUIRED)**

### Step 1: Get Supabase Credentials
1. Go to [supabase.com](https://supabase.com) and sign in
2. Open your project dashboard
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL**
   - **anon/public key**

### Step 2: Update Environment Variables

#### For Web App:
```bash
# Edit web/.env.production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://touchnsearch.com
```

#### For Mobile App:
```dart
// Edit mobile/lib/core/config/app_config.dart
const String supabaseUrl = 'your_supabase_project_url';
const String supabaseAnonKey = 'your_supabase_anon_key';
```

### Step 3: Configure Authentication
1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Add to **Site URL**: `https://touchnsearch.com`
3. Add to **Redirect URLs**:
   - `https://touchnsearch.com/auth/callback`
   - `https://touchnsearch.com/dashboard`

---

## 2. 🏢 **Google My Business Setup**

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google My Business API**
4. Create **Service Account** credentials
5. Download the JSON key file

### Step 2: Configure GMB API
1. Go to **APIs & Services** → **Credentials**
2. Create **OAuth 2.0 Client ID**
3. Add authorized redirect URIs:
   - `https://touchnsearch.com/auth/google/callback`
   - `http://localhost:3000/auth/google/callback` (for development)

### Step 3: Set Up Business Profile
1. Go to [Google My Business](https://business.google.com)
2. Create or claim your business listing
3. Verify your business
4. Add business information

### Step 4: Update Environment Variables
```bash
# Add to web/.env.production
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_MY_BUSINESS_API_KEY=your_gmb_api_key
```

---

## 3. 📱 **Social Media Accounts Setup**

### Facebook & Instagram
1. **Create Facebook Developer Account**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create a new app
   - Add **Facebook Login** and **Instagram Basic Display** products

2. **Set Up Business Manager**
   - Go to [business.facebook.com](https://business.facebook.com)
   - Create Business Manager account
   - Add your Facebook Page and Instagram Business account

3. **Get API Credentials**
   - App ID and App Secret from Facebook Developer Console
   - Access tokens for your pages

### Twitter/X
1. **Apply for Developer Account**
   - Go to [developer.twitter.com](https://developer.twitter.com)
   - Apply for developer access
   - Create a new app

2. **Get API Keys**
   - API Key and API Secret
   - Bearer Token
   - Access Token and Secret

### LinkedIn
1. **Create LinkedIn App**
   - Go to [linkedin.com/developers](https://linkedin.com/developers)
   - Create a new app
   - Request access to Marketing API

2. **Get Credentials**
   - Client ID and Client Secret
   - Access tokens

### YouTube
1. **Enable YouTube Data API**
   - In Google Cloud Console
   - Enable YouTube Data API v3
   - Create OAuth 2.0 credentials

### TikTok
1. **Apply for TikTok for Business**
   - Go to [business.tiktok.com](https://business.tiktok.com)
   - Apply for developer access
   - Create app for API access

### Snapchat
1. **Create Snapchat Business Account**
   - Go to [business.snapchat.com](https://business.snapchat.com)
   - Apply for Marketing API access
   - Get API credentials

---

## 4. 💬 **WhatsApp Business Setup**

### Step 1: Create Meta Business Account
1. Go to [business.facebook.com](https://business.facebook.com)
2. Create Business Manager account
3. Add WhatsApp Business account

### Step 2: Set Up WhatsApp Cloud API
1. In Business Manager, go to **WhatsApp** → **API Setup**
2. Get your:
   - **Phone Number ID**
   - **WhatsApp Business Account ID**
   - **Access Token**

### Step 3: Configure Webhook
1. Set webhook URL: `https://touchnsearch.com/api/webhook/whatsapp`
2. Verify webhook token
3. Subscribe to message events

### Step 4: Update Environment Variables
```bash
# Add to web/.env.production
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_token
```

---

## 5. 💳 **Payment Processing Setup (Optional)**

### Razorpay (Recommended for India)
1. **Create Razorpay Account**
   - Go to [razorpay.com](https://razorpay.com)
   - Sign up for business account
   - Complete KYC verification

2. **Get API Keys**
   - Key ID and Key Secret from dashboard
   - Webhook secret for payment notifications

3. **Update Environment Variables**
```bash
# Add to web/.env.production
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Stripe (International)
1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Create business account
   - Complete account verification

2. **Get API Keys**
   - Publishable key and Secret key
   - Webhook endpoint secret

---

## 🔧 **Environment Variables Summary**

Create a complete `.env.production` file:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://touchnsearch.com

# Google My Business
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_MY_BUSINESS_API_KEY=your_gmb_api_key

# Facebook & Instagram
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
INSTAGRAM_ACCESS_TOKEN=your_instagram_token

# Twitter/X
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# YouTube
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# TikTok
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Snapchat
SNAPCHAT_CLIENT_ID=your_snapchat_client_id
SNAPCHAT_CLIENT_SECRET=your_snapchat_client_secret

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_token

# Payment Processing
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Optional: Stripe
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

---

## 🚀 **Testing Your Connections**

### 1. Test Supabase Connection
- Try logging in/registering on your website
- Check if data is being saved to database

### 2. Test GMB Connection
- Go to GMB dashboard in your app
- Try connecting your Google account
- Test creating a post

### 3. Test Social Media
- Go to Social Media dashboard
- Try connecting each platform
- Test creating a post

### 4. Test WhatsApp
- Send a test message
- Check if webhook is receiving messages

### 5. Test Payments
- Create a test invoice
- Try processing a payment

---

## 🆘 **Troubleshooting**

### Common Issues:
1. **API Rate Limits** - Check if you've exceeded platform limits
2. **Invalid Credentials** - Double-check all API keys
3. **Webhook Issues** - Ensure webhook URLs are accessible
4. **Permissions** - Check if apps have required permissions

### Support Resources:
- **Supabase Docs**: https://supabase.com/docs
- **Facebook Developer**: https://developers.facebook.com/docs
- **Google My Business API**: https://developers.google.com/my-business
- **WhatsApp API**: https://developers.facebook.com/docs/whatsapp

---

## ✅ **Setup Checklist**

- [ ] Supabase credentials configured
- [ ] Google My Business API set up
- [ ] Facebook/Instagram accounts connected
- [ ] Twitter/X developer account created
- [ ] LinkedIn app configured
- [ ] YouTube API enabled
- [ ] TikTok business account set up
- [ ] Snapchat business account created
- [ ] WhatsApp Business API configured
- [ ] Payment gateway set up (optional)
- [ ] All environment variables added
- [ ] Webhooks configured
- [ ] Test all connections

---

**🎉 Once all accounts are connected, your CRM will be fully functional with all features!**

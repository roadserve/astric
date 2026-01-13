# 📱 Social Media Integration Setup Guide

## 🎯 Overview

Your CRM supports **7 social media platforms**:
1. 📘 Facebook - Posts, Ads, Analytics
2. 📷 Instagram - Feed, Stories, Reels, Ads
3. 🎵 TikTok - Videos, Ads, Analytics
4. 🐦 Twitter/X - Tweets, Ads, Analytics
5. 💼 LinkedIn - Posts, Articles, Ads
6. ▶️ YouTube - Videos, Ads, Analytics
7. 👻 Snapchat - Stories, Ads, Analytics

---

## 🚀 **Part 1: Facebook & Instagram Setup**

### **Why Start Here?**
- ✅ Same API (Facebook Graph API)
- ✅ Most popular platforms
- ✅ Easy to set up
- ✅ Good for testing

---

## 📋 **Step-by-Step Setup**

### **Step 1: Create Facebook Developer Account**

1. Go to: https://developers.facebook.com
2. **Sign in** with your Facebook account
3. Click **"Get Started"** (if first time)
4. **Complete registration:**
   - Accept terms
   - Verify email
   - Complete profile

---

### **Step 2: Create Facebook App**

1. Click **"My Apps"** → **"Create App"**
2. **Choose app type:** **"Business"**
3. Click **"Next"**
4. Fill in details:
   - **App name:** `Touch N Search CRM`
   - **App contact email:** `guptaak33@gmail.com`
   - **Business account:** (select if you have one)
5. Click **"Create App"**

---

### **Step 3: Add Products to Your App**

In your app dashboard, add these products:

#### **A. Facebook Login**
1. Find **"Facebook Login"** product
2. Click **"Set Up"**
3. Choose **"Web"** platform
4. **Site URL:** `https://touchnsearch.com`
5. Click **"Save"**

#### **B. Instagram Basic Display**
1. Find **"Instagram Basic Display"**
2. Click **"Set Up"**
3. Click **"Create New App"**
4. Fill in:
   - **Display Name:** `Touch N Search CRM`
   - **Valid OAuth Redirect URIs:**
     ```
     https://touchnsearch.com/auth/instagram/callback
     http://localhost:3000/auth/instagram/callback
     ```
5. Click **"Save Changes"**

---

### **Step 4: Get App Credentials**

1. Go to **Settings** → **Basic**
2. **Copy these values:**
   - ✅ **App ID:** (e.g., `123456789012345`)
   - ✅ **App Secret:** Click **"Show"** and copy

**Save these securely!**

---

### **Step 5: Configure App Settings**

#### **A. App Domains**
Add these domains:
```
touchnsearch.com
localhost
```

#### **B. Valid OAuth Redirect URIs**
```
https://touchnsearch.com/dashboard/social/callback
http://localhost:3000/dashboard/social/callback
```

#### **C. Privacy Policy URL**
```
https://touchnsearch.com/privacy
```

#### **D. Terms of Service URL**
```
https://touchnsearch.com/terms
```

---

### **Step 6: Request Permissions**

Go to **App Review** → **Permissions and Features**

Request these permissions:
- ✅ `pages_show_list` - See list of Pages
- ✅ `pages_read_engagement` - Read Page engagement
- ✅ `pages_manage_posts` - Create and manage posts
- ✅ `instagram_basic` - Basic Instagram access
- ✅ `instagram_content_publish` - Publish content
- ✅ `public_profile` - Access public profile

---

### **Step 7: Switch to Live Mode**

1. Go to **Settings** → **Basic**
2. Toggle **"App Mode"** to **"Live"**
3. Confirm the switch

---

## 🔧 **Part 2: Update Your Application**

### **Step 8: Add Environment Variables**

#### **Supabase Secrets:**
Add these in **Supabase Dashboard** → **Edge Functions** → **Secrets**:

```bash
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=https://touchnsearch.com/dashboard/social/callback
```

#### **Local .env.local:**
Add to `web/.env.local`:

```bash
# Facebook & Instagram
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/dashboard/social/callback
```

---

### **Step 9: Test Connection**

1. Go to `http://localhost:3000/dashboard/social`
2. Click **"Connect Account"**
3. Choose **Facebook** or **Instagram**
4. **Authorize** the app
5. **Should see your pages/accounts!** ✅

---

## 📱 **Part 3: Instagram Business Setup**

### **Requirements:**
- ✅ Instagram Business or Creator account
- ✅ Facebook Page linked to Instagram
- ✅ Facebook app configured (done above)

### **Steps:**

1. **Convert to Business Account:**
   - Open Instagram app
   - Go to **Settings** → **Account**
   - **Switch to Professional Account**
   - Choose **Business**

2. **Link to Facebook Page:**
   - In Instagram settings
   - **Linked Accounts** → **Facebook**
   - Connect your Facebook page

3. **Test in CRM:**
   - Connect Facebook in your CRM
   - Instagram will automatically connect
   - Can now post to both!

---

## 🎯 **Part 4: Other Platforms (Quick Overview)**

### **Twitter/X Setup:**

1. Go to: https://developer.twitter.com
2. Create developer account
3. Create app
4. Get API keys
5. Add to Supabase secrets

### **LinkedIn Setup:**

1. Go to: https://www.linkedin.com/developers
2. Create app
3. Request Marketing API access
4. Get Client ID and Secret
5. Add to Supabase secrets

### **TikTok Setup:**

1. Go to: https://developers.tiktok.com
2. Apply for developer access
3. Create app
4. Get credentials
5. Add to Supabase secrets

---

## 📊 **Features You'll Get:**

### **After Setup:**
- ✅ Connect multiple social accounts
- ✅ Post to all platforms at once
- ✅ Schedule posts
- ✅ Create & manage ads
- ✅ Track engagement (likes, comments, shares)
- ✅ View analytics
- ✅ AI-powered insights
- ✅ Best time to post suggestions

---

## 🆘 **Troubleshooting**

### **Common Issues:**

**1. "App Not Set Up"**
- Make sure app is in **Live mode**
- Check redirect URIs match exactly

**2. "Invalid OAuth Redirect URI"**
- Verify URIs in Facebook app settings
- No trailing slashes
- Must match exactly

**3. "Permissions Denied"**
- Request permissions in App Review
- Add test users if in development mode

---

## ✅ **Checklist:**

- [ ] Facebook Developer account created
- [ ] Facebook app created
- [ ] App ID and Secret copied
- [ ] Facebook Login added
- [ ] Instagram Basic Display added
- [ ] Redirect URIs configured
- [ ] Permissions requested
- [ ] App switched to Live mode
- [ ] Supabase secrets added
- [ ] Local .env.local updated
- [ ] Instagram Business account set up
- [ ] Facebook page linked to Instagram
- [ ] Test connection successful

---

## 🎉 **What's Next?**

After Facebook & Instagram working:
1. Add Twitter/X
2. Add LinkedIn
3. Add TikTok
4. Add YouTube
5. Add Snapchat

---

**Let's start with Facebook! Ready?** 🚀

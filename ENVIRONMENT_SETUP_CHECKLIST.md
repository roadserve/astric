# ✅ Environment Variables Setup Checklist

## Step-by-Step Guide to Get Your Credentials

---

## 📋 **What You Need to Get:**

1. ✅ Google Client ID
2. ✅ Google Client Secret  
3. ✅ Google API Key
4. ✅ Service Account Email (optional)

---

## 🔧 **Step-by-Step Process:**

### Step 1: Google Cloud Console
1. Go to: [https://console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with: `guptaak33@gmail.com`

### Step 2: Create Project
1. Click **"Select a project"** (top bar)
2. Click **"New Project"**
3. Enter name: `touchnsearch-master-api`
4. Click **"Create"**
5. Wait 1-2 minutes

### Step 3: Enable APIs
1. Go to **"APIs & Services"** → **"Library"**
2. Search and enable:
   - ✅ Google My Business API
   - ✅ Google Maps API
   - ✅ YouTube Data API v3 (optional)

### Step 4: Configure OAuth Consent Screen
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** → Click **"Create"**
3. Fill in:
   - **App name**: `AI SME Copilot`
   - **User support email**: `guptaak33@gmail.com`
   - **Developer contact**: `guptaak33@gmail.com`
4. Click **"Save and Continue"**

5. **Add Scopes**:
   - Click **"Add or Remove Scopes"**
   - Add these:
     ```
     https://www.googleapis.com/auth/business.manage
     https://www.googleapis.com/auth/userinfo.email
     https://www.googleapis.com/auth/userinfo.profile
     ```
   - Click **"Update"** → **"Save and Continue"**

6. **Add Test Users**:
   - Add: `guptaak33@gmail.com`
   - Click **"Save and Continue"**

7. Click **"Back to Dashboard"**

### Step 5: Create OAuth 2.0 Client ID
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Choose **"Web application"**
4. Fill in:
   - **Name**: `touchnsearch-web-client`
   - **Authorized redirect URIs**:
     ```
     https://touchnsearch.com/dashboard/gmb/callback
     http://localhost:3000/dashboard/gmb/callback
     ```
5. Click **"Create"**

6. **COPY THESE VALUES** (popup will show):
   ```
   Client ID: 1234567890-abc123xyz.apps.googleusercontent.com
   Client Secret: GOCSPX-abc123xyz789
   ```
   **Save these somewhere safe!** ✅

### Step 6: Create API Key
1. In **"Credentials"** tab
2. Click **"+ Create Credentials"** → **"API Key"**
3. **Copy the API Key** that appears
4. (Optional) Click **"Restrict Key"** for security

---

## 📝 **Your Credentials Template:**

Copy this and fill in your actual values:

```bash
# ============================================
# GOOGLE MY BUSINESS CREDENTIALS
# ============================================

# OAuth 2.0 Client
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here

# API Key
GOOGLE_MY_BUSINESS_API_KEY=paste_your_api_key_here

# Redirect URI
GOOGLE_REDIRECT_URI=https://touchnsearch.com/dashboard/gmb/callback

# ============================================
# SUPABASE CREDENTIALS (Already configured)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🚀 **Where to Add These:**

### Option 1: Supabase Dashboard (For Production)
1. Go to your Supabase project
2. **Settings** → **Edge Functions** → **Secrets**
3. Add each variable one by one

### Option 2: Local Development
Create file: `web/.env.local`
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_MY_BUSINESS_API_KEY=your_api_key
GOOGLE_REDIRECT_URI=http://localhost:3000/dashboard/gmb/callback
```

### Option 3: Hostinger (For touchnsearch.com)
1. In Hostinger control panel
2. Go to **Website** → **Advanced** → **Environment Variables**
3. Add each variable

---

## ✅ **Verification Checklist:**

- [ ] Google Cloud project created
- [ ] APIs enabled (GMB, Maps)
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Client ID copied and saved
- [ ] Client Secret copied and saved
- [ ] API Key created and saved
- [ ] Redirect URIs added correctly
- [ ] Environment variables added to Supabase
- [ ] Environment variables added to local .env.local

---

## 🧪 **Test Your Setup:**

### Test 1: Check if variables are loaded
```bash
# In your terminal (from web folder)
cd web
npm run dev

# Open browser console and check:
console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
# Should show your Client ID
```

### Test 2: Test OAuth Flow
1. Run your app locally: `npm run dev`
2. Go to: `http://localhost:3000/dashboard/gmb`
3. Click **"Connect Google My Business"**
4. Should redirect to Google login
5. After authorization, should redirect back to your app

---

## 🆘 **Common Issues:**

### Issue 1: "Invalid Client ID"
**Solution**: 
- Double-check your Client ID in .env.local
- Make sure there are no extra spaces
- Verify it matches the one in Google Cloud Console

### Issue 2: "Redirect URI mismatch"
**Solution**:
- Go to Google Cloud Console → Credentials
- Edit your OAuth Client
- Make sure redirect URI exactly matches:
  - `http://localhost:3000/dashboard/gmb/callback` (for local)
  - `https://touchnsearch.com/dashboard/gmb/callback` (for production)

### Issue 3: "Access blocked: This app's request is invalid"
**Solution**:
- Complete OAuth consent screen configuration
- Add your email as test user
- Make sure all required scopes are added

---

## 📞 **Need Help?**

If you get stuck at any step:
1. Take a screenshot of the error
2. Note which step you're on
3. Check the error message carefully

---

## 🎯 **Next Steps After Setup:**

Once all variables are configured:
1. ✅ Rebuild your app: `npm run build`
2. ✅ Test GMB connection locally
3. ✅ Deploy to touchnsearch.com
4. ✅ Test in production
5. ✅ Start onboarding customers!

---

**🎉 You're ready to sell your service to SME customers!**

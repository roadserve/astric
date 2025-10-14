# 🏢 Google My Business Setup Guide

## Step-by-Step Setup for touchnsearch.com

---

## **Part A: Google Cloud Console Setup**

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account
3. Click **"Select a project"** → **"New Project"**
4. Fill in:
   - **Project name**: `touchnsearch-crm`
   - **Organization**: (select if you have one)
5. Click **"Create"**

### 2. Enable Required APIs
1. Go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Google My Business API** ✅
   - **Google Maps API** ✅
   - **YouTube Data API v3** ✅ (optional)

### 3. Create Service Account
1. Go to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **"Service Account"**
3. Fill in:
   - **Service account name**: `touchnsearch-gmb-service`
   - **Service account ID**: `touchnsearch-gmb-service`
   - **Description**: `Service account for GMB integration`
4. Click **"Create and Continue"**
5. **Skip roles** (click "Continue")
6. Click **"Done"**

### 4. Generate Service Account Key
1. Click on your service account name
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create New Key"**
4. Choose **"JSON"** format
5. Click **"Create"**
6. **Download the JSON file** - keep it secure!

### 5. Create OAuth 2.0 Client
1. In **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Choose **"Web application"**
4. Fill in:
   - **Name**: `touchnsearch-web-client`
   - **Authorized redirect URIs**:
     - `https://touchnsearch.com/auth/google/callback`
     - `http://localhost:3000/auth/google/callback`
5. Click **"Create"**
6. **Copy the Client ID and Client Secret** - you'll need these!

---

## **Part B: OAuth Consent Screen**

### 1. Configure OAuth Consent Screen
1. Go to **OAuth consent screen**
2. Choose **"External"** user type
3. Click **"Create"**
4. Fill in required fields:
   - **App name**: `AI SME Copilot`
   - **User support email**: `guptaak33@gmail.com`
   - **Developer contact**: `guptaak33@gmail.com`
5. Click **"Save and Continue"**

### 2. Add Scopes
1. Click **"Add or Remove Scopes"**
2. Add these scopes:
   - `https://www.googleapis.com/auth/business.manage`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. Click **"Update"** → **"Save and Continue"**

### 3. Add Test Users (Optional)
1. Add your email: `guptaak33@gmail.com`
2. Click **"Save and Continue"**

---

## **Part C: Google My Business Profile**

### 1. Create Business Profile
1. Go to [Google My Business](https://business.google.com)
2. Sign in with the same Google account
3. Click **"Manage now"**
4. **Add your business**:
   - **Business name**: `Touch N Search`
   - **Category**: Choose appropriate (e.g., "Software Company")
   - **Address**: Your business address
   - **Phone**: `+917007543565`
   - **Website**: `https://touchnsearch.com`

### 2. Verify Your Business
1. **Choose verification method**:
   - **Phone verification** (recommended)
   - **Postcard verification**
2. **Complete verification** process
3. **Add business details**:
   - Hours of operation
   - Business description
   - Photos
   - Services/products

---

## **Part D: Update Your Application**

### 1. Environment Variables
Add these to your `web/.env.production` file:

```bash
# Google My Business Integration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_MY_BUSINESS_API_KEY=your_gmb_api_key_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email_here
```

### 2. Get Your Credentials
From Google Cloud Console, copy these values:

- **Client ID**: From OAuth 2.0 Client
- **Client Secret**: From OAuth 2.0 Client  
- **API Key**: Go to APIs & Services → Credentials → Create Credentials → API Key
- **Service Account Email**: From your service account (looks like: `touchnsearch-gmb-service@touchnsearch-crm.iam.gserviceaccount.com`)

### 3. Test the Integration
1. **Deploy your updated app** to touchnsearch.com
2. **Go to GMB dashboard** in your app
3. **Click "Connect Google Account"**
4. **Authorize the app**
5. **Test creating a post**

---

## **Part E: Mobile App Configuration**

### 1. Update Mobile Config
Edit `mobile/lib/core/config/app_config.dart`:

```dart
class AppConfig {
  // Supabase
  static const String supabaseUrl = 'your_supabase_url';
  static const String supabaseAnonKey = 'your_supabase_anon_key';
  
  // Google My Business
  static const String googleClientId = 'your_google_client_id';
  static const String googleApiKey = 'your_gmb_api_key';
  
  // Site URL
  static const String baseUrl = 'https://touchnsearch.com';
}
```

---

## **✅ Verification Checklist**

- [ ] Google Cloud project created
- [ ] Required APIs enabled
- [ ] Service account created and key downloaded
- [ ] OAuth 2.0 client created
- [ ] OAuth consent screen configured
- [ ] Google My Business profile created and verified
- [ ] Environment variables updated
- [ ] App deployed with new configuration
- [ ] GMB connection tested in app

---

## **🆘 Troubleshooting**

### Common Issues:
1. **"Access blocked"** - Check OAuth consent screen configuration
2. **"Invalid client"** - Verify Client ID and Secret
3. **"Business not found"** - Ensure GMB profile is verified
4. **"API not enabled"** - Check if Google My Business API is enabled

### Next Steps:
Once GMB is working, you can:
- Create posts from your CRM
- Manage multiple business locations
- Sync customer reviews
- Track business insights

---

**🎉 Your Google My Business integration will be ready!**

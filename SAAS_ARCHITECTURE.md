# 🏢 SaaS Architecture - Sell Services to SME Business Owners

## 📋 Business Model

**Your Role**: Service Provider (touchnsearch.com)  
**Customer**: SME Business Owners  
**Model**: All API calls through YOUR account, customers see THEIR data

---

## 🎯 How It Works

### 1. **Centralized API Management**
```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR MASTER ACCOUNT                       │
│                   (touchnsearch.com)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Master API Credentials                               │  │
│  │  - Google My Business API                            │  │
│  │  - Facebook/Instagram API                            │  │
│  │  - WhatsApp Business API                             │  │
│  │  - All other integrations                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  All API calls → Billed to YOUR account                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │         Customer OAuth Connection        │
        │                                          │
        │  Customer authorizes access to:          │
        │  - Their GMB locations                   │
        │  - Their Facebook pages                  │
        │  - Their Instagram accounts              │
        │  - Their business data                   │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │        Customer Dashboard Shows:         │
        │                                          │
        │  ✅ Their business stats                 │
        │  ✅ Their customer reviews               │
        │  ✅ Their post performance               │
        │  ✅ Their analytics                      │
        │                                          │
        │  But API calls happen through YOUR       │
        │  master account credentials              │
        └─────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Step 1: Master Account Setup (Your Side)

#### A. Google Cloud Console
```bash
# Your master Google Cloud project
Project: touchnsearch-master-api
Client ID: YOUR_MASTER_CLIENT_ID
Client Secret: YOUR_MASTER_CLIENT_SECRET
Service Account: touchnsearch-api@touchnsearch-master-api.iam.gserviceaccount.com
```

#### B. Environment Variables (Server-side only)
```bash
# web/.env.production (NEVER expose to client)
GOOGLE_MASTER_CLIENT_ID=your_master_client_id
GOOGLE_MASTER_CLIENT_SECRET=your_master_client_secret
GOOGLE_MASTER_API_KEY=your_master_api_key
GOOGLE_MASTER_SERVICE_ACCOUNT_KEY=your_service_account_json

# Facebook/Instagram Master
FACEBOOK_MASTER_APP_ID=your_facebook_app_id
FACEBOOK_MASTER_APP_SECRET=your_facebook_app_secret

# WhatsApp Master
WHATSAPP_MASTER_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_MASTER_PHONE_NUMBER_ID=your_phone_number_id
```

### Step 2: Customer OAuth Flow

#### A. Customer Connects Their Account
```typescript
// Customer clicks "Connect Google My Business"
// → OAuth flow starts
// → Customer authorizes access to THEIR business
// → You receive access token for THEIR data
// → Store token in YOUR database
// → Make API calls using YOUR master credentials + THEIR access token
```

#### B. Database Schema
```sql
-- Store customer's OAuth tokens
CREATE TABLE gmb_accounts (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  
  -- Customer's business info
  account_name TEXT,
  account_email TEXT,
  account_id TEXT,
  
  -- OAuth tokens (encrypted)
  access_token TEXT, -- Customer's access token
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  
  -- Your master account handles API calls
  -- But uses customer's token for data access
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 💰 Pricing & Billing Model

### Option 1: Subscription-Based
```
┌─────────────────────────────────────────────┐
│  Free Plan                                   │
│  - 1 GMB location                           │
│  - 10 posts/month                           │
│  - Basic analytics                          │
│  - ₹0/month                                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Pro Plan                                    │
│  - 5 GMB locations                          │
│  - 100 posts/month                          │
│  - Advanced analytics                       │
│  - WhatsApp integration                     │
│  - ₹999/month                               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Premium Plan                                │
│  - Unlimited locations                      │
│  - Unlimited posts                          │
│  - All social media platforms               │
│  - Priority support                         │
│  - ₹2,999/month                             │
└─────────────────────────────────────────────┘
```

### Option 2: Usage-Based
```
- ₹10 per GMB post
- ₹5 per social media post
- ₹50 per ad campaign
- ₹100/month base fee
```

---

## 🔐 Security Architecture

### 1. API Key Management
```
┌──────────────────────────────────────────────┐
│  YOUR MASTER KEYS (Server-side only)         │
│  - Stored in environment variables           │
│  - NEVER exposed to client                   │
│  - Used for all API calls                    │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│  CUSTOMER TOKENS (Encrypted in database)     │
│  - OAuth access tokens                       │
│  - Refresh tokens                            │
│  - Used to access customer's data            │
└──────────────────────────────────────────────┘
```

### 2. Data Isolation
```sql
-- Each customer sees only THEIR data
SELECT * FROM gmb_locations 
WHERE organization_id = current_user_org_id;

-- But API calls use YOUR master credentials
-- This way you control billing and usage
```

---

## 📊 Usage Tracking & Billing

### Track API Usage
```sql
CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  
  -- Track what customer used
  api_service TEXT, -- 'gmb', 'facebook', 'whatsapp'
  api_endpoint TEXT,
  api_method TEXT,
  
  -- Track costs
  api_calls_count INTEGER DEFAULT 1,
  estimated_cost DECIMAL(10,2),
  
  -- Billing
  billing_month TEXT, -- '2024-10'
  is_billed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monthly billing query
SELECT 
  organization_id,
  api_service,
  SUM(api_calls_count) as total_calls,
  SUM(estimated_cost) as total_cost
FROM api_usage_logs
WHERE billing_month = '2024-10'
  AND is_billed = false
GROUP BY organization_id, api_service;
```

---

## 🚀 Implementation Steps

### Phase 1: Setup Master Account (Done by You)
1. ✅ Create Google Cloud project
2. ✅ Enable all required APIs
3. ✅ Create master service account
4. ✅ Set up OAuth credentials
5. ✅ Add environment variables to Supabase

### Phase 2: Customer Onboarding
1. ✅ Customer signs up on touchnsearch.com
2. ✅ Customer selects subscription plan
3. ✅ Customer clicks "Connect Google My Business"
4. ✅ OAuth flow → Customer authorizes
5. ✅ Store customer's tokens (encrypted)
6. ✅ Fetch and display customer's data

### Phase 3: API Call Flow
```
Customer Action → Your Web App → Supabase Edge Function
                                        ↓
                              Use YOUR master credentials
                              + Customer's access token
                                        ↓
                              Google/Facebook/WhatsApp API
                                        ↓
                              Return customer's data
                                        ↓
                              Display in customer's dashboard
                                        ↓
                              Log usage for billing
```

---

## 💡 Key Benefits

### For You (Service Provider):
✅ **Centralized billing** - All API costs in one place  
✅ **Usage tracking** - Know exactly what customers use  
✅ **Scalable** - Add customers without new API accounts  
✅ **Control** - You manage all integrations  
✅ **Revenue** - Charge customers subscription fees

### For Customers (SME Owners):
✅ **No technical setup** - Just connect their accounts  
✅ **No API keys needed** - You handle everything  
✅ **See their data** - Their business stats & analytics  
✅ **Easy to use** - Simple dashboard  
✅ **Support** - You provide customer support

---

## 🔄 OAuth Flow Example (GMB)

### Customer Side:
```
1. Customer logs into touchnsearch.com
2. Goes to GMB Management
3. Clicks "Connect Google My Business"
4. Redirected to Google login
5. Authorizes access to their GMB account
6. Redirected back to touchnsearch.com
7. Sees their business locations & stats
```

### Backend Flow:
```typescript
// 1. Customer clicks connect
handleConnectGoogle() {
  // Start OAuth with YOUR master client ID
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
    client_id=${YOUR_MASTER_CLIENT_ID}&
    redirect_uri=${YOUR_CALLBACK_URL}&
    scope=business.manage&
    access_type=offline`
  
  window.location.href = authUrl
}

// 2. Google redirects back with code
handleCallback(code) {
  // Exchange code for tokens using YOUR master credentials
  const tokens = await exchangeCodeForTokens(code)
  
  // Fetch customer's GMB data using their token
  const gmbData = await fetchGMBData(tokens.access_token)
  
  // Store in YOUR database
  await saveCustomerGMBAccount({
    organization_id: customer.org_id,
    access_token: encrypt(tokens.access_token),
    refresh_token: encrypt(tokens.refresh_token),
    gmb_data: gmbData
  })
}

// 3. Customer views their dashboard
async function getCustomerGMBStats(org_id) {
  // Get customer's stored token
  const account = await getGMBAccount(org_id)
  
  // Make API call using YOUR master credentials
  // But with customer's access token
  const stats = await fetch('https://mybusiness.googleapis.com/v4/accounts', {
    headers: {
      'Authorization': `Bearer ${decrypt(account.access_token)}`,
      'X-API-Key': YOUR_MASTER_API_KEY
    }
  })
  
  // Log usage for billing
  await logAPIUsage({
    organization_id: org_id,
    api_service: 'gmb',
    api_calls_count: 1,
    estimated_cost: 0.01
  })
  
  return stats
}
```

---

## 📱 Mobile App Integration

### Customer Mobile App Flow:
```dart
// Customer opens mobile app
// → Logs in with their touchnsearch.com account
// → Sees their GMB dashboard
// → All API calls go through YOUR server
// → Customer sees THEIR data
// → You handle ALL API billing
```

---

## 🎯 Next Steps

### Immediate Actions:
1. ✅ Fix GMB connect button (Done)
2. ⏳ Set up master Google Cloud project
3. ⏳ Add OAuth callback handler
4. ⏳ Test with one customer account
5. ⏳ Add usage tracking
6. ⏳ Set up billing system

### Future Enhancements:
- Add more social media platforms
- Implement AI-powered insights
- Add team collaboration features
- Create mobile apps for iOS/Android
- Add white-label options for resellers

---

**🎉 This architecture lets you sell services to unlimited SME customers while controlling all API costs and billing!**

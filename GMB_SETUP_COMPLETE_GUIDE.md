# 🎯 Complete GMB Setup Guide - Working Solution

## ✅ What We've Done So Far:

1. ✅ Google Cloud Project created: `touchnsearch-master-api`
2. ✅ APIs enabled (GMB, Maps)
3. ✅ OAuth Client ID created
4. ✅ Credentials obtained:
   - Client ID: `614145210861-d87gdj9a628k9ubc8rtgn8dikekn28k5.apps.googleusercontent.com`
   - Client Secret: `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`
   - API Key: `AIzaSyCWtqBu90jMa0b1gqsTIPtoQYzOAlWXJJM`
5. ✅ Supabase secrets added
6. ✅ Edge function deployed
7. ✅ Organization setup fixed in database

## ❌ Current Issue:

**Error**: "Failed to exchange authorization code at Server"

**Reason**: Google OAuth redirect URI mismatch or authorization code already used

---

## 🔧 Complete Fix - Step by Step

### **Step 1: Verify Google Cloud Console Settings**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `touchnsearch-master-api`
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth Client: `touchnsearch-web-client`

#### **Check These Settings:**

**Authorized JavaScript origins:**
```
http://localhost:3000
https://touchnsearch.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/dashboard/gmb/callback
https://touchnsearch.com/dashboard/gmb/callback
```

**IMPORTANT**: Make sure there are NO extra spaces or trailing slashes!

---

### **Step 2: Update Supabase Secrets**

1. Go to Supabase Dashboard
2. **Edge Functions** → **Secrets**
3. Update/Add these secrets:

```bash
GOOGLE_CLIENT_ID=614145210861-d87gdj9a628k9ubc8rtgn8dikekn28k5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_MY_BUSINESS_API_KEY=AIzaSyCWtqBu90jMa0b1gqsTIPtoQYzOAlWXJJM
GOOGLE_REDIRECT_URI=http://localhost:3000/dashboard/gmb/callback
```

---

### **Step 3: Clear Browser Cache & Cookies**

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. **Clear site data** for `localhost:3000`
4. Close and reopen browser

---

### **Step 4: Test OAuth Flow**

1. Go to `http://localhost:3000/dashboard/gmb`
2. Click **"Connect Account"**
3. **Should redirect to Google**
4. **Authorize access**
5. **Should redirect back to callback**

---

## 🆘 If Still Not Working - Alternative Approach

### **Option A: Use Test Mode (Simplest)**

Instead of full OAuth, we can create a simpler test version:

1. **Get a test access token** from Google OAuth Playground
2. **Manually add** to database
3. **Test GMB features**

### **Option B: Simplify OAuth Flow**

Create a simpler OAuth implementation that doesn't use edge functions:

1. **Client-side OAuth** (all in browser)
2. **Store tokens** in Supabase directly
3. **No edge function needed** for initial connection

---

## 📝 Current Status Summary

### ✅ Working:
- Google Cloud project setup
- APIs enabled
- Credentials generated
- Supabase configuration
- Database schema
- Frontend UI

### ❌ Not Working:
- OAuth token exchange (500 error)
- Edge function `gmb_connect` failing

### 🔍 Root Cause:
The authorization code exchange is failing. This could be due to:
1. Redirect URI mismatch
2. Code already used (can only use once)
3. Client secret not matching
4. OAuth consent screen not properly configured

---

## 🎯 Recommended Next Steps

### **Immediate Fix (Choose One):**

#### **Option 1: Debug Edge Function**
Add more detailed logging to see exact error:
```typescript
console.log('Authorization code:', authorization_code)
console.log('Client ID:', Deno.env.get('GOOGLE_CLIENT_ID'))
console.log('Redirect URI:', Deno.env.get('GOOGLE_REDIRECT_URI'))
```

#### **Option 2: Test with cURL**
Test token exchange manually:
```bash
curl -X POST https://oauth2.googleapis.com/token \
  -d "code=YOUR_AUTH_CODE" \
  -d "client_id=614145210861-d87gdj9a628k9ubc8rtgn8dikekn28k5.apps.googleusercontent.com" \
  -d "client_secret=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" \
  -d "redirect_uri=http://localhost:3000/dashboard/gmb/callback" \
  -d "grant_type=authorization_code"
```

#### **Option 3: Simplify for Testing**
Skip OAuth for now and manually add test data:
```sql
-- Add test GMB account
INSERT INTO gmb_accounts (organization_id, account_name, account_id, is_active)
VALUES ('your-org-id', 'Test GMB Account', 'test-123', true);

-- Add test location
INSERT INTO gmb_locations (gmb_account_id, organization_id, location_name, address)
VALUES ('gmb-account-id', 'your-org-id', 'Test Location', '123 Test St');
```

---

## 📞 Support Resources

- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **GMB API Docs**: https://developers.google.com/my-business

---

## 🎉 What to Do Next

**I recommend Option 3 (Simplify for Testing)** to get the app working first, then fix OAuth later.

Would you like me to:
1. Add more detailed logging to debug the exact error?
2. Create a simplified test version without OAuth?
3. Help you test the token exchange manually?

Let me know which approach you prefer!

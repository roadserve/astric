# 🔧 Fix OAuth Scopes - Step by Step

## Problem:
```
"Request had insufficient authentication scopes"
"ACCESS_TOKEN_SCOPE_INSUFFICIENT"
```

## Root Cause:
OAuth consent screen me proper scopes add nahi hain ya access token me scopes missing hain.

---

## ✅ Solution:

### **Step 1: Update OAuth Consent Screen**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your **NEW project** (with new credentials)
3. Go to **APIs & Services** → **OAuth consent screen**

### **Step 2: Edit Scopes**

1. Click **"EDIT APP"** button
2. Go to **"Scopes"** step
3. Click **"ADD OR REMOVE SCOPES"**

### **Step 3: Add Required Scopes**

**Search and add these scopes:**

#### **Scope 1: Business Management**
```
https://www.googleapis.com/auth/business.manage
```
**Description:** "See, edit, configure, and delete your Google Cloud data and see the email address for your Google Account."

#### **Scope 2: User Email**
```
https://www.googleapis.com/auth/userinfo.email
```
**Description:** "See your primary Google Account email address"

#### **Scope 3: User Profile**  
```
https://www.googleapis.com/auth/userinfo.profile
```
**Description:** "See your personal info, including any personal info you've made publicly available"

### **Step 4: Save Changes**

1. Click **"UPDATE"** button
2. Click **"SAVE AND CONTINUE"**
3. Complete the remaining steps
4. Click **"BACK TO DASHBOARD"**

---

## 🔍 Alternative: Check if Scopes are in OAuth URL

The OAuth URL should include:
```
scope=https://www.googleapis.com/auth/business.manage%20https://www.googleapis.com/auth/userinfo.email%20https://www.googleapis.com/auth/userinfo.profile
```

---

## 🆘 If Still Not Working:

### **Option A: Force Re-authorization**

1. Clear browser cache completely
2. Go to: https://myaccount.google.com/permissions
3. Remove **"AI SME Copilot"** app access
4. Try connecting again (will ask for permissions again)

### **Option B: Check Test Users**

1. In **OAuth consent screen**
2. Go to **"Test users"** section
3. Make sure your email is added as test user

---

## 📋 Complete Checklist:

- [ ] OAuth consent screen configured
- [ ] All 3 scopes added:
  - [ ] `business.manage`
  - [ ] `userinfo.email`
  - [ ] `userinfo.profile`
- [ ] Test user added (your email)
- [ ] App saved and published (or in testing mode)
- [ ] Browser cache cleared
- [ ] Previous app permissions revoked
- [ ] Ready to test again

---

## 🎯 Expected OAuth URL Format:

When you click "Connect Account", the URL should look like:

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=691497466571-ubn88sgthaj789qqlfs84uvk1otg6b0c.apps.googleusercontent.com&
  redirect_uri=http://localhost:3000/dashboard/gmb/callback&
  response_type=code&
  scope=https://www.googleapis.com/auth/business.manage%20https://www.googleapis.com/auth/userinfo.email%20https://www.googleapis.com/auth/userinfo.profile&
  access_type=offline&
  prompt=consent&
  state=your-org-id
```

**Key part:** `scope=` should have all 3 scopes!

---

## 🚀 After Fixing:

1. Clear browser cache
2. Go to GMB dashboard
3. Click "Connect Account"
4. Should see permission screen asking for:
   - ✅ Access to your Google Business Profile
   - ✅ See your email
   - ✅ See your basic profile info
5. Click "Allow"
6. Should work! ✅

---

**Fix OAuth consent screen first, then test again!**


# 📱 Facebook App Complete Setup Guide

## ✅ Current App Details
- **App ID:** 1473869790526446
- **App Secret:** ac194bcb6ecd3d38e8254eb7bac0d808
- **Display Name:** AI SME Copilot
- **Contact Email:** amangu89@gmail.com

---

## 📋 Required Information to Fill

### 1. **App Domains** (Optional but Recommended)
```
touchnsearch.com
localhost
```

### 2. **Privacy Policy URL**
```
https://touchnsearch.com/privacy-policy
```
*Note: You'll need to create a privacy policy page on your website*

### 3. **Terms of Service URL**
```
https://touchnsearch.com/terms-of-service
```
*Note: You'll need to create a terms of service page on your website*

### 4. **User Data Deletion Instructions URL**
```
https://touchnsearch.com/data-deletion
```
*Note: You'll need to create a data deletion instructions page*

### 5. **Category**
Select: **Business and Pages** or **Business Tools**

### 6. **App Icon** (1024 x 1024)
- Upload a square logo/icon for your app
- Should represent "AI SME Copilot"
- PNG format recommended

---

## 🔧 What to Do Now

### Step 1: Fill Basic Information
1. **App Domains:** Leave blank for now (optional)
2. **Privacy Policy URL:** `https://touchnsearch.com/privacy-policy`
3. **Terms of Service URL:** `https://touchnsearch.com/terms-of-service`
4. **User Data Deletion:** `https://touchnsearch.com/data-deletion`
5. **Category:** Select **"Business and Pages"**
6. **App Icon:** Upload any square logo (we can update later)

### Step 2: Save Settings
Click **"Save Changes"** at the bottom

### Step 3: Create Required Pages (Later)
You'll need to create these pages on your website:
- `/privacy-policy` - Privacy policy for your app
- `/terms-of-service` - Terms of service
- `/data-deletion` - Instructions for users to delete their data

---

## 📝 Simple Privacy Policy Template

Create `web/app/privacy-policy/page.tsx`:

```typescript
export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Data Collection</h2>
        <p>AI SME Copilot collects the following data:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Facebook/Instagram account information (name, profile picture)</li>
          <li>Business page information</li>
          <li>Post analytics and engagement data</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Data Usage</h2>
        <p>We use your data to:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Display your social media analytics</li>
          <li>Manage your social media posts</li>
          <li>Provide business insights</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Data Deletion</h2>
        <p>You can request data deletion at any time by visiting our <a href="/data-deletion" className="text-blue-600 underline">data deletion page</a>.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Contact</h2>
        <p>For questions, contact: amangu89@gmail.com</p>
      </section>
    </div>
  )
}
```

---

## 📝 Simple Terms of Service Template

Create `web/app/terms-of-service/page.tsx`:

```typescript
export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Service Description</h2>
        <p>AI SME Copilot provides social media management and analytics tools for small and medium businesses.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">User Responsibilities</h2>
        <ul className="list-disc ml-6 mt-2">
          <li>Provide accurate information</li>
          <li>Maintain account security</li>
          <li>Comply with platform policies</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Contact</h2>
        <p>For questions, contact: amangu89@gmail.com</p>
      </section>
    </div>
  )
}
```

---

## 📝 Data Deletion Instructions

Create `web/app/data-deletion/page.tsx`:

```typescript
export default function DataDeletion() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Data Deletion Instructions</h1>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">How to Delete Your Data</h2>
        <ol className="list-decimal ml-6 mt-2 space-y-2">
          <li>Log in to your AI SME Copilot account</li>
          <li>Go to Settings → Account</li>
          <li>Click "Delete Account"</li>
          <li>Confirm deletion</li>
        </ol>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Alternative Method</h2>
        <p>Email us at <strong>amangu89@gmail.com</strong> with:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Your account email</li>
          <li>Subject: "Data Deletion Request"</li>
          <li>We'll process within 30 days</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">What Gets Deleted</h2>
        <ul className="list-disc ml-6 mt-2">
          <li>Your profile information</li>
          <li>Connected social media accounts</li>
          <li>All analytics data</li>
          <li>Post history</li>
        </ul>
      </section>
    </div>
  )
}
```

---

## ⚡ Quick Action Plan

### For Now (To Continue Testing):
1. **Privacy Policy URL:** Enter `https://touchnsearch.com/privacy-policy`
2. **Terms of Service URL:** Enter `https://touchnsearch.com/terms-of-service`
3. **Data Deletion URL:** Enter `https://touchnsearch.com/data-deletion`
4. **Category:** Select "Business and Pages"
5. **App Icon:** Upload any square logo (can update later)
6. **Click "Save Changes"**

### Later (Before Going Live):
1. Create the actual policy pages on your website
2. Update app icon with professional logo
3. Complete Business Verification (when ready to go live)

---

## 🎯 Current Status

✅ App Created  
✅ Instagram Product Added  
✅ Redirect URIs Configured  
⏳ Basic Information (In Progress)  
⏳ Policy Pages (To be created)  
⏳ Business Verification (For later)  

---

**Fill karo aur "Save Changes" click karo! Testing continue kar sakte ho!** 🚀

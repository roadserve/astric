# 📍 WhatsApp Configuration - Exact Location Guide

## ❌ **Current Issue:**

**Webhooks page par "User" product dikh raha hai, lekin WhatsApp Business Account configuration yahan nahi hai.**

**Reason:** WhatsApp Business Account webhook configuration **alag page** par hota hai!

---

## ✅ **Correct Location - Step by Step:**

### **Step 1: Go to WhatsApp Configuration Page**

**Current Page:** `developers.facebook.com/apps/1998938357620161/webhooks/` ❌

**Required Page:** WhatsApp Configuration ✅

**How to reach:**

1. **Left Sidebar** mein scroll karein
2. **"Products"** section mein **"WhatsApp"** dhoondhein
3. **Click:** "WhatsApp" (expand hoga)
4. **Click:** "Configuration" (under WhatsApp)

**OR**

**Direct URL:**
```
https://developers.facebook.com/apps/1998938357620161/whatsapp-business/wa-configurations/
```

---

### **Step 2: Find Webhook Configuration Section**

**WhatsApp Configuration page par:**

1. **Scroll down** karein
2. **"Subscribe to webhooks"** section dhoondhein
3. **Ye section mein hoga:**
   - Callback URL field
   - Verify token field
   - "Verify and save" button
   - Webhook fields table

---

### **Step 3: Configure Webhook**

**"Subscribe to webhooks" section mein:**

1. **Callback URL:**
   ```
   https://nazedodnkzkuxvsuedmb.supabase.co/functions/v1/webhook_inbound
   ```

2. **Verify Token:**
   - Database se `webhook_verify_token` copy karein
   - Ya Settings page se copy karein
   - Example: `token_1764965334603`

3. **Click:** "Verify and save"

---

### **Step 4: Subscribe to Messages Field**

**After verification, scroll down to "Webhook fields" table:**

**MUST Subscribe to:**
- ✅ **`messages`** - For incoming messages AND status updates (MUST!)
- ✅ Other fields optional

**How to subscribe:**
1. Find `messages` row in table
2. Toggle switch ko **ON** karein (blue = subscribed)
3. Save

---

## 🔍 **Why Two Different Pages?**

### **1. Webhooks Page (Current):**
- **URL:** `/webhooks/`
- **Purpose:** General webhooks (User, Page, etc.)
- **Product:** "User" selected by default
- **Use:** Facebook user events ke liye

### **2. WhatsApp Configuration Page (Required):**
- **URL:** `/whatsapp-business/wa-configurations/`
- **Purpose:** WhatsApp Business Account webhooks
- **Product:** "Whatsapp Business Account" (automatic)
- **Use:** WhatsApp messages ke liye

---

## 📋 **Complete Navigation Path:**

```
Meta Dashboard
  └── Left Sidebar
      └── Products
          └── WhatsApp (click to expand)
              └── Configuration (click here) ✅
                  └── Scroll down
                      └── "Subscribe to webhooks" section ✅
```

---

## 🎯 **Quick Action:**

1. **Left Sidebar** → **WhatsApp** → **Configuration** ✅
2. **Scroll down** → **"Subscribe to webhooks"** section ✅
3. **Enter:** Callback URL + Verify Token ✅
4. **Click:** "Verify and save" ✅
5. **Subscribe:** To `messages` field ✅

---

## ⚠️ **Important Notes:**

1. **Don't use Webhooks page** (`/webhooks/`) - Ye Facebook events ke liye hai
2. **Use WhatsApp Configuration page** (`/whatsapp-business/wa-configurations/`) - Ye WhatsApp ke liye hai
3. **Product selection:** WhatsApp Configuration page par automatically "Whatsapp Business Account" select hota hai
4. **Same URL:** Dono pages par same webhook URL use karein

---

## 🐛 **If Still Not Found:**

### **Check 1: WhatsApp Product Added?**

**Meta Dashboard → Products → Add Product**

**Check:**
- ✅ WhatsApp product added hai ya nahi
- ✅ If not, click "Add Product" → Select "WhatsApp"

### **Check 2: App Mode**

**Top Bar → App Mode Toggle**

**Check:**
- ✅ App Mode: "Development" ya "Live" (dono mein configuration dikhega)
- ✅ Toggle position check karein

### **Check 3: Permissions**

**Meta Dashboard → App Settings → Basic**

**Check:**
- ✅ WhatsApp product permissions granted hain ya nahi

---

## 📚 **Reference:**

**Meta Documentation:**
- [WhatsApp Configuration](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started#configure-webhooks)

**Key Point:**
- WhatsApp webhooks **WhatsApp Configuration page** par configure hote hain
- **NOT** general Webhooks page par

---

**Last Updated:** Exact location guide for WhatsApp webhook configuration


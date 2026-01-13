# Enable Email Verification in Supabase

## 📧 **Steps to Enable Email Confirmation:**

### 1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Authentication** → **Settings**

### 2. **Enable Email Confirmation**
   - Scroll down to **Email Auth**
   - Find **"Enable email confirmations"**
   - ✅ **Check the box** to enable it
   - Click **Save**

### 3. **Configure Email Templates (Optional)**
   - Go to **Authentication** → **Email Templates**
   - Customize the **"Confirm signup"** template if needed
   - Default template works fine for testing

### 4. **Configure Site URL**
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to: `http://localhost:3000` (for development)
   - Set **Redirect URLs** to include: `http://localhost:3000/login`
   - For production, use your actual domain

---

## 🎯 **What Happens Now:**

### **On Signup:**
1. User fills registration form
2. Account created but **NOT active** yet
3. Verification email sent to user's inbox
4. Success message shown: "Check your email to verify"

### **On Login (Before Verification):**
1. User tries to login
2. System checks `email_confirmed_at`
3. If `null` → Shows error: "Please verify your email first"
4. User is signed out automatically

### **After Email Verification:**
1. User clicks link in email
2. Email confirmed (`email_confirmed_at` set)
3. User can now login successfully
4. Redirected to appropriate dashboard (Level 1 or 2)

---

## 🧪 **Testing:**

1. **Create a new user** via `/register`
2. Check email inbox for verification link
3. Click the verification link
4. Login at `/login` - should work now!

---

## ⚠️ **For Existing Users (Already Created):**

If you want to manually verify existing test users:

```sql
-- Manually verify a user's email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'test@example.com';
```

---

## 🔒 **Security Benefits:**

✅ Prevents fake email signups  
✅ Ensures users own the email address  
✅ Reduces spam accounts  
✅ Better user authentication  

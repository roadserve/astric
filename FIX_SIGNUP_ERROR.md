# 🔧 Fix Signup Error

## Problem
The signup is failing with a 500 error because the database trigger can't create user profiles properly.

## ✅ Solution

### Option 1: Run SQL in Supabase Dashboard (Easiest)

1. **Go to your Supabase project**:
   https://nazedodnkzkuxvsuedmb.supabase.co

2. **Click "SQL Editor"** in the left sidebar

3. **Copy and paste this SQL** and click "Run":

```sql
-- Fix the auth trigger to handle user creation properly

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Allow the trigger function to insert profiles
CREATE POLICY "Service role can insert profiles" ON profiles
    FOR INSERT WITH CHECK (true);
```

4. **Click "Run"**

5. **Try signing up again** on the web dashboard!

---

### Option 2: Alternative - Disable Email Confirmation

If the above doesn't work, you can disable email confirmation:

1. Go to: https://nazedodnkzkuxvsuedmb.supabase.co
2. Click **"Authentication"** → **"Settings"**
3. Scroll to **"Email Auth"**
4. **Disable** "Enable email confirmations"
5. Click **"Save"**

Then try signing up again!

---

## 🎯 After Fixing:

1. **Refresh the web page**: http://localhost:3000
2. **Click "Sign Up"**
3. **Fill in your details**
4. **Create your account** - should work now!

---

## ✅ What's Working:

- ✅ Mobile app running on emulator
- ✅ Web dashboard running on localhost:3000
- ✅ Database configured
- ✅ Sample data loaded
- ⏳ Signup (needs the fix above)

---

## 📱 Mobile App Status:

The mobile app is running! Just press **`r`** in the terminal to hot reload and remove the Firebase error.

---

**Run the SQL fix above and you'll be able to create accounts!** 🚀

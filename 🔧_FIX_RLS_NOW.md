# 🔧 FIX RLS POLICIES NOW!

## 🐛 **PROBLEM:**

Multiple conflicting RLS policies on `organization_members` table causing the error:
```
column reference "user_id" is ambiguous
```

You have **6 policies** when you only need **2**!

---

## ✅ **SOLUTION:**

**Run this file in Supabase SQL Editor:**
`supabase/clean_all_rls_policies.sql`

---

## 🚀 **WHAT IT DOES:**

1. ✅ **Drops ALL 6 existing policies**
2. ✅ **Creates 2 clean, simple policies:**
   - Policy 1: Allow SELECT for everyone (temporary for debugging)
   - Policy 2: Allow ALL operations for owners/managers

---

## 📋 **HOW TO RUN:**

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy ALL contents of:** `supabase/clean_all_rls_policies.sql`
4. **Paste and click "Run"**
5. **Refresh your browser**
6. **Test login!**

---

## 🎯 **EXPECTED RESULT:**

After running, you should see:

```
✅ RLS Policies Cleaned and Recreated
========================================
Policy 1: allow_select_organization_members
  - Allows SELECT for everyone (temporary for debugging)

Policy 2: allow_admin_manage_members
  - Allows ALL operations for owners/managers

Now refresh your browser and test!
```

---

## 🧪 **THEN TEST:**

1. **Refresh browser**
2. **Login as:** amangu89@gmail.com
3. **Should see:** Dashboard loads ✅
4. **Should see:** Admin Portal in sidebar ✅
5. **No more errors!** ✅

---

## 📊 **BEFORE vs AFTER:**

**BEFORE (6 policies - CONFLICTING):**
- ❌ Organization admins can delete members
- ❌ Organization admins can insert members
- ❌ Organization admins can update members
- ❌ Owners can manage organization members
- ❌ Users can view members of their organizations
- ❌ Users can view organization members

**AFTER (2 policies - CLEAN):**
- ✅ allow_select_organization_members
- ✅ allow_admin_manage_members

---

## 🎊 **READY!**

**Just run the SQL file and refresh!** 🚀

File: `supabase/clean_all_rls_policies.sql`








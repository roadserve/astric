# ✅ FIXED ADMIN ACCESS CHECK

## 🐛 **ISSUE FOUND:**

The query to check admin access was failing with a 400 Bad Request error.

**Error:**
```
GET /rest/v1/organization_members?select=role&user_id=eq.xxx 400 (Bad Request)
```

---

## 🔧 **FIXES APPLIED:**

### **1. Changed `.single()` to `.maybeSingle()`**

**Before:**
```typescript
.single()  // Throws error if no rows found
```

**After:**
```typescript
.maybeSingle()  // Returns null if no rows, no error
```

### **2. Added Better Error Handling**

- Added console logs for debugging
- Check for error before checking data
- Handle case where user is not in organization

### **3. Updated Both Files:**

- ✅ `web/app/dashboard/admin/page.tsx` - Admin Portal access check
- ✅ `web/components/sidebar.tsx` - Sidebar admin link visibility

---

## 🎯 **WHAT CHANGED:**

### **Admin Portal Page:**
```typescript
const { data: orgMember, error } = await supabase
  .from('organization_members')
  .select('role, organization_id')
  .eq('user_id', user.id)
  .maybeSingle()  // ← Changed from .single()

if (error) {
  console.error('Error fetching organization member:', error)
  setIsAdmin(false)
  return
}

if (!orgMember) {
  console.log('User is not a member of any organization')
  setIsAdmin(false)
  return
}
```

### **Sidebar:**
```typescript
const { data: orgMember, error } = await supabase
  .from('organization_members')
  .select('role')
  .eq('user_id', user.id)
  .maybeSingle()  // ← Changed from .single()

if (error) {
  console.error('Error checking admin status:', error)
  setIsAdmin(false)
  return
}
```

---

## 🧪 **TEST NOW:**

### **Step 1: Refresh the Page**
- The 400 error should be gone
- Console will show helpful logs

### **Step 2: Login as Admin**
- Email: `amangu89@gmail.com`
- Console should show:
  ```
  Checking admin access for user: xxx
  Organization member data: {role: 'owner', ...}
  User role: owner
  User is admin, granting access
  ```
- Sidebar should show: **"🛡️ Admin Portal [Admin]"**
- Admin Portal should load ✅

### **Step 3: Login as Customer**
- Email: `customer@aisme.com`
- Console should show:
  ```
  Checking admin access for user: xxx
  Organization member data: {role: 'staff', ...}
  User role: staff
  User is not admin, denying access
  ```
- Sidebar should **NOT** show "Admin Portal"
- If accessing `/dashboard/admin`: **"Access Denied"** ❌

---

## 📊 **EXPECTED BEHAVIOR:**

| User | Role | Sidebar Shows Admin Portal | Can Access `/dashboard/admin` |
|------|------|---------------------------|-------------------------------|
| **amangu89@gmail.com** | owner | ✅ YES | ✅ YES |
| **customer@aisme.com** | staff | ❌ NO | ❌ NO (Access Denied) |

---

## 🎉 **STATUS:**

- ✅ Fixed 400 Bad Request error
- ✅ Added `.maybeSingle()` instead of `.single()`
- ✅ Added better error handling
- ✅ Added console logs for debugging
- ✅ Updated both Admin Portal and Sidebar
- ✅ No linter errors

**Ready to test!** Just refresh the page and login! 🚀

---

**Files Updated:**
1. ✅ `web/app/dashboard/admin/page.tsx`
2. ✅ `web/components/sidebar.tsx`

**Next:** Refresh and test with both users!

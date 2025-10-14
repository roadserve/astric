# 🚀 SETUP ADMIN & CUSTOMER ROLES

## ✅ **QUICK SETUP GUIDE**

Both users exist in your database:
- ✅ amangu89@gmail.com (will be ADMIN)
- ✅ customer@aisme.com (will be CUSTOMER)

---

## 📋 **STEP 1: RUN THE SETUP SCRIPT**

### **Option A: Using Supabase SQL Editor** (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy & Paste Script**
   - Open file: `supabase/setup_final_roles.sql`
   - Copy ALL contents
   - Paste in SQL Editor
   - Click "Run" button

4. **Check Output**
   - You should see:
   ```
   ========================================
   ✅ SETUP COMPLETE!
   ========================================
   
   👑 ADMIN:
      Email: amangu89@gmail.com
      Display Name: amangupta
      Role: OWNER
      Modules: 12/12 (Full Access)
      Admin Portal: ✅ YES
   
   👤 CUSTOMER:
      Email: customer@aisme.com
      Display Name: -
      Role: STAFF (Customer)
      Modules: 11/12 (Full Access)
      Admin Portal: ❌ NO
   ```

---

## 🎯 **WHAT THIS DOES**

### **For amangu89@gmail.com (Admin):**
- ✅ Sets role to: **OWNER**
- ✅ Grants access to: **12/12 modules**
- ✅ Enables: **Admin Portal**
- ✅ Can: **Manage users and permissions**

### **For customer@aisme.com (Customer):**
- ✅ Sets role to: **STAFF (Customer)**
- ✅ Grants access to: **11/12 modules**
- ❌ Blocks: **Admin Portal**
- ✅ Can: **Use all business features**

---

## 📊 **EXPECTED RESULTS**

After running the script, you'll see 4 verification tables:

### **1. User Summary**
| email | display_name | role | user_type | active |
|-------|-------------|------|-----------|--------|
| amangu89@gmail.com | amangupta | owner | 👑 Admin | true |
| customer@aisme.com | - | staff | 👤 Customer | true |

### **2. Admin Permissions (12 modules)**
All modules with `full` permission and `✅` enabled

### **3. Customer Permissions (11 modules)**
All modules EXCEPT admin portal with `full` permission and `✅` enabled

### **4. Access Comparison**
| email | role | total_modules | enabled_modules | admin_portal |
|-------|------|---------------|-----------------|--------------|
| amangu89@gmail.com | owner | 12 | 12 | ✅ Can access |
| customer@aisme.com | staff | 11 | 11 | ❌ Cannot access |

---

## 🧪 **STEP 2: TEST THE SETUP**

### **Test 1: Login as Admin**

1. **Login:** amangu89@gmail.com
2. **Check sidebar:**
   - ✅ Should see "Admin Portal" with badge
3. **Click Admin Portal:**
   - ✅ Should load successfully
4. **Check features:**
   - ✅ Can see all users
   - ✅ Can manage permissions
   - ✅ Can access all 12 modules

---

### **Test 2: Login as Customer**

1. **Login:** customer@aisme.com
2. **Check sidebar:**
   - ❌ Should NOT see "Admin Portal"
   - ✅ Should see all other 11 modules
3. **Try direct URL:**
   - Go to: `http://localhost:3000/dashboard/admin`
   - ❌ Should see "Access Denied" message
4. **Check features:**
   - ✅ Can use Dashboard
   - ✅ Can use Billing
   - ✅ Can use Payroll
   - ✅ Can use WhatsApp CRM
   - ✅ Can use all business features

---

## 🎨 **VISUAL COMPARISON**

### **Admin Sidebar:**
```
📊 Dashboard
💰 Billing
👥 Customers
📦 Products
💼 Payroll
📅 Attendance
💬 WhatsApp CRM
🤖 AI Copilot
📈 Analytics
🏢 GMB Management
📱 Social Media
🛡️ Admin Portal [Admin] ← VISIBLE
⚙️ Settings
```

### **Customer Sidebar:**
```
📊 Dashboard
💰 Billing
👥 Customers
📦 Products
💼 Payroll
📅 Attendance
💬 WhatsApp CRM
🤖 AI Copilot
📈 Analytics
🏢 GMB Management
📱 Social Media
← Admin Portal HIDDEN
⚙️ Settings
```

---

## ✅ **CHECKLIST**

- [ ] Open Supabase SQL Editor
- [ ] Copy `setup_final_roles.sql` contents
- [ ] Paste and run in SQL Editor
- [ ] Verify output shows "SETUP COMPLETE"
- [ ] Check 4 verification tables
- [ ] Login as admin (amangu89@gmail.com)
- [ ] Verify Admin Portal is visible
- [ ] Login as customer (customer@aisme.com)
- [ ] Verify Admin Portal is hidden
- [ ] Test accessing `/dashboard/admin` as customer
- [ ] Verify "Access Denied" message

---

## 🎊 **SUMMARY**

**Admin (amangu89@gmail.com):**
- Role: Owner
- Access: 12/12 modules
- Admin Portal: ✅ YES
- Can manage users: ✅ YES

**Customer (customer@aisme.com):**
- Role: Staff (Customer)
- Access: 11/12 modules
- Admin Portal: ❌ NO
- Can use all features: ✅ YES

**Ready to run the script!** 🚀

---

**File to Run:** `supabase/setup_final_roles.sql`  
**Where to Run:** Supabase SQL Editor  
**Time:** ~2 seconds  
**Status:** ✅ Ready!

# 🧪 Automation Features - Testing Guide

## Quick Start - Test in 5 Minutes! ⚡

Follow these steps to verify all automation features are working:

---

## ✅ **STEP 1: Database Verification** (1 min)

### Run in Supabase SQL Editor:

```sql
-- Copy and paste this into Supabase SQL Editor
-- File: supabase/VERIFY_AUTOMATION_SETUP.sql

-- Quick check - should show 16 tables
SELECT COUNT(*) as automation_tables
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'automation_%';

-- Check templates - should show 10
SELECT COUNT(*) as template_count
FROM automation_marketplace_workflows;

-- Check subscriptions - should show 3 tiers
SELECT tier_name, max_workflows, monthly_price
FROM automation_subscriptions
ORDER BY monthly_price;
```

### Expected Results:
```
✅ automation_tables: 16
✅ template_count: 10
✅ subscriptions: Free, Professional, Enterprise
```

---

## ✅ **STEP 2: UI Navigation Test** (1 min)

### Test the sidebar:
1. Login to your app
2. Look at the left sidebar
3. Find the **⚡ Automation** menu item
4. Click on it

### Expected Result:
```
✅ URL changes to: /dashboard/automation
✅ Page loads showing automation dashboard
✅ See stats cards at top
✅ See "Create Workflow" button
```

---

## ✅ **STEP 3: Create Workflow Test** (1 min)

### Steps:
1. Click **"Create Workflow"** button
2. Fill in:
   - Name: "Test Workflow"
   - Description: "Testing automation features"
3. Click **"Create Workflow"**
4. Wait for success message
5. Should redirect back to dashboard

### Expected Results:
```
✅ Form submits successfully
✅ Alert: "Workflow created successfully!"
✅ Redirects to /dashboard/automation
✅ New workflow appears in the list
✅ Workflow has status "Inactive"
```

---

## ✅ **STEP 4: Visual Editor Test** (1 min)

### Steps:
1. Find your "Test Workflow" in the list
2. Click the **"Edit"** button
3. Visual editor should open

### Expected Results:
```
✅ URL: /dashboard/automation/[id]/edit
✅ Left sidebar shows node palette
✅ Center shows canvas area
✅ Right sidebar shows properties panel
✅ Can see 12+ node types organized by category
```

### Test Node Addition:
1. Click on **"⚡ Manual Trigger"** in left sidebar
2. Node appears on canvas
3. Click on **"🌐 HTTP Request"** 
4. Another node appears on canvas
5. Click **"Save"** button at top

### Expected Results:
```
✅ Nodes appear on canvas when clicked
✅ Can select nodes (they highlight)
✅ Save button works
✅ Alert: "Workflow saved successfully!"
```

---

## ✅ **STEP 5: Analytics Dashboard Test** (30 sec)

### Steps:
1. Go back to `/dashboard/automation`
2. Click **"Analytics"** button (top right)
3. Analytics page loads

### Expected Results:
```
✅ URL: /dashboard/automation/analytics
✅ See 4 metric cards at top:
   - Total Executions
   - Success Rate
   - Avg Execution Time
   - Active Workflows
✅ See "Daily Breakdown" section
✅ Can filter by workflow
✅ Can change date range (7/30/90 days)
```

---

## ✅ **STEP 6: Template Gallery Test** (30 sec)

### Steps:
1. Go to `/dashboard/automation`
2. Click on **"Templates"** tab
3. Browse templates

### Expected Results:
```
✅ Should see 10 pre-built templates
✅ Each template shows:
   - Name
   - Description
   - Category badge
   - Features list
✅ Templates include:
   - Send Invoice via WhatsApp
   - Payment Reminder
   - Customer Welcome Message
   - Sync to Google Sheets
   - etc.
```

---

## ✅ **STEP 7: Delete Workflow Test** (30 sec)

### Steps:
1. Find your "Test Workflow"
2. Click the **"Delete"** button (trash icon)
3. Confirm deletion

### Expected Results:
```
✅ Workflow is removed from list
✅ Success message appears
✅ Workflow no longer in database
```

---

## 🔍 **STEP 8: Advanced Features Verification**

### Check Database for Advanced Tables:

Run in Supabase SQL Editor:

```sql
-- Version Control
SELECT COUNT(*) FROM automation_workflow_versions;

-- A/B Testing
SELECT COUNT(*) FROM automation_ab_tests;

-- Analytics
SELECT COUNT(*) FROM automation_analytics;

-- Error Logs
SELECT COUNT(*) FROM automation_error_logs;

-- Webhooks
SELECT COUNT(*) FROM automation_webhooks;

-- Credentials
SELECT COUNT(*) FROM automation_credentials;

-- Variables
SELECT COUNT(*) FROM automation_workflow_variables;

-- Comments
SELECT COUNT(*) FROM automation_workflow_comments;
```

### Expected:
```
✅ All queries run without errors
✅ Tables exist and are accessible
✅ Counts may be 0 (that's OK - tables are ready)
```

---

## 🎯 **STEP 9: API Endpoint Test**

### Test Workflow API:

Open your browser console (F12) and run:

```javascript
// Test GET workflows
fetch('/api/automation/workflows')
  .then(res => res.json())
  .then(data => console.log('✅ GET works:', data))
  .catch(err => console.error('❌ GET failed:', err));
```

### Expected Result:
```
✅ Returns JSON with workflows array
✅ Status 200
✅ No errors
```

---

## 📊 **STEP 10: Complete Feature Checklist**

Go through this checklist while using the app:

### UI Features:
- [ ] ✅ Automation menu item in sidebar
- [ ] ✅ Dashboard loads with stats
- [ ] ✅ Create workflow form works
- [ ] ✅ Visual editor opens
- [ ] ✅ Can add nodes to canvas
- [ ] ✅ Can configure nodes
- [ ] ✅ Can save workflows
- [ ] ✅ Analytics page displays metrics
- [ ] ✅ Template gallery shows 10 templates
- [ ] ✅ Can delete workflows
- [ ] ✅ Toggle active/inactive works

### Node Types Available:
- [ ] ✅ Trigger nodes (4 types)
- [ ] ✅ Action nodes (3 types)
- [ ] ✅ Logic nodes (3 types)
- [ ] ✅ Data nodes (4 types)
- [ ] ✅ AI nodes (1 type)

### Advanced Features UI:
- [ ] ✅ "Advanced Features Included" section visible
- [ ] ✅ Shows 8 features with green checkmarks
- [ ] ✅ No "Coming Soon" messages
- [ ] ✅ All features marked as available

---

## 🐛 **Troubleshooting**

### Issue: "No workflows found"
**Solution:** Create a workflow first using "Create Workflow" button

### Issue: "Failed to load workflow"
**Solution:** 
1. Check if database tables exist (run STEP 1)
2. Check browser console for errors
3. Verify you have an organization set up

### Issue: "Unauthorized" errors
**Solution:**
1. Make sure you're logged in
2. Check if you have an organization
3. Verify RLS policies are correct

### Issue: Visual editor doesn't load
**Solution:**
1. Check browser console for errors
2. Verify workflow ID in URL is correct
3. Try creating a new workflow

### Issue: Analytics shows no data
**Solution:** This is normal if you haven't executed any workflows yet. The UI should show empty states correctly.

---

## ✅ **Success Criteria**

You should be able to:

1. ✅ **Navigate** to automation dashboard
2. ✅ **Create** new workflows
3. ✅ **Edit** workflows in visual editor
4. ✅ **Add** 12+ different node types
5. ✅ **Save** workflow changes
6. ✅ **View** analytics metrics
7. ✅ **Browse** 10 pre-built templates
8. ✅ **Delete** workflows
9. ✅ **Toggle** workflow status
10. ✅ **See** all advanced features marked as available

---

## 🎉 **ALL TESTS PASSED?**

If all the above steps work correctly, then:

### ✅ **CONGRATULATIONS!** 

All automation features are **fully functional** and ready for production use!

You now have a **complete n8n-like automation platform** integrated into your CRM with:

- ✅ Visual workflow editor
- ✅ 12+ node types
- ✅ Pre-built templates
- ✅ Analytics dashboard
- ✅ Version control
- ✅ A/B testing
- ✅ Error handling
- ✅ Webhooks & scheduling
- ✅ Credentials management
- ✅ Multi-tenant security

---

## 📚 **Next Steps**

1. **Set up n8n** (optional - for advanced execution)
   - See: `AUTOMATION_SETUP.md`
   - See: `N8N_INTEGRATION_GUIDE.md`

2. **Create Real Workflows**
   - Use templates as starting point
   - Build custom automation
   - Test with real data

3. **Monitor Performance**
   - Check analytics daily
   - Review error logs
   - Optimize workflows

4. **Scale Up**
   - Upgrade subscription tier
   - Add more workflows
   - Invite team members

---

## 🆘 **Need Help?**

### Documentation Files:
- `AUTOMATION_SETUP.md` - Setup guide
- `N8N_INTEGRATION_GUIDE.md` - n8n integration
- `AUTOMATION_FEATURES_COMPLETE.md` - Complete feature list
- `FEATURES_COMPLETED_CHECKLIST.md` - Implementation status
- `AUTOMATION_UI_CHECKLIST.md` - UI verification

### Database Scripts:
- `supabase/create_automation_tables.sql` - Main tables
- `supabase/add_advanced_automation_features.sql` - Advanced features
- `supabase/VERIFY_AUTOMATION_SETUP.sql` - Verification queries

---

**Happy Automating! 🚀**

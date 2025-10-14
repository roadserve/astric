-- ============================================
-- VERIFY SIGNUP TRIGGER IS WORKING
-- ============================================
-- Check trigger, function, and test it
-- ============================================

-- Step 1: Check if trigger exists
SELECT 
  '🔍 Checking Trigger Status' as info;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 2: Check the trigger function code
SELECT 
  '🔍 Trigger Function Definition' as info;

SELECT 
  proname as function_name,
  prosrc as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Step 3: Verify Customer role exists and get its ID
SELECT 
  '✅ Customer Role Details' as info,
  id as role_id,
  role_name,
  is_default
FROM user_roles
WHERE role_name = 'Customer';

-- Step 4: Test query that trigger will use
SELECT 
  '🧪 Test: What role_id will be assigned to new users?' as info,
  id as customer_role_id
FROM user_roles
WHERE role_name = 'Customer'
LIMIT 1;

-- Step 5: Show instructions for testing
SELECT 
  '📋 To Test: Create a new user in Supabase Auth and check if profile is auto-created with role_id' as instructions;

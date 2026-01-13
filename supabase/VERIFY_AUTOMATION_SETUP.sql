-- ============================================
-- VERIFY AUTOMATION SYSTEM SETUP
-- ============================================
-- Run this in Supabase SQL Editor to check if everything is set up
-- ============================================

-- Check if all automation tables exist
SELECT 
    '✅ Automation Tables Check' as check_name,
    COUNT(*) as found_tables,
    CASE 
        WHEN COUNT(*) >= 16 THEN '✅ All tables exist'
        ELSE '❌ Missing tables - need to run migrations'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'automation_%';

-- List all automation tables
SELECT 
    '📊 Automation Tables List' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'automation_%'
ORDER BY table_name;

-- Check for RLS policies on automation tables
SELECT 
    '🔒 RLS Policies Check' as check_name,
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename LIKE 'automation_%'
ORDER BY tablename, policyname;

-- Check for automation functions
SELECT 
    '⚙️ Functions Check' as check_name,
    routine_name as function_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name LIKE '%automation%' 
    OR routine_name IN (
        'update_workflow_analytics',
        'create_workflow_version',
        'increment_execution_count',
        'reset_monthly_executions'
    )
)
ORDER BY routine_name;

-- Check for triggers
SELECT 
    '🎯 Triggers Check' as check_name,
    trigger_name,
    event_object_table as table_name,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table LIKE 'automation_%'
ORDER BY event_object_table, trigger_name;

-- Check for indexes on automation tables
SELECT 
    '📇 Indexes Check' as check_name,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'automation_%'
ORDER BY tablename, indexname;

-- Check sample data in automation_templates
SELECT 
    '📝 Templates Check' as check_name,
    COUNT(*) as template_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Templates loaded'
        ELSE '⚠️ No templates found - may want to add some'
    END as status
FROM automation_templates;

-- List existing templates
SELECT 
    '📋 Available Templates' as info,
    name,
    category,
    is_featured
FROM automation_templates
ORDER BY is_featured DESC, category, name;

-- Check automation subscriptions setup
SELECT 
    '💳 Subscriptions Check' as check_name,
    COUNT(*) as subscription_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Subscriptions exist'
        ELSE '⚠️ No subscriptions - organizations need subscriptions to use automation'
    END as status
FROM automation_subscriptions;

-- Summary
SELECT 
    '📊 SUMMARY' as section,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'automation_%') as total_tables,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename LIKE 'automation_%') as total_policies,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%automation%') as total_functions,
    (SELECT COUNT(*) FROM automation_templates) as total_templates;

-- Final Status
SELECT 
    '🎯 FINAL STATUS' as result,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'automation_%') >= 16
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename LIKE 'automation_%') > 0
        THEN '✅ AUTOMATION SYSTEM IS READY TO USE!'
        ELSE '⚠️ SETUP INCOMPLETE - Check missing items above'
    END as status;

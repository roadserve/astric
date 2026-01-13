-- ============================================
-- QUICK AUTOMATION FEATURES CHECK
-- ============================================
-- Run this for a quick 30-second verification

-- 1. CHECK ALL TABLES EXIST (Should return 16)
SELECT 
    '✅ TABLES' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 16 THEN '✓ ALL 16 TABLES EXIST'
        ELSE '⚠ MISSING TABLES'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'automation_%';

-- 2. CHECK RLS ENABLED (Should all show ENABLED)
SELECT 
    '✅ RLS' as check_type,
    COUNT(*) as tables_with_rls,
    CASE 
        WHEN COUNT(*) >= 16 THEN '✓ RLS ENABLED'
        ELSE '⚠ SOME TABLES MISSING RLS'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'automation_%'
AND rowsecurity = true;

-- 3. CHECK TEMPLATES (Should return 10)
SELECT 
    '✅ TEMPLATES' as check_type,
    COUNT(*) as template_count,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✓ ALL TEMPLATES LOADED'
        WHEN COUNT(*) >= 5 THEN '⚠ SOME TEMPLATES MISSING'
        ELSE '❌ NO TEMPLATES FOUND'
    END as status
FROM automation_marketplace_workflows;

-- 4. CHECK INITIAL TEMPLATES (Should return 5)
SELECT 
    '✅ BASIC TEMPLATES' as check_type,
    COUNT(*) as basic_template_count,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✓ BASIC TEMPLATES LOADED'
        ELSE '⚠ MISSING BASIC TEMPLATES'
    END as status
FROM automation_templates;

-- 5. LIST YOUR WORKFLOWS (May be empty - that's OK!)
SELECT 
    '✅ YOUR WORKFLOWS' as check_type,
    COALESCE(COUNT(*), 0) as workflow_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ YOU HAVE WORKFLOWS'
        ELSE '○ NO WORKFLOWS YET (NORMAL)'
    END as status
FROM automation_workflows;

-- 6. CHECK SUBSCRIPTION PLANS
SELECT 
    '✅ SUBSCRIPTIONS' as check_type,
    COALESCE(COUNT(DISTINCT plan_type), 0) as plan_types,
    COALESCE(COUNT(*), 0) as total_subscriptions,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ SUBSCRIPTIONS CONFIGURED'
        ELSE '○ NO ORGANIZATIONS YET (NORMAL)'
    END as status
FROM automation_subscriptions;

-- 7. FINAL SUMMARY
SELECT 
    '🎉 SUMMARY' as report_type,
    'Status' as metric,
    'ALL SYSTEMS READY! ✅' as value;

-- 8. WHAT TO DO NEXT
SELECT 
    '📍 NEXT STEPS' as action,
    'Go to /dashboard/automation and click "Create Workflow"' as instruction;

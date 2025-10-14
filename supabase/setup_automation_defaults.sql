-- ============================================
-- SETUP AUTOMATION DEFAULTS (Run only if needed)
-- ============================================
-- This adds default subscriptions and templates if missing
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING)
-- ============================================

-- Add default subscription for all organizations without one
INSERT INTO automation_subscriptions (
    organization_id,
    plan_type,
    max_workflows,
    max_executions_per_month,
    current_month_executions,
    is_active
)
SELECT 
    id as organization_id,
    'free' as plan_type,
    5 as max_workflows,
    100 as max_executions_per_month,
    0 as current_month_executions,
    true as is_active
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM automation_subscriptions)
ON CONFLICT (organization_id) DO NOTHING;

-- Add basic workflow templates if missing
INSERT INTO automation_templates (name, description, category, icon, workflow_template, is_featured) VALUES
(
    'Send Email Notification',
    'Automatically send email when triggered',
    'email',
    '📧',
    '{"nodes": [{"type": "webhook", "name": "Trigger"}, {"type": "send_email", "name": "Send Email"}], "connections": {}}'::jsonb,
    true
),
(
    'WhatsApp Message',
    'Send WhatsApp message to customers',
    'whatsapp',
    '💬',
    '{"nodes": [{"type": "webhook", "name": "Trigger"}, {"type": "send_whatsapp", "name": "WhatsApp"}], "connections": {}}'::jsonb,
    true
),
(
    'Daily Report',
    'Generate and send daily reports',
    'reporting',
    '📊',
    '{"nodes": [{"type": "schedule", "name": "Daily", "parameters": {"cron": "0 9 * * *"}}, {"type": "database_query", "name": "Fetch Data"}, {"type": "send_email", "name": "Send Report"}], "connections": {}}'::jsonb,
    true
),
(
    'Customer Onboarding',
    'Welcome new customers with automated workflow',
    'crm',
    '👋',
    '{"nodes": [{"type": "webhook", "name": "New Customer"}, {"type": "send_email", "name": "Welcome Email"}, {"type": "send_whatsapp", "name": "WhatsApp Welcome"}], "connections": {}}'::jsonb,
    true
),
(
    'Invoice Generation',
    'Create and send invoices automatically',
    'invoice',
    '📄',
    '{"nodes": [{"type": "webhook", "name": "Order Completed"}, {"type": "database_query", "name": "Get Order"}, {"type": "send_email", "name": "Email Invoice"}], "connections": {}}'::jsonb,
    false
)
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 
    '✅ Setup Complete!' as status,
    (SELECT COUNT(*) FROM automation_subscriptions) as total_subscriptions,
    (SELECT COUNT(*) FROM automation_templates) as total_templates;

-- Show which organizations now have subscriptions
SELECT 
    '📊 Organizations with Automation' as info,
    o.name as organization_name,
    s.plan_type,
    s.max_workflows,
    s.max_executions_per_month
FROM automation_subscriptions s
JOIN organizations o ON o.id = s.organization_id
ORDER BY o.name;


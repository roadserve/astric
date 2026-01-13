-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job to mark overdue invoices (runs daily at 1 AM)
SELECT cron.schedule(
    'mark-overdue-invoices',
    '0 1 * * *',
    $$
    SELECT mark_overdue_invoices();
    $$
);

-- Schedule job to run usage billing (runs daily at 2 AM)
SELECT cron.schedule(
    'usage-billing-job',
    '0 2 * * *',
    $$
    SELECT net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/usage_billing_job',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
    $$
);

-- Schedule job to send payment reminders (runs daily at 10 AM)
SELECT cron.schedule(
    'payment-reminders',
    '0 10 * * *',
    $$
    -- This would call a function to send reminder notifications
    -- Can be implemented via Edge Function or custom notification system
    NOTIFY payment_reminders_due, 'Check overdue invoices';
    $$
);

-- Schedule job to clean up old AI task logs (runs weekly on Sunday at 3 AM)
SELECT cron.schedule(
    'cleanup-old-ai-tasks',
    '0 3 * * 0',
    $$
    DELETE FROM ai_tasks 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND status IN ('completed', 'failed');
    $$
);

-- Schedule job to aggregate daily statistics (runs daily at midnight)
SELECT cron.schedule(
    'daily-stats-aggregation',
    '0 0 * * *',
    $$
    -- Aggregate statistics for reporting
    -- This can be expanded based on specific analytics needs
    INSERT INTO usage_tracking (organization_id, feature, usage_count, usage_date, metadata)
    SELECT 
        organization_id,
        'daily_active_users',
        COUNT(DISTINCT created_by),
        CURRENT_DATE - 1,
        jsonb_build_object('date', CURRENT_DATE - 1)
    FROM invoices
    WHERE DATE(created_at) = CURRENT_DATE - 1
    GROUP BY organization_id
    ON CONFLICT DO NOTHING;
    $$
);

-- Enable pg_net so cron jobs can call Edge Functions via net.http_post
-- Needed for:
-- - 20231201000004_cron_jobs.sql (usage_billing_job)
-- - 20231201000018_rank_cron.sql (rank_run_keywords_job)

CREATE EXTENSION IF NOT EXISTS pg_net;


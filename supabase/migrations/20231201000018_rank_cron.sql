-- Scheduled keyword rank runs (daily)
-- Requires pg_cron and pg_net; this project already uses net.http_post in 20231201000004_cron_jobs.sql.

SELECT cron.schedule(
  'rank-keywords-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/rank_run_keywords_job',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);


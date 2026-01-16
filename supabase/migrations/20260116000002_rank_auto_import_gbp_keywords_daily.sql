-- Daily: auto-import GBP (GMB) search keywords into rank tracking
-- Source: gmb_search_keywords_monthly (latest month per location)
-- Target: rank_keywords (scheduled = true)
-- Notes:
-- - Inserts top 10 keywords per location by impressions
-- - Skips duplicates (case-insensitive) for same org+location+language
-- - Uses organization owner (or manager) as created_by
-- - Runs daily at 05:30 (before the 06:00 rank run cron)

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.rank_auto_import_gbp_keywords_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
BEGIN
  WITH chosen_user AS (
    SELECT DISTINCT ON (om.organization_id)
      om.organization_id,
      om.user_id AS created_by
    FROM public.organization_members om
    WHERE om.is_active = true
      AND om.role IN ('owner', 'manager')
    ORDER BY
      om.organization_id,
      CASE WHEN om.role = 'owner' THEN 0 WHEN om.role = 'manager' THEN 1 ELSE 9 END,
      om.user_id::text
  ),
  latest_month AS (
    SELECT gmb_location_id, MAX(month) AS month
    FROM public.gmb_search_keywords_monthly
    GROUP BY gmb_location_id
  ),
  ranked AS (
    SELECT
      s.organization_id,
      s.gmb_location_id,
      TRIM(s.keyword) AS keyword,
      s.impressions,
      ROW_NUMBER() OVER (
        PARTITION BY s.gmb_location_id
        ORDER BY s.impressions DESC, TRIM(s.keyword) ASC
      ) AS rn
    FROM public.gmb_search_keywords_monthly s
    JOIN latest_month lm
      ON lm.gmb_location_id = s.gmb_location_id
     AND lm.month = s.month
    WHERE s.impressions > 0
      AND LENGTH(TRIM(s.keyword)) > 0
  ),
  topk AS (
    SELECT organization_id, gmb_location_id, keyword
    FROM ranked
    WHERE rn <= 10
  ),
  ins AS (
    INSERT INTO public.rank_keywords (
      organization_id,
      gmb_location_id,
      keyword,
      language_code,
      is_active,
      is_scheduled,
      created_by
    )
    SELECT
      t.organization_id,
      t.gmb_location_id,
      t.keyword,
      'en',
      true,
      true,
      cu.created_by
    FROM topk t
    JOIN chosen_user cu
      ON cu.organization_id = t.organization_id
    WHERE cu.created_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.rank_keywords rk
        WHERE rk.organization_id = t.organization_id
          AND rk.gmb_location_id = t.gmb_location_id
          AND LOWER(TRIM(rk.keyword)) = LOWER(TRIM(t.keyword))
          AND COALESCE(rk.language_code, 'en') = 'en'
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted FROM ins;

  RAISE NOTICE 'rank_auto_import_gbp_keywords_daily inserted % row(s)', v_inserted;
END;
$$;

-- Speed up de-dup check
CREATE INDEX IF NOT EXISTS idx_rank_keywords_org_loc_kw_lang
  ON public.rank_keywords (organization_id, gmb_location_id, LOWER(TRIM(keyword)), COALESCE(language_code, 'en'));

-- (Re)Schedule the daily job (idempotent)
DO $$
DECLARE
  v_jobid integer;
BEGIN
  SELECT jobid INTO v_jobid
  FROM cron.job
  WHERE jobname = 'rank-auto-import-gbp-keywords-daily';

  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;

  PERFORM cron.schedule(
    'rank-auto-import-gbp-keywords-daily',
    '30 5 * * *',
    $job$ SELECT public.rank_auto_import_gbp_keywords_daily(); $job$
  );
END $$;


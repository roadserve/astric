-- GMB/GBP: raw payload storage + Search Keywords (monthly impressions)
-- This migration is additive + idempotent.

-- =============================
-- 1) Raw JSON columns (so nothing is "missed")
-- =============================
ALTER TABLE gmb_locations
  ADD COLUMN IF NOT EXISTS raw_location JSONB,
  ADD COLUMN IF NOT EXISTS raw_location_full JSONB;

ALTER TABLE gmb_reviews
  ADD COLUMN IF NOT EXISTS raw_review JSONB;

-- =============================
-- 2) Insights fetch logs (store raw API responses)
-- =============================
CREATE TABLE IF NOT EXISTS gmb_insights_fetches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES gmb_locations(id) ON DELETE SET NULL,
  kind TEXT NOT NULL, -- e.g. 'multi_daily_metrics', 'search_keywords_monthly'
  request JSONB,
  response JSONB,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gmb_insights_fetches_org ON gmb_insights_fetches(organization_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_gmb_insights_fetches_loc ON gmb_insights_fetches(gmb_location_id, fetched_at DESC);

ALTER TABLE gmb_insights_fetches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='gmb_insights_fetches' AND policyname='gmb_insights_fetches_select'
  ) THEN
    EXECUTE 'CREATE POLICY gmb_insights_fetches_select ON gmb_insights_fetches
      FOR SELECT USING (is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='gmb_insights_fetches' AND policyname='gmb_insights_fetches_all'
  ) THEN
    EXECUTE 'CREATE POLICY gmb_insights_fetches_all ON gmb_insights_fetches
      FOR ALL USING (is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

-- =============================
-- 3) Search Keywords (monthly impressions)
-- =============================
CREATE TABLE IF NOT EXISTS gmb_search_keywords_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID NOT NULL REFERENCES gmb_locations(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- YYYY-MM-01
  keyword TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  raw JSONB,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (gmb_location_id, month, keyword)
);

CREATE INDEX IF NOT EXISTS idx_gmb_search_keywords_monthly_org ON gmb_search_keywords_monthly(organization_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_gmb_search_keywords_monthly_loc ON gmb_search_keywords_monthly(gmb_location_id, month DESC);

ALTER TABLE gmb_search_keywords_monthly ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='gmb_search_keywords_monthly' AND policyname='gmb_search_keywords_monthly_select'
  ) THEN
    EXECUTE 'CREATE POLICY gmb_search_keywords_monthly_select ON gmb_search_keywords_monthly
      FOR SELECT USING (is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='gmb_search_keywords_monthly' AND policyname='gmb_search_keywords_monthly_all'
  ) THEN
    EXECUTE 'CREATE POLICY gmb_search_keywords_monthly_all ON gmb_search_keywords_monthly
      FOR ALL USING (is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

-- =============================
-- 4) Per-location post publication mapping (store Google post IDs + raw responses)
-- =============================
CREATE TABLE IF NOT EXISTS gmb_post_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES gmb_posts(id) ON DELETE CASCADE,
  gmb_location_id UUID NOT NULL REFERENCES gmb_locations(id) ON DELETE CASCADE,
  google_post_name TEXT, -- resource name returned by Google, e.g. accounts/.../locations/.../localPosts/...
  status TEXT NOT NULL DEFAULT 'processing', -- processing, published, failed
  error_text TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (post_id, gmb_location_id)
);

CREATE INDEX IF NOT EXISTS idx_gmb_post_publications_org ON gmb_post_publications(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gmb_post_publications_post ON gmb_post_publications(post_id);
CREATE INDEX IF NOT EXISTS idx_gmb_post_publications_loc ON gmb_post_publications(gmb_location_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_gmb_post_publications_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_gmb_post_publications_updated_at
      BEFORE UPDATE ON gmb_post_publications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;
END $$;

ALTER TABLE gmb_post_publications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='gmb_post_publications' AND policyname='gmb_post_publications_select'
  ) THEN
    EXECUTE 'CREATE POLICY gmb_post_publications_select ON gmb_post_publications
      FOR SELECT USING (is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='gmb_post_publications' AND policyname='gmb_post_publications_all'
  ) THEN
    EXECUTE 'CREATE POLICY gmb_post_publications_all ON gmb_post_publications
      FOR ALL USING (is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;


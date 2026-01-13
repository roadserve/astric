-- ALL-IN-ONE: RightChoice GMB Suite schema (covers 14..20)
-- Safe to run on your current schema; uses IF NOT EXISTS and DO blocks for idempotency.

-- =============================
-- 0) Ensure extensions we rely on
-- =============================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =============================
-- 0.1) Ensure RLS helper functions exist (avoid ambiguous column references)
-- =============================
CREATE OR REPLACE FUNCTION public.is_organization_member(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = p_user_id
      AND om.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(p_org_id UUID, p_user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT om.role
      FROM public.organization_members om
      WHERE om.organization_id = p_org_id
        AND om.user_id = p_user_id
        AND om.is_active = true
      LIMIT 1
    ),
    'staff'::user_role
  );
$$;

-- =============================
-- 1) Extend existing gmb_locations
-- (your current schema has gmb_locations without these columns)
-- =============================
ALTER TABLE public.gmb_locations
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS categories_json JSONB,
  ADD COLUMN IF NOT EXISTS additional_categories TEXT[],
  ADD COLUMN IF NOT EXISTS appointment_link TEXT,
  ADD COLUMN IF NOT EXISTS menu_link TEXT,
  ADD COLUMN IF NOT EXISTS chat_link TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB,
  ADD COLUMN IF NOT EXISTS opening_date DATE,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS videos JSONB;

-- =============================
-- 2) Media assets + Supabase Storage bucket + policies
-- =============================
CREATE TABLE IF NOT EXISTS public.gmb_media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID NOT NULL REFERENCES public.gmb_locations(id) ON DELETE CASCADE,
  google_media_name TEXT,
  media_format TEXT NOT NULL DEFAULT 'PHOTO',
  category TEXT,
  source_url TEXT,
  google_url TEXT,
  width INTEGER,
  height INTEGER,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gmb_media_assets_org ON public.gmb_media_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_media_assets_loc ON public.gmb_media_assets(gmb_location_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_gmb_media_assets_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_gmb_media_assets_updated_at
      BEFORE UPDATE ON public.gmb_media_assets
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

ALTER TABLE public.gmb_media_assets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_media_assets' AND policyname='gmb_media_assets_select') THEN
    EXECUTE 'CREATE POLICY gmb_media_assets_select ON public.gmb_media_assets
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_media_assets' AND policyname='gmb_media_assets_all') THEN
    EXECUTE 'CREATE POLICY gmb_media_assets_all ON public.gmb_media_assets
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

-- Storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('gmb_media', 'gmb_media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (Postgres does not support CREATE POLICY IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'gmb_media_read_auth'
  ) THEN
    EXECUTE 'CREATE POLICY gmb_media_read_auth
      ON storage.objects FOR SELECT
      USING (bucket_id = ''gmb_media'' AND auth.role() = ''authenticated'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'gmb_media_insert_auth'
  ) THEN
    EXECUTE 'CREATE POLICY gmb_media_insert_auth
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = ''gmb_media'' AND auth.role() = ''authenticated'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'gmb_media_update_auth'
  ) THEN
    EXECUTE 'CREATE POLICY gmb_media_update_auth
      ON storage.objects FOR UPDATE
      USING (bucket_id = ''gmb_media'' AND auth.role() = ''authenticated'')
      WITH CHECK (bucket_id = ''gmb_media'' AND auth.role() = ''authenticated'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'gmb_media_delete_auth'
  ) THEN
    EXECUTE 'CREATE POLICY gmb_media_delete_auth
      ON storage.objects FOR DELETE
      USING (bucket_id = ''gmb_media'' AND auth.role() = ''authenticated'')';
  END IF;
END $$;

-- =============================
-- 3) Products & Services + assignments
-- =============================
CREATE TABLE IF NOT EXISTS public.gmb_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  category TEXT,
  image_urls TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gmb_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_gmb_products_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_gmb_products_updated_at
      BEFORE UPDATE ON public.gmb_products
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_gmb_services_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_gmb_services_updated_at
      BEFORE UPDATE ON public.gmb_services
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gmb_products_org ON public.gmb_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_services_org ON public.gmb_services(organization_id);

ALTER TABLE public.gmb_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmb_services ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_products' AND policyname='gmb_products_select') THEN
    EXECUTE 'CREATE POLICY gmb_products_select ON public.gmb_products
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_products' AND policyname='gmb_products_all') THEN
    EXECUTE 'CREATE POLICY gmb_products_all ON public.gmb_products
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_services' AND policyname='gmb_services_select') THEN
    EXECUTE 'CREATE POLICY gmb_services_select ON public.gmb_services
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_services' AND policyname='gmb_services_all') THEN
    EXECUTE 'CREATE POLICY gmb_services_all ON public.gmb_services
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.gmb_location_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID NOT NULL REFERENCES public.gmb_locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.gmb_products(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (gmb_location_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.gmb_location_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID NOT NULL REFERENCES public.gmb_locations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.gmb_services(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (gmb_location_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_gmb_location_products_org ON public.gmb_location_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_location_products_loc ON public.gmb_location_products(gmb_location_id);
CREATE INDEX IF NOT EXISTS idx_gmb_location_services_org ON public.gmb_location_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_location_services_loc ON public.gmb_location_services(gmb_location_id);

ALTER TABLE public.gmb_location_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmb_location_services ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_location_products' AND policyname='gmb_location_products_select') THEN
    EXECUTE 'CREATE POLICY gmb_location_products_select ON public.gmb_location_products
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_location_products' AND policyname='gmb_location_products_all') THEN
    EXECUTE 'CREATE POLICY gmb_location_products_all ON public.gmb_location_products
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_location_services' AND policyname='gmb_location_services_select') THEN
    EXECUTE 'CREATE POLICY gmb_location_services_select ON public.gmb_location_services
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_location_services' AND policyname='gmb_location_services_all') THEN
    EXECUTE 'CREATE POLICY gmb_location_services_all ON public.gmb_location_services
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

-- =============================
-- 4) Reviews extras: templates, auto-reply rules, QR codes, scans
-- =============================
CREATE TABLE IF NOT EXISTS public.gmb_review_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_text TEXT NOT NULL,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gmb_review_auto_reply_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  min_rating INTEGER DEFAULT 1 CHECK (min_rating >= 1 AND min_rating <= 5),
  max_rating INTEGER DEFAULT 5 CHECK (max_rating >= 1 AND max_rating <= 5),
  only_unreplied BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT true,
  template_id UUID REFERENCES public.gmb_review_templates(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_gmb_review_templates_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_gmb_review_templates_updated_at
      BEFORE UPDATE ON public.gmb_review_templates
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_gmb_review_auto_reply_rules_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_gmb_review_auto_reply_rules_updated_at
      BEFORE UPDATE ON public.gmb_review_auto_reply_rules
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gmb_review_templates_org ON public.gmb_review_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_review_auto_reply_rules_org ON public.gmb_review_auto_reply_rules(organization_id);

ALTER TABLE public.gmb_review_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmb_review_auto_reply_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_review_templates' AND policyname='gmb_review_templates_select') THEN
    EXECUTE 'CREATE POLICY gmb_review_templates_select ON public.gmb_review_templates
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_review_templates' AND policyname='gmb_review_templates_all') THEN
    EXECUTE 'CREATE POLICY gmb_review_templates_all ON public.gmb_review_templates
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_review_auto_reply_rules' AND policyname='gmb_review_auto_reply_rules_select') THEN
    EXECUTE 'CREATE POLICY gmb_review_auto_reply_rules_select ON public.gmb_review_auto_reply_rules
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_review_auto_reply_rules' AND policyname='gmb_review_auto_reply_rules_all') THEN
    EXECUTE 'CREATE POLICY gmb_review_auto_reply_rules_all ON public.gmb_review_auto_reply_rules
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.gmb_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES public.gmb_locations(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  label TEXT,
  target_url TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gmb_qr_codes_org ON public.gmb_qr_codes(organization_id);

ALTER TABLE public.gmb_qr_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_qr_codes' AND policyname='gmb_qr_codes_select') THEN
    EXECUTE 'CREATE POLICY gmb_qr_codes_select ON public.gmb_qr_codes
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_qr_codes' AND policyname='gmb_qr_codes_all') THEN
    EXECUTE 'CREATE POLICY gmb_qr_codes_all ON public.gmb_qr_codes
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.gmb_qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID NOT NULL REFERENCES public.gmb_qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_gmb_qr_scans_qr ON public.gmb_qr_scans(qr_code_id);

ALTER TABLE public.gmb_qr_scans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_qr_scans' AND policyname='gmb_qr_scans_select') THEN
    EXECUTE 'CREATE POLICY gmb_qr_scans_select ON public.gmb_qr_scans
      FOR SELECT USING (
        EXISTS (
          SELECT 1
          FROM public.gmb_qr_codes c
          WHERE c.id = public.gmb_qr_scans.qr_code_id
            AND public.is_organization_member(c.organization_id, auth.uid())
        )
      )';
  END IF;
END $$;

-- =============================
-- 5) Rank tracking: keywords, runs, points
-- =============================
CREATE TABLE IF NOT EXISTS public.rank_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES public.gmb_locations(id) ON DELETE SET NULL,
  keyword TEXT NOT NULL,
  location_name TEXT,
  language_code TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  is_scheduled BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rank_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL DEFAULT 'keyword',
  status TEXT DEFAULT 'processing',
  total_tasks INTEGER DEFAULT 0,
  successful_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.rank_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rank_run_id UUID REFERENCES public.rank_runs(id) ON DELETE SET NULL,
  rank_keyword_id UUID NOT NULL REFERENCES public.rank_keywords(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES public.gmb_locations(id) ON DELETE SET NULL,
  rank_position INTEGER,
  found_title TEXT,
  found_place_id TEXT,
  provider TEXT DEFAULT 'dataforseo',
  fetched_at TIMESTAMPTZ DEFAULT now(),
  raw JSONB
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_rank_keywords_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_rank_keywords_updated_at
      BEFORE UPDATE ON public.rank_keywords
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rank_keywords_org ON public.rank_keywords(organization_id);
CREATE INDEX IF NOT EXISTS idx_rank_keywords_loc ON public.rank_keywords(gmb_location_id);
CREATE INDEX IF NOT EXISTS idx_rank_runs_org ON public.rank_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_rank_runs_created ON public.rank_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_rank_points_org ON public.rank_points(organization_id);
CREATE INDEX IF NOT EXISTS idx_rank_points_keyword ON public.rank_points(rank_keyword_id, fetched_at);
CREATE INDEX IF NOT EXISTS idx_rank_points_loc ON public.rank_points(gmb_location_id, fetched_at);

ALTER TABLE public.rank_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_points ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rank_keywords' AND policyname='rank_keywords_select') THEN
    EXECUTE 'CREATE POLICY rank_keywords_select ON public.rank_keywords
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rank_keywords' AND policyname='rank_keywords_all') THEN
    EXECUTE 'CREATE POLICY rank_keywords_all ON public.rank_keywords
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rank_runs' AND policyname='rank_runs_select') THEN
    EXECUTE 'CREATE POLICY rank_runs_select ON public.rank_runs
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rank_runs' AND policyname='rank_runs_all') THEN
    EXECUTE 'CREATE POLICY rank_runs_all ON public.rank_runs
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rank_points' AND policyname='rank_points_select') THEN
    EXECUTE 'CREATE POLICY rank_points_select ON public.rank_points
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rank_points' AND policyname='rank_points_all') THEN
    EXECUTE 'CREATE POLICY rank_points_all ON public.rank_points
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

-- =============================
-- 6) Geo Grid: runs + points
-- =============================
CREATE TABLE IF NOT EXISTS public.geo_grid_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES public.gmb_locations(id) ON DELETE SET NULL,
  keyword TEXT NOT NULL,
  grid_size INTEGER NOT NULL DEFAULT 7,
  step_km DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  status TEXT DEFAULT 'processing',
  total_points INTEGER DEFAULT 0,
  successful_points INTEGER DEFAULT 0,
  failed_points INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.geo_grid_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  geo_grid_run_id UUID NOT NULL REFERENCES public.geo_grid_runs(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES public.gmb_locations(id) ON DELETE SET NULL,
  grid_x INTEGER NOT NULL DEFAULT 0,
  grid_y INTEGER NOT NULL DEFAULT 0,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  rank_position INTEGER,
  found_title TEXT,
  found_place_id TEXT,
  provider TEXT DEFAULT 'dataforseo',
  fetched_at TIMESTAMPTZ DEFAULT now(),
  raw JSONB
);

CREATE INDEX IF NOT EXISTS idx_geo_grid_runs_org ON public.geo_grid_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_grid_runs_created ON public.geo_grid_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_geo_grid_points_run ON public.geo_grid_points(geo_grid_run_id);
CREATE INDEX IF NOT EXISTS idx_geo_grid_points_org ON public.geo_grid_points(organization_id);

ALTER TABLE public.geo_grid_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_grid_points ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='geo_grid_runs' AND policyname='geo_grid_runs_select') THEN
    EXECUTE 'CREATE POLICY geo_grid_runs_select ON public.geo_grid_runs
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='geo_grid_runs' AND policyname='geo_grid_runs_all') THEN
    EXECUTE 'CREATE POLICY geo_grid_runs_all ON public.geo_grid_runs
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='geo_grid_points' AND policyname='geo_grid_points_select') THEN
    EXECUTE 'CREATE POLICY geo_grid_points_select ON public.geo_grid_points
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='geo_grid_points' AND policyname='geo_grid_points_all') THEN
    EXECUTE 'CREATE POLICY geo_grid_points_all ON public.geo_grid_points
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

-- =============================
-- 7) Q&A workflow (fallback)
-- =============================
CREATE TABLE IF NOT EXISTS public.gmb_qna_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES public.gmb_locations(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  customer_name TEXT,
  customer_contact TEXT,
  status TEXT DEFAULT 'open',
  answer TEXT,
  answered_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_gmb_qna_requests_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_gmb_qna_requests_updated_at
      BEFORE UPDATE ON public.gmb_qna_requests
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gmb_qna_requests_org ON public.gmb_qna_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_qna_requests_status ON public.gmb_qna_requests(organization_id, status);

ALTER TABLE public.gmb_qna_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_qna_requests' AND policyname='gmb_qna_requests_select') THEN
    EXECUTE 'CREATE POLICY gmb_qna_requests_select ON public.gmb_qna_requests
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_qna_requests' AND policyname='gmb_qna_requests_all') THEN
    EXECUTE 'CREATE POLICY gmb_qna_requests_all ON public.gmb_qna_requests
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

-- =============================
-- 8) Cron: daily keyword ranks (safe if already scheduled)
-- =============================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rank-keywords-daily') THEN
      PERFORM cron.schedule(
        'rank-keywords-daily',
        '0 6 * * *',
        $job$
        SELECT net.http_post(
          url := current_setting('app.supabase_url') || '/functions/v1/rank_run_keywords_job',
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
            'Content-Type', 'application/json'
          ),
          body := '{}'::jsonb
        );
        $job$
      );
    END IF;
  END IF;
END $$;


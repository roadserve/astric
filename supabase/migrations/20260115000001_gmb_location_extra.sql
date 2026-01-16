-- Extend GMB locations with extra profile details
-- and create normalized attribute/category tables.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gmb_locations' AND column_name = 'special_hours'
  ) THEN
    ALTER TABLE public.gmb_locations ADD COLUMN special_hours JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gmb_locations' AND column_name = 'service_area'
  ) THEN
    ALTER TABLE public.gmb_locations ADD COLUMN service_area JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gmb_locations' AND column_name = 'open_info'
  ) THEN
    ALTER TABLE public.gmb_locations ADD COLUMN open_info JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gmb_locations' AND column_name = 'labels'
  ) THEN
    ALTER TABLE public.gmb_locations ADD COLUMN labels TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gmb_locations' AND column_name = 'more_hours'
  ) THEN
    ALTER TABLE public.gmb_locations ADD COLUMN more_hours JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gmb_locations' AND column_name = 'primary_category'
  ) THEN
    ALTER TABLE public.gmb_locations ADD COLUMN primary_category TEXT;
  END IF;
END $$;

-- Normalized attributes (optional, complements raw JSON)
CREATE TABLE IF NOT EXISTS public.gmb_location_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID NOT NULL REFERENCES public.gmb_locations(id) ON DELETE CASCADE,
  attribute_id TEXT NOT NULL,
  value TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (gmb_location_id, attribute_id, value)
);

CREATE INDEX IF NOT EXISTS idx_gmb_location_attributes_org ON public.gmb_location_attributes(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_location_attributes_loc ON public.gmb_location_attributes(gmb_location_id);

ALTER TABLE public.gmb_location_attributes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_location_attributes' AND policyname='gmb_location_attributes_select') THEN
    EXECUTE 'CREATE POLICY gmb_location_attributes_select ON public.gmb_location_attributes
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_location_attributes' AND policyname='gmb_location_attributes_all') THEN
    EXECUTE 'CREATE POLICY gmb_location_attributes_all ON public.gmb_location_attributes
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

-- Normalized categories (primary/additional)
CREATE TABLE IF NOT EXISTS public.gmb_location_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID NOT NULL REFERENCES public.gmb_locations(id) ON DELETE CASCADE,
  category_id TEXT,
  category_name TEXT,
  category_type TEXT NOT NULL DEFAULT 'additional', -- primary|additional
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gmb_location_categories_org ON public.gmb_location_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_location_categories_loc ON public.gmb_location_categories(gmb_location_id);
CREATE INDEX IF NOT EXISTS idx_gmb_location_categories_type ON public.gmb_location_categories(category_type);

ALTER TABLE public.gmb_location_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_location_categories' AND policyname='gmb_location_categories_select') THEN
    EXECUTE 'CREATE POLICY gmb_location_categories_select ON public.gmb_location_categories
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_location_categories' AND policyname='gmb_location_categories_all') THEN
    EXECUTE 'CREATE POLICY gmb_location_categories_all ON public.gmb_location_categories
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

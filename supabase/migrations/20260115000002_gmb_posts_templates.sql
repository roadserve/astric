-- Post templates + raw post storage

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gmb_posts' AND column_name = 'raw_post'
  ) THEN
    ALTER TABLE public.gmb_posts ADD COLUMN raw_post JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gmb_posts' AND column_name = 'google_post_name'
  ) THEN
    ALTER TABLE public.gmb_posts ADD COLUMN google_post_name TEXT;
  END IF;
END $$;

-- NOTE: must NOT be a partial index; Postgres ON CONFLICT inference
-- (used by PostgREST upsert) can't target partial unique indexes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_gmb_posts_org_google_name
  ON public.gmb_posts(organization_id, google_post_name);

CREATE TABLE IF NOT EXISTS public.gmb_post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  title TEXT,
  call_to_action TEXT,
  action_url TEXT,
  media_urls TEXT[],
  post_type TEXT DEFAULT 'STANDARD',
  event_details JSONB,
  offer_details JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gmb_post_templates_org ON public.gmb_post_templates(organization_id);

ALTER TABLE public.gmb_post_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_post_templates' AND policyname='gmb_post_templates_select') THEN
    EXECUTE 'CREATE POLICY gmb_post_templates_select ON public.gmb_post_templates
      FOR SELECT USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gmb_post_templates' AND policyname='gmb_post_templates_all') THEN
    EXECUTE 'CREATE POLICY gmb_post_templates_all ON public.gmb_post_templates
      FOR ALL USING (public.is_organization_member(organization_id, auth.uid()))';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_gmb_post_templates_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_gmb_post_templates_updated_at
      BEFORE UPDATE ON public.gmb_post_templates
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

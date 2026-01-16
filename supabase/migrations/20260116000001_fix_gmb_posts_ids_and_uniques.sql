-- Fix gmb_posts inserts on DBs without uuid-ossp default
-- Ensure google_post_name/raw_post columns and conflict index exist

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  -- Ensure columns exist (safe if already added)
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

-- Ensure ON CONFLICT(organization_id, google_post_name) has a matching unique index
-- NOTE: must NOT be a partial index; Postgres ON CONFLICT inference
-- (used by PostgREST upsert) can't target partial unique indexes.
DO $$
DECLARE
  idxdef text;
BEGIN
  SELECT indexdef INTO idxdef
  FROM pg_indexes
  WHERE schemaname='public'
    AND tablename='gmb_posts'
    AND indexname='uq_gmb_posts_org_google_name';

  -- If an old partial index exists (has a WHERE clause), drop it so we can recreate non-partial.
  IF idxdef IS NOT NULL AND position(' WHERE ' in upper(idxdef)) > 0 THEN
    EXECUTE 'DROP INDEX IF EXISTS public.uq_gmb_posts_org_google_name';
    idxdef := NULL;
  END IF;

  IF idxdef IS NULL THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uq_gmb_posts_org_google_name ON public.gmb_posts(organization_id, google_post_name)';
  END IF;
END $$;

-- Ensure id default doesn't depend on uuid_generate_v4()
ALTER TABLE public.gmb_posts
  ALTER COLUMN id SET DEFAULT gen_random_uuid();


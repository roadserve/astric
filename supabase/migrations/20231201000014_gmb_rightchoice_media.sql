-- RightChoice-level GBP: Media management + extended location fields

-- Extend locations with extra fields used by RightChoice-style UI
ALTER TABLE gmb_locations
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

-- Media assets stored for locations (synced from Google + uploaded through app)
CREATE TABLE IF NOT EXISTS gmb_media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID NOT NULL REFERENCES gmb_locations(id) ON DELETE CASCADE,
  google_media_name TEXT, -- resourceName if returned
  media_format TEXT NOT NULL DEFAULT 'PHOTO', -- PHOTO, VIDEO
  category TEXT, -- COVER, PROFILE, LOGO, EXTERIOR, INTERIOR, TEAM, AT_WORK, FOOD_AND_DRINK, MENU, PRODUCT, etc.
  source_url TEXT, -- our uploaded/public url or google hosted url
  google_url TEXT, -- url returned by Google, if any
  width INTEGER,
  height INTEGER,
  status TEXT DEFAULT 'active', -- active, deleted, failed
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gmb_media_assets_org ON gmb_media_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_media_assets_loc ON gmb_media_assets(gmb_location_id);

CREATE TRIGGER update_gmb_media_assets_updated_at
  BEFORE UPDATE ON gmb_media_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE gmb_media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GMB media assets of their organizations" ON gmb_media_assets
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can manage GMB media assets of their organizations" ON gmb_media_assets
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));

-- Bucket for uploads used as `sourceUrl` for Google Media.Create
-- Note: On Supabase, `storage` schema exists; this is safe to run in Supabase SQL editor/migrations.
INSERT INTO storage.buckets (id, name, public)
VALUES ('gmb_media', 'gmb_media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (simple + permissive for authenticated users in this project)
-- Adjust later to enforce org-based prefixes if needed.
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


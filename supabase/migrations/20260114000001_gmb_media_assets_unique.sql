-- Prevent duplicate media rows per location
-- Enables safe UPSERT in gmb_sync_media

CREATE UNIQUE INDEX IF NOT EXISTS uq_gmb_media_assets_org_loc_google_name
  ON public.gmb_media_assets(organization_id, gmb_location_id, google_media_name);


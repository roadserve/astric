-- RightChoice-level: Geo Grid ranker (runs + points)

CREATE TABLE IF NOT EXISTS geo_grid_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES gmb_locations(id) ON DELETE SET NULL,
  keyword TEXT NOT NULL,
  grid_size INTEGER NOT NULL DEFAULT 7, -- e.g. 7x7
  step_km DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  total_points INTEGER DEFAULT 0,
  successful_points INTEGER DEFAULT 0,
  failed_points INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_geo_grid_runs_org ON geo_grid_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_grid_runs_created ON geo_grid_runs(created_at);

ALTER TABLE geo_grid_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view geo_grid_runs of their organizations" ON geo_grid_runs
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage geo_grid_runs of their organizations" ON geo_grid_runs
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE TABLE IF NOT EXISTS geo_grid_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  geo_grid_run_id UUID NOT NULL REFERENCES geo_grid_runs(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES gmb_locations(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_geo_grid_points_run ON geo_grid_points(geo_grid_run_id);
CREATE INDEX IF NOT EXISTS idx_geo_grid_points_org ON geo_grid_points(organization_id);

ALTER TABLE geo_grid_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view geo_grid_points of their organizations" ON geo_grid_points
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage geo_grid_points of their organizations" ON geo_grid_points
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));


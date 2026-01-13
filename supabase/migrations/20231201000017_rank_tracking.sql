-- RightChoice-level: Keyword rank tracking + history

CREATE TABLE IF NOT EXISTS rank_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES gmb_locations(id) ON DELETE SET NULL,
  keyword TEXT NOT NULL,
  location_name TEXT, -- provider location name fallback (City,State,Country)
  language_code TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  is_scheduled BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_rank_keywords_updated_at
  BEFORE UPDATE ON rank_keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_rank_keywords_org ON rank_keywords(organization_id);
CREATE INDEX IF NOT EXISTS idx_rank_keywords_loc ON rank_keywords(gmb_location_id);

ALTER TABLE rank_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view rank_keywords of their organizations" ON rank_keywords
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage rank_keywords of their organizations" ON rank_keywords
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE TABLE IF NOT EXISTS rank_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL DEFAULT 'keyword', -- keyword, geo_grid
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  total_tasks INTEGER DEFAULT 0,
  successful_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rank_runs_org ON rank_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_rank_runs_created ON rank_runs(created_at);

ALTER TABLE rank_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view rank_runs of their organizations" ON rank_runs
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage rank_runs of their organizations" ON rank_runs
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE TABLE IF NOT EXISTS rank_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rank_run_id UUID REFERENCES rank_runs(id) ON DELETE SET NULL,
  rank_keyword_id UUID NOT NULL REFERENCES rank_keywords(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES gmb_locations(id) ON DELETE SET NULL,
  rank_position INTEGER, -- 1..N
  found_title TEXT,
  found_place_id TEXT,
  provider TEXT DEFAULT 'dataforseo',
  fetched_at TIMESTAMPTZ DEFAULT now(),
  raw JSONB
);

CREATE INDEX IF NOT EXISTS idx_rank_points_org ON rank_points(organization_id);
CREATE INDEX IF NOT EXISTS idx_rank_points_keyword ON rank_points(rank_keyword_id, fetched_at);
CREATE INDEX IF NOT EXISTS idx_rank_points_loc ON rank_points(gmb_location_id, fetched_at);

ALTER TABLE rank_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view rank_points of their organizations" ON rank_points
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage rank_points of their organizations" ON rank_points
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));


-- RightChoice-level GBP: Reviews dashboard extras (templates, auto-reply rules, QR codes)

CREATE TABLE IF NOT EXISTS gmb_review_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_text TEXT NOT NULL,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_gmb_review_templates_updated_at
  BEFORE UPDATE ON gmb_review_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_gmb_review_templates_org ON gmb_review_templates(organization_id);

ALTER TABLE gmb_review_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view gmb_review_templates of their organizations" ON gmb_review_templates
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage gmb_review_templates of their organizations" ON gmb_review_templates
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE TABLE IF NOT EXISTS gmb_review_auto_reply_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  min_rating INTEGER DEFAULT 1 CHECK (min_rating >= 1 AND min_rating <= 5),
  max_rating INTEGER DEFAULT 5 CHECK (max_rating >= 1 AND max_rating <= 5),
  only_unreplied BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT true,
  template_id UUID REFERENCES gmb_review_templates(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_gmb_review_auto_reply_rules_updated_at
  BEFORE UPDATE ON gmb_review_auto_reply_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_gmb_review_auto_reply_rules_org ON gmb_review_auto_reply_rules(organization_id);

ALTER TABLE gmb_review_auto_reply_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view gmb_review_auto_reply_rules of their organizations" ON gmb_review_auto_reply_rules
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage gmb_review_auto_reply_rules of their organizations" ON gmb_review_auto_reply_rules
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE TABLE IF NOT EXISTS gmb_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES gmb_locations(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  label TEXT,
  target_url TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gmb_qr_codes_org ON gmb_qr_codes(organization_id);

ALTER TABLE gmb_qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view gmb_qr_codes of their organizations" ON gmb_qr_codes
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage gmb_qr_codes of their organizations" ON gmb_qr_codes
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE TABLE IF NOT EXISTS gmb_qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID NOT NULL REFERENCES gmb_qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_gmb_qr_scans_qr ON gmb_qr_scans(qr_code_id);

ALTER TABLE gmb_qr_scans ENABLE ROW LEVEL SECURITY;
-- Read scans via org membership by joining to codes; writes happen via API route (service role).
CREATE POLICY "Users can view gmb_qr_scans of their organizations" ON gmb_qr_scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM gmb_qr_codes c
      WHERE c.id = gmb_qr_scans.qr_code_id
        AND is_organization_member(c.organization_id, auth.uid())
    )
  );


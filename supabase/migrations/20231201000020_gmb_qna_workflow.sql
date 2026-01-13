-- RightChoice-level GBP: Q&A capture workflow (fallback when API doesn't expose Q&A management)

CREATE TABLE IF NOT EXISTS gmb_qna_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID REFERENCES gmb_locations(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  customer_name TEXT,
  customer_contact TEXT,
  status TEXT DEFAULT 'open', -- open, answered, closed
  answer TEXT,
  answered_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_gmb_qna_requests_updated_at
  BEFORE UPDATE ON gmb_qna_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_gmb_qna_requests_org ON gmb_qna_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_qna_requests_status ON gmb_qna_requests(organization_id, status);

ALTER TABLE gmb_qna_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view gmb_qna_requests of their organizations" ON gmb_qna_requests
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage gmb_qna_requests of their organizations" ON gmb_qna_requests
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));


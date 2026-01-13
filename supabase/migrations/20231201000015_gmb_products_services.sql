-- RightChoice-level GBP: Products & Services (local management + bulk apply)

CREATE TABLE IF NOT EXISTS gmb_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  category TEXT,
  image_urls TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_gmb_products_updated_at
  BEFORE UPDATE ON gmb_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_gmb_products_org ON gmb_products(organization_id);

ALTER TABLE gmb_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view GMB products of their organizations" ON gmb_products
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage GMB products of their organizations" ON gmb_products
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE TABLE IF NOT EXISTS gmb_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_gmb_services_updated_at
  BEFORE UPDATE ON gmb_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_gmb_services_org ON gmb_services(organization_id);

ALTER TABLE gmb_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view GMB services of their organizations" ON gmb_services
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage GMB services of their organizations" ON gmb_services
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));

-- Assignment tables: which products/services are enabled for which locations
CREATE TABLE IF NOT EXISTS gmb_location_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID NOT NULL REFERENCES gmb_locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES gmb_products(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (gmb_location_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_gmb_location_products_org ON gmb_location_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_location_products_loc ON gmb_location_products(gmb_location_id);

ALTER TABLE gmb_location_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view gmb_location_products of their organizations" ON gmb_location_products
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage gmb_location_products of their organizations" ON gmb_location_products
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));

CREATE TABLE IF NOT EXISTS gmb_location_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gmb_location_id UUID NOT NULL REFERENCES gmb_locations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES gmb_services(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (gmb_location_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_gmb_location_services_org ON gmb_location_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_gmb_location_services_loc ON gmb_location_services(gmb_location_id);

ALTER TABLE gmb_location_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view gmb_location_services of their organizations" ON gmb_location_services
  FOR SELECT USING (is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Users can manage gmb_location_services of their organizations" ON gmb_location_services
  FOR ALL USING (is_organization_member(organization_id, auth.uid()));


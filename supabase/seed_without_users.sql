-- Insert sample data for development and testing
-- This version only creates data that doesn't require user references
-- Create users through the application first, then use the full seed.sql

-- Sample organization
INSERT INTO organizations (id, name, description, gstin, address, phone, email, website, subscription_tier, subscription_status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'TechCorp Solutions',
  'A technology solutions company',
  '29ABCDE1234F1Z5',
  '{"street": "123 Tech Street", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "country": "India"}',
  '+91-9876543210',
  'info@techcorp.com',
  'https://techcorp.com',
  'premium',
  'active'
);

-- Sample customers
INSERT INTO customers (id, organization_id, name, email, phone, address, gstin, tags, notes)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'ABC Enterprises',
    'contact@abcent.com',
    '+91-9876543211',
    '{"street": "456 Business Ave", "city": "Delhi", "state": "Delhi", "pincode": "110001", "country": "India"}',
    '07ABCDE1234F1Z5',
    ARRAY['vip', 'regular'],
    'Important client with high volume orders'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    'XYZ Industries',
    'info@xyzind.com',
    '+91-9876543212',
    '{"street": "789 Industrial Area", "city": "Bangalore", "state": "Karnataka", "pincode": "560001", "country": "India"}',
    '29ABCDE1234F1Z6',
    ARRAY['new', 'potential'],
    'New customer, potential for long-term partnership'
  );

-- Sample products
INSERT INTO products (id, organization_id, name, description, sku, price, cost, tax_rate, unit, is_active)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440000',
    'Web Development Service',
    'Custom web application development',
    'WEB-DEV-001',
    50000.00,
    30000.00,
    18.00,
    'project',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440000',
    'Mobile App Development',
    'iOS and Android app development',
    'MOB-APP-001',
    75000.00,
    45000.00,
    18.00,
    'project',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440000',
    'Consulting Hours',
    'Technical consulting and advisory',
    'CONS-001',
    2000.00,
    1000.00,
    18.00,
    'hour',
    true
  );

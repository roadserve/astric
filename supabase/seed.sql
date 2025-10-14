-- Insert sample data for development and testing
-- Note: You need to create a user first through the application, then update the created_by fields

-- Sample profile (you'll need to replace this with a real user ID from auth.users)
-- First, create a user through your app, then get their ID and update the references below

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

-- Sample invoice
INSERT INTO invoices (id, organization_id, customer_id, invoice_number, invoice_date, due_date, status, subtotal, tax_amount, discount_amount, total_amount, notes, terms, created_by)
VALUES (
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'INV-2024-001',
  '2024-01-15',
  '2024-02-15',
  'sent',
  125000.00,
  22500.00,
  0.00,
  147500.00,
  'Thank you for your business!',
  'Payment due within 30 days',
  '550e8400-e29b-41d4-a716-446655440100'
);

-- Sample invoice items
INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, tax_rate, discount_percent, line_total)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440010',
    'E-commerce Website Development',
    1.00,
    50000.00,
    18.00,
    0.00,
    50000.00
  ),
  (
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440011',
    'Mobile App for iOS and Android',
    1.00,
    75000.00,
    18.00,
    0.00,
    75000.00
  );

-- Sample employee
INSERT INTO employees (id, organization_id, employee_id, full_name, email, phone, address, department, position, hire_date, salary_type, base_salary, hourly_rate, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440000',
  'EMP001',
  'John Doe',
  'john.doe@techcorp.com',
  '+91-9876543213',
  '{"street": "123 Employee St", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "country": "India"}',
  'Engineering',
  'Senior Developer',
  '2023-01-15',
  'monthly',
  80000.00,
  null,
  true
);

-- Sample attendance
INSERT INTO attendance (id, employee_id, check_in_time, check_out_time, status, location, date)
VALUES (
  '550e8400-e29b-41d4-a716-446655440040',
  '550e8400-e29b-41d4-a716-446655440030',
  '2024-01-15 09:00:00+00',
  '2024-01-15 18:00:00+00',
  'present',
  '{"latitude": 19.0760, "longitude": 72.8777}',
  '2024-01-15'
);

-- Sample WhatsApp campaign
INSERT INTO whatsapp_campaigns (id, organization_id, name, template_name, message_content, variables, status, total_recipients, sent_count, delivered_count, read_count, created_by)
VALUES (
  '550e8400-e29b-41d4-a716-446655440050',
  '550e8400-e29b-41d4-a716-446655440000',
  'New Year Promotion',
  'promotion_template',
  'Happy New Year! Get 20% off on all our services. Contact us for more details.',
  '{"discount": "20%", "valid_until": "2024-02-29"}',
  'draft',
  2,
  0,
  0,
  0,
  '550e8400-e29b-41d4-a716-446655440100'
);

-- Sample campaign recipients
INSERT INTO campaign_recipients (id, campaign_id, customer_id, phone_number, status)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440051',
    '550e8400-e29b-41d4-a716-446655440050',
    '550e8400-e29b-41d4-a716-446655440001',
    '+919876543211',
    'pending'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440052',
    '550e8400-e29b-41d4-a716-446655440050',
    '550e8400-e29b-41d4-a716-446655440002',
    '+919876543212',
    'pending'
  );

-- Sample usage tracking
INSERT INTO usage_tracking (id, organization_id, feature, usage_count, usage_date, metadata)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440060',
    '550e8400-e29b-41d4-a716-446655440000',
    'invoices',
    5,
    '2024-01-15',
    '{"invoices_created": 5, "total_value": 500000}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440061',
    '550e8400-e29b-41d4-a716-446655440000',
    'whatsapp_messages',
    10,
    '2024-01-15',
    '{"messages_sent": 10, "delivery_rate": 0.9}'
  );

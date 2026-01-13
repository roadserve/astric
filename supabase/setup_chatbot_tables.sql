-- ============================================
-- Chatbot Tables Setup for Astric.ai
-- ============================================
-- This script ensures the workshop, price, and faq tables
-- are accessible to the public chatbot

-- ============================================
-- 1. Create tables if they don't exist
-- ============================================

-- Workshop table
CREATE TABLE IF NOT EXISTS workshop (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  name TEXT,
  description TEXT,
  price DECIMAL(10,2),
  duration TEXT,
  date TIMESTAMP,
  location TEXT,
  instructor TEXT,
  capacity INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Price/Pricing Plans table
CREATE TABLE IF NOT EXISTS price (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  plan_name TEXT,
  description TEXT,
  price DECIMAL(10,2),
  features TEXT,
  billing_period TEXT, -- 'monthly', 'yearly', etc.
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- FAQ table
CREATE TABLE IF NOT EXISTS faq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE workshop ENABLE ROW LEVEL SECURITY;
ALTER TABLE price ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Drop existing policies if they exist
-- ============================================

DROP POLICY IF EXISTS "Public can view workshops" ON workshop;
DROP POLICY IF EXISTS "Public can view pricing" ON price;
DROP POLICY IF EXISTS "Public can view FAQs" ON faq;

-- ============================================
-- 4. Create public read policies
-- ============================================

-- Allow public to view active workshops
CREATE POLICY "Public can view workshops"
ON workshop FOR SELECT
TO public
USING (
  status = 'active' OR status IS NULL
);

-- Allow public to view active pricing plans
CREATE POLICY "Public can view pricing"
ON price FOR SELECT
TO public
USING (
  is_active = true OR is_active IS NULL
);

-- Allow public to view published FAQs
CREATE POLICY "Public can view FAQs"
ON faq FOR SELECT
TO public
USING (
  is_published = true OR is_published IS NULL
);

-- ============================================
-- 5. Insert sample data (optional)
-- ============================================

-- Sample Workshops
INSERT INTO workshop (title, description, price, duration, date, location, status)
VALUES 
  ('Business Automation Fundamentals', 'Learn the basics of automating your business workflows with Astric.ai', 4999.00, '2 hours', NOW() + INTERVAL '7 days', 'Online', 'active'),
  ('Advanced Workflow Builder', 'Master the visual workflow builder and create complex automations', 7999.00, '3 hours', NOW() + INTERVAL '14 days', 'Online', 'active'),
  ('WhatsApp Business Integration', 'Set up and optimize WhatsApp Business API for customer engagement', 5999.00, '2.5 hours', NOW() + INTERVAL '21 days', 'Online', 'active'),
  ('AI-Powered CRM Strategies', 'Leverage AI to improve customer relationships and sales', 6999.00, '3 hours', NOW() + INTERVAL '30 days', 'Online', 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample Pricing Plans
INSERT INTO price (name, description, price, features, billing_period, is_popular, is_active, sort_order)
VALUES 
  ('Starter', 'Perfect for small businesses just getting started', 999.00, '• Up to 10 workflows\n• 1,000 executions/month\n• Email support\n• Basic integrations', 'monthly', false, true, 1),
  ('Professional', 'For growing businesses that need more power', 2999.00, '• Unlimited workflows\n• 10,000 executions/month\n• Priority support\n• All integrations\n• AI features\n• WhatsApp Business', 'monthly', true, true, 2),
  ('Enterprise', 'For large organizations with custom needs', 9999.00, '• Everything in Professional\n• Unlimited executions\n• Dedicated account manager\n• Custom integrations\n• SLA guarantee\n• On-premise deployment', 'monthly', false, true, 3),
  ('Yearly Professional', 'Save 20% with annual billing', 28990.00, '• All Professional features\n• 2 months free\n• Annual billing', 'yearly', false, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Sample FAQs
INSERT INTO faq (question, answer, category, is_published, sort_order)
VALUES 
  ('What is Astric.ai?', 'Astric.ai is an intelligent business automation platform that helps SMEs automate workflows, manage CRM, and scale operations effortlessly. With 60+ integrations and AI-powered tools, you can transform repetitive tasks into automated workflows in minutes—no coding required.', 'General', true, 1),
  ('Do I need coding knowledge to use Astric.ai?', 'No! Astric.ai features a visual drag-and-drop workflow builder. You can create powerful automations without writing a single line of code. However, for advanced users, we also support custom JavaScript expressions.', 'General', true, 2),
  ('What integrations does Astric.ai support?', 'We support 60+ integrations including WhatsApp Business, Email (SMTP), SMS (Twilio), AI (OpenAI, Claude, Gemini), databases (PostgreSQL, MySQL, MongoDB), CRMs (HubSpot, Salesforce), payment gateways (Stripe, Razorpay), and cloud storage (AWS S3, Google Drive).', 'Integrations', true, 3),
  ('How does pricing work?', 'We offer flexible pricing plans based on your needs. The Starter plan is ₹999/month for small businesses, Professional is ₹2,999/month for growing businesses, and Enterprise is ₹9,999/month for large organizations. All plans include a 14-day free trial.', 'Pricing', true, 4),
  ('Can I cancel my subscription anytime?', 'Yes! You can cancel your subscription at any time. There are no long-term commitments or cancellation fees. Your workflows will remain active until the end of your billing period.', 'Pricing', true, 5),
  ('What kind of support do you offer?', 'We offer email support for all plans, priority support for Professional and Enterprise plans, and a dedicated account manager for Enterprise customers. We also have comprehensive documentation, video tutorials, and a community forum.', 'Support', true, 6),
  ('Is my data secure?', 'Absolutely! We use bank-grade encryption (AES-256) for all data at rest and in transit. All credentials are encrypted separately. We implement Row Level Security (RLS) for multi-tenant data isolation and are GDPR compliant.', 'Security', true, 7),
  ('How do I get started?', 'Simply sign up for a free trial, connect your first integration, and use our pre-built templates or create a workflow from scratch. Our wizard will guide you through the setup process in just a few minutes.', 'Getting Started', true, 8),
  ('What is WhatsApp Business integration?', 'Our WhatsApp Business integration allows you to send automated messages, create chatbots, run marketing campaigns, and manage customer conversations directly through WhatsApp. You can send text, images, videos, documents, and interactive messages.', 'Integrations', true, 9),
  ('Can I try Astric.ai before purchasing?', 'Yes! We offer a 14-day free trial with full access to all features. No credit card required. You can explore the platform and build workflows before deciding on a paid plan.', 'Pricing', true, 10)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. Create indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_workshop_status ON workshop(status);
CREATE INDEX IF NOT EXISTS idx_workshop_date ON workshop(date);
CREATE INDEX IF NOT EXISTS idx_price_active ON price(is_active);
CREATE INDEX IF NOT EXISTS idx_price_sort_order ON price(sort_order);
CREATE INDEX IF NOT EXISTS idx_faq_published ON faq(is_published);
CREATE INDEX IF NOT EXISTS idx_faq_category ON faq(category);
CREATE INDEX IF NOT EXISTS idx_faq_sort_order ON faq(sort_order);

-- ============================================
-- SUCCESS!
-- ============================================

SELECT 'Chatbot tables setup complete! ✅' AS status;

-- View the data
SELECT 'Workshops:' AS section, COUNT(*) AS count FROM workshop;
SELECT 'Pricing Plans:' AS section, COUNT(*) AS count FROM price;
SELECT 'FAQs:' AS section, COUNT(*) AS count FROM faq;


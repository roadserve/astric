-- ============================================
-- FAQ Table - Insert 37 Records for MY FNG
-- ============================================

-- Create FAQ table if it doesn't exist
CREATE TABLE IF NOT EXISTS faq (
  id SERIAL PRIMARY KEY,
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  status INTEGER DEFAULT 1
);

-- Enable Row Level Security
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view FAQs" ON faq;

-- Create public read policy for chatbot
CREATE POLICY "Public can view FAQs"
ON faq FOR SELECT
TO public
USING (status = 1);

-- Clear existing data (optional - uncomment if you want to replace all data)
-- TRUNCATE TABLE faq RESTART IDENTITY CASCADE;

-- Insert 37 FAQ records
INSERT INTO faq (id, category, question, answer, created_at, status) VALUES
(1, 'General', 'What is MY FNG?', 'MY FNG is Mumbais most trusted multi-brand car service platform. We connect car owners with 50 A-grade workshops in Mumbai, Thane, Navi Mumbai, and Palghar.', '2025-11-11 00:00:00', 1),
(2, 'General', 'Why should I choose MY FNG instead of my local garage?', 'With MY FNG you get:

• Free pickup & drop
• OEM/OES genuine spare parts
• Photo/video proof
• 50-point checkup
• 1-month / 1,000 km warranty
• Same-day service

Local garages may not offer this level of transparency & guarantee.', '2025-11-11 00:00:00', 1),
(3, 'General', 'Do you provide doorstep service?', 'We provide free pickup & drop. Service is done at our partner workshops with proper equipment.', '2025-11-11 00:00:00', 1),
(4, 'General', 'How do I book service?', 'Just share your car details and preferred date. Well arrange a callback from our expert to confirm pickup.', '2025-11-11 00:00:00', 1),
(5, 'General', 'Can I get service today?', 'Yes, in most areas we provide same-day pickup & service.', '2025-11-11 00:00:00', 1),
(6, 'General', 'Is it safe to give my car to you?', 'Absolutely. Driver takes pre-inspection photos, you get updates throughout, and youre covered with warranty.', '2025-11-11 00:00:00', 1),
(7, 'Services', 'What services do you provide?', 'We provide:

- Regular car servicing (basic/standard/premium)
- Repairs (engine, brakes, clutch, AC, suspension)
- Cleaning & detailing
- Car scanning & diagnostics', '2025-11-11 00:00:00', 1),
(8, 'Services', 'Can you handle my car model?', 'Yes. We service all car models with expert mechanics.', '2025-11-11 00:00:00', 1),
(9, 'Services', 'Do you do repairs also?', 'Yes. From engine & clutch to AC, suspension, brakes – we handle all repairs with OEM/OES parts.', '2025-11-11 00:00:00', 1),
(10, 'Services', 'What service plans do you offer?', 'We have 3 plans – General, Premium, and Platinum:

• General: 30-point (engine oil, oil filter, brake service, tuning, top-ups)
• Premium: 50-point (General + AC filter, air filter, scanning, preventive maintenance, health report)
• Platinum: Full synthetic oil & premium add-ons.

Exact pricing depends on car model, shared by service expert.', '2025-11-11 00:00:00', 1),
(11, 'Services', 'CNG service available hai kya?', 'CNG service certified CNG fitment centers mein hoti hai. Hum aapko recommend/assist kar sakte hain.', '2025-11-11 00:00:00', 1),
(12, 'Services', 'System mein ek hi car hai, second car ka kya plan hai?', 'Sir, hum aapki second car ko system mein add kar dete hain aur uske packages ka PDF bhej dete hain.', '2025-11-11 00:00:00', 1),
(13, 'Repairs', 'My service is not due, but I have an issue in my car. Can you help?', 'Yes. MY FNG also handles custom repairs. Our partner workshop will pick up your car, inspect it, and share an estimate. If you dont go ahead, only Pickup/Drop/Inspection/Estimate charges apply: ₹999 (Hatchbacks/Sedans) or ₹1,299 (SUVs/MUVs).', '2025-11-11 00:00:00', 1),
(14, 'Repairs', 'What kind of car issues can you fix?', 'We handle all problems – clutch hard, brake noise, suspension, AC cooling, steering, vibration, starting issues, overheating, fuel average drop, window issues, etc.', '2025-11-11 00:00:00', 1),
(15, 'Repairs', 'Do you also do denting and painting?', 'Yes. Denting & painting starts from ₹3,500 per panel (solid color). Metallic, pearl, or SUV/MUV panels cost more. Final estimate after inspection.', '2025-11-11 00:00:00', 1),
(16, 'Repairs', 'What happens if I only want scanning or inspection?', 'We provide complete scanning & 50-point health reports. If only inspection is done, Pickup/Drop/Inspection charges apply (₹999 hatchbacks/sedans, ₹1,299 SUVs/MUVs).', '2025-11-11 00:00:00', 1),
(17, 'Repairs', 'Clutch plate ka cost aur labour charges kya hai?', 'Sir, cost car model pe depend karta hai. Aap model bataiye, hum parts & labour breakup bhej dete hain via expert call.', '2025-11-11 00:00:00', 1),
(18, 'Process', 'How does the service process work?', '1️⃣ Free pickup
2️⃣ Pre-inspection photos
3️⃣ Estimate approval
4️⃣ Service/repairs with proof
5️⃣ Car delivered back with warranty', '2025-11-11 00:00:00', 1),
(19, 'Process', 'How will I know what work is done?', 'Youll get photos & videos of all major work (oil change, parts replacement, washing, etc.).', '2025-11-11 00:00:00', 1),
(20, 'Process', 'How long does the service take?', 'Most cars are completed the same day. Major repairs may take longer.', '2025-11-11 00:00:00', 1),
(21, 'Trust & Warranty', 'Do you give warranty?', 'Yes, every service comes with a 1-month or 1,000 km warranty.', '2025-11-11 00:00:00', 1),
(22, 'Trust & Warranty', 'What if I face issues after service?', 'Dont worry – well resolve it under warranty.', '2025-11-11 00:00:00', 1),
(23, 'Trust & Warranty', 'How do I know parts are genuine?', 'We only use OEM/OES genuine parts – and share photo/video proof.', '2025-11-11 00:00:00', 1),
(24, 'Trust & Warranty', 'Authorized jaisa record milega kya?', 'Yes. Aapko proper GST invoice & digital record milta hai.', '2025-11-11 00:00:00', 1),
(25, 'Trust & Warranty', 'Aap spare parts ke sath chedchad karte ho?', 'Bilkul nahi sir. Aapko har kaam ka photo/video proof milta hai. Hum trust aur transparency ke liye known hain (Google rating 4.2).', '2025-11-11 00:00:00', 1),
(26, 'Trust & Warranty', 'Dent & paint pe warranty kya milta hai?', 'Dent & paint service pe 1-yr warranty hoti hai against paint chipping, peeling, or fading. We use top-grade materials.', '2025-11-11 00:00:00', 1),
(27, 'Objections', 'Mujhe address do, main kabhi aa jaunga.', 'Sir, hamare workshops strictly appointment-based hain & walk-in vehicles bina booking ke accept nahi hote. Aap slot batayein, hum confirm kar denge aur ek din pehle reminder bhejenge.', '2025-11-11 00:00:00', 1),
(28, 'Objections', 'Aapka price aur authorized ka price same hai, toh difference kya hai?', 'Even if price matches, MY FNG gives:

- Full transparency (photos/videos)
- Free pickup/drop
- Warranty (1 month/1,000 km)
- Same-day delivery
- Free mini service within 6 months (inspection & oil/consumables top-up)

Authorized/local workshops dont provide this.', '2025-11-11 00:00:00', 1),
(29, 'Objections', 'Workshop aapka khud ka hai ya tie-up hai?', 'Workshops humare tie-up partners hain, sab A-grade verified. Direct jaane se price same ya zyada hi hota hai. MY FNG aapko deta hai bulk-negotiated rates, free pickup/drop, real-time updates, warranty, transparency.', '2025-11-11 00:00:00', 1),
(30, 'Objections', 'Same rate mein dusra workshop de raha hai, toh aapse kyun karu?', 'Fair question. MY FNG gives transparency, photos/videos, real-time updates, warranty, and a free mini service within 6 months. Dusra workshop yeh sab nahi deta.', '2025-11-11 00:00:00', 1),
(31, 'Objections', 'Aapke package mein wheel alignment/balancing nahi hai.', 'Sir, wheel alignment/balancing har service mein mandatory nahi hota. Agar inspection mein zarurat lage toh hum add karte hain at nominal cost.', '2025-11-11 00:00:00', 1),
(32, 'Commercial', 'Yeh package mein GST included hai kya?', 'Yes. Package prices are inclusive of GST. Aapko proper GST invoice milega.', '2025-11-11 00:00:00', 1),
(33, 'Commercial', 'AMC package hai kya?', 'Yes. We have Annual Maintenance Contracts with multiple services, priority slots, and savings.', '2025-11-11 00:00:00', 1),
(34, 'Commercial', 'Do you have any offers?', 'Yes – We sometimes provide free car scanning or free Teflon coating with a 50-point report (on selected packages). Our service expert will confirm if any current offer is available.', '2025-11-11 00:00:00', 1),
(35, 'Fallback', 'Can you tell me the price?', 'Our service expert will share the exact pricing for your car model during the callback.', '2025-11-11 00:00:00', 1),
(36, 'Fallback', 'Can you share the workshop address?', 'Pickup & drop is free. Our service expert will confirm the workshop location when they call you.', '2025-11-11 00:00:00', 1),
(37, 'Fallback', 'Mere vehicle ke liye cost aur workshop details do.', 'Sir, aapki car model confirm karke hum nearest workshop & exact package price callback mein share karenge.', '2025-11-11 00:00:00', 1)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  created_at = EXCLUDED.created_at,
  status = EXCLUDED.status;

-- Reset sequence to continue from 38
SELECT setval('faq_id_seq', (SELECT MAX(id) FROM faq));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faq_category ON faq(category);
CREATE INDEX IF NOT EXISTS idx_faq_status ON faq(status);
CREATE INDEX IF NOT EXISTS idx_faq_question ON faq(question);
CREATE INDEX IF NOT EXISTS idx_faq_answer ON faq USING gin(to_tsvector('english', answer));

-- Verify the data
SELECT 
  'FAQ Table Setup Complete!' AS status,
  COUNT(*) AS total_records,
  COUNT(DISTINCT category) AS total_categories
FROM faq;

-- Show category breakdown
SELECT 
  category,
  COUNT(*) AS count
FROM faq
GROUP BY category
ORDER BY count DESC;

-- Show sample records
SELECT id, category, question 
FROM faq 
ORDER BY id 
LIMIT 10;

-- Final verification
SELECT '✅ All 37 FAQ records inserted successfully!' AS message;


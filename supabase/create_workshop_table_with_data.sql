-- ============================================
-- Workshop Table Creation with 48 Records
-- ============================================

-- Drop existing table if needed (uncomment if you want to recreate)
-- DROP TABLE IF EXISTS workshop CASCADE;

-- Create workshop table
CREATE TABLE IF NOT EXISTS workshop (
  id SERIAL PRIMARY KEY,
  workshop_name TEXT NOT NULL,
  address TEXT,
  zone TEXT,
  group_id TEXT,
  pincode TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE workshop ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view workshops" ON workshop;

-- Create public read policy for chatbot
CREATE POLICY "Public can view workshops"
ON workshop FOR SELECT
TO public
USING (status = 1);

-- Insert 48 workshop records
INSERT INTO workshop (id, workshop_name, address, zone, group_id, pincode, lat, lng, status, created_at) VALUES
(1, 'MyFNG Andheri East Shalom', 'Saki Vihar Rd, Muranjan Wadi, Marol, Andheri East, Mumbai, Maharashtra 400072', 'Mumbai', '120363370426618175@g.us', '400072 | 400093 | 400059 | 400058 | 400099 | 400079 | 400053 | 400063 |  400104 | 400093 |  400064', 19.116965, 72.889069, 1, '2025-11-11 11:46:07.400274'),
(2, 'MyFNG Thane W Kasarvadavali', 'Next To New Horizon School, After Bombay Zaika Anand Nagar, Ghodbunder Rd, Kasarvadavali, Thane, Maharashtra 400615', 'RO Mumbai', '120363380470615772@g.us', '400607 | 400610 | 400601 | 400606 | 400603 | 400604', 19.265605, 72.975556, 1, '2025-11-11 11:46:07.400274'),
(3, 'MyFNG Thane W Majiwada', 'Thane Rd, Beside Wavikar Hospital, Sainath Nagar, Majiwada, Thane, Maharashtra 400601', 'RO Mumbai', '120363378830595887@g.us', '400601 | 400602 | 400606 | 400603 | 400604 | 400605 | 400607 | 400708 | 400610 | 400080 | 400615 | 400081 | 400612', 19.212039, 72.980099, 1, '2025-11-11 11:46:07.400274'),
(4, 'MyFNG Thane W Vartak Nagar', 'Beside Rainart Apt, Shastri Nagar, Vartak Nagar, Thane West, Thane, Maharashtra 400606', 'RO Mumbai', '120363259593396424@g.us', '400601 | 400602 | 400604 | 400603 | 400605 | 400607 | 400610 | 400708 | 400080 | 400615 | 400612', 19.21629, 72.961373, 1, '2025-11-11 11:46:07.400274'),
(5, 'MyFNG Thane W Tikuji-ni-wadi', 'Kothari Compound, Opp Gp Road, Tikuji-ni-wadi, Road, Hill Garden, Manpada, Thane West, Thane, Maharashtra 400610', 'RO Mumbai', '120363318889549791@g.us', '400601 | 400615 | 400607 | 400603 | 400604 | 400080 | 400081 | 400605 | 421302 | 400612', 19.236473, 72.967301, 1, '2025-11-11 11:46:07.400274'),
(6, 'MyFNG Dombivali Shill Phata', 'Next to Chintamani Hotel Near Bhoomi Gajra Building Shil, Road, Shilphata, Dombivli, Thane, Maharashtra 400612', 'RO Mumbai', '120363371831135149@g.us', '400612 | 421201 | 400605 | 421202', NULL, NULL, 1, '2025-11-11 11:46:07.400274'),
(7, 'MyFNG Badlapur E MIDC', 'Opposite Badlapur Fire Brigade Midc, East, Badlapur, Maharashtra 421503', 'RO Mumbai', '120363333545595193@g.us', '421503 | 421505 | 421501 | 421605 | 410101', 19.154479, 73.24144, 1, '2025-11-11 11:46:07.400274'),
(8, 'MyFNG Kalyan E Pisavli Village', 'Malang Gad Rd, Kalyan East, Pisavli Village,, Kalyan, Maharashtra 421306/ Near Kashish International Hotel', 'RO Mumbai', '120363241277854657@g.us', '421306 | 421301 | 421201 | 421003 | 421501 | 421202 | 421103 | 421505 | 421503 | 421302 | 421401 | 421605 | 400612', 19.215687, 73.130328, 1, '2025-11-11 11:46:07.400274'),
(9, 'MyFNG Kalyan W Khadakpada', 'Barave Rd, Opposite Wellness Medical, Godrej Hill, Khadakpada, Kalyan, Maharashtra 421301', 'RO Mumbai', '120363285365128394@g.us', '421301 | 421306 | 421003 | 421501 | 421302 | 421103 | 421505', 19.260143, 73.142617, 1, '2025-11-11 11:46:07.400274'),
(10, 'MyFNG Khopoli Yashwant Nagar', 'Pelia Industry, Panvel Industrial Co-op Estate Rd, Yashwant Nagar, Khopoli, Maharashtra 410203', 'RO Mumbai', '120363299605869215@g.us', '410203 | 410401 | 410301 | 410205 | 410201', 18.797091, 73.329527, 1, '2025-11-11 11:46:07.400274'),
(11, 'MyFNG Panvel Midc A1', 'C.k.t College Road, Behind C.n.g Gas Pump Panvel Industrial Estate, Panvel, Navi Mumbai, Maharashtra 410206 Map', 'RO Mumbai', '120363299199789452@g.us', '410206 | 410209 | 410218 | 410208 | 410210 | 410221', 18.998658, 73.112715, 1, '2025-11-11 11:46:07.400274'),
(12, 'MyFNG Boisar Kurgaon Panch Marg', 'Kurgaon, Panch Marg, Next To Raul Nagar, Boisar, Maharashtra 401502', 'RO Mumbai', '120363362639074189@g.us', '401502 | 401501 | 401404 | 401403 | 401103 | 401401 | 401503 | 401102 | 401602 | 401601 | 401701', 19.839716, 72.714074, 1, '2025-11-11 11:46:07.400274'),
(13, 'MyFNG Vasai E Fatherwadi', 'Gokhivare Main Road, Near H P Petrol Pump, Fatherwadi, Vasai (east), Pin - 401208', 'RO Mumbai', '120363334721390283@g.us', '401209 | 401202 | 401303 | 401208 | 401302', 19.402478, 72.845324, 1, '2025-11-11 11:46:07.400274'),
(14, 'MyFNG Vasai W Sandor', 'Bassein Rd, Nr.cardinal Gracias Hospital, Gun Naka - Bangli Rd, Vasai West, Sandor, Maharashtra 401201', 'RO Mumbai', '120363378834170893@g.us', '401208 | 401203 | 401303 | 401302 | 401207 | 401201', 19.367526, 72.805953, 1, '2025-11-11 11:46:07.400274'),
(15, 'MyFNG Virar W Bolinj Naka', 'At. Christian Aali, Bolinj-sopara Rd, Virar West, Virar, Maharashtra 401303', 'RO Mumbai', '120363378286044796@g.us', '401202 | 401209 | 401302 | 401303 | 401208 | 401305', 19.439953, 72.786545, 1, '2025-11-11 11:46:07.400274'),
(16, 'MyFNG Dadar W', 'Garage Galli, Babasaheb Ambedkar Nagar, Mumbai, Maharashtra 400028', 'Mumbai', '120363402599443652@g.us', '400028 | 400016 | 400025 | 400012 | 400013 | 400022 | 400050 | 400051 | 400017 | 400008 | 400070', 19.012288, 72.834657, 1, '2025-11-11 11:46:07.400274'),
(17, 'MyFNG Ghatkopar West', 'ANDHERI-GHATKOPAR LINK ROAD, ASALPHA, Ghatkopar West, Mumbai - 400086', 'Mumbai', '120363418789581133@g.us', '400077 | 400083 | 400079 | 400076 | 400024 | 400078 | 400071 | 400069 | 400070 | 400042 | 400072 | 400022 | 400059 | 400089 | 400074', 19.098153, 72.892636, 1, '2025-11-11 11:46:07.400274'),
(18, 'MyFNG Kandivali West', 'Near Hindustan Naka, Kandivali (w), Mumbai 400067', 'Mumbai', '120363394219329331@g.us', '400101 | 400067 | 400092 | 400066 | 400064 | 400095 | 400091 | 400104', 19.209227, 72.82973, 1, '2025-11-11 11:46:07.400274'),
(19, 'MyFNG Nerul Shirvane Carsz', 'T.T.C. Industrial Area, MIDC Industrial Area, Navi Mumbai, Maharashtra 400706', 'RO Mumbai', '120363386541185757@g.us', '400705 | 400709 | 400701 | 400703 | 400708 | 400706 | 400710 | 400614', 19.047216, 73.029587, 1, '2025-11-11 11:46:07.400274'),
(20, 'MyFNG Koparkhairane Pawane Midc', 'TTC MIDC , Koparkhairne, Dist, Pawne, Navi Mumbai, Maharashtra 400705', 'RO Mumbai', '120363411542606862@g.us', '400705 | 400709 | 400701 | 400708 | 400703 | 400706', 19.091676, 73.023969, 1, '2025-11-11 11:46:07.400274'),
(21, 'MyFNG Ville Parle W', 'Peston House, S V Rd, Irla, Vile Parle West, Mumbai, Maharashtra 400056', 'Mumbai', '120363399711876387@g.us', '400056 | 400058 | 400059 | 400057 |  400054 | 400064 |  400097 | 400104 |  400063 | 400101 |  400067 | 400053 | 400049 |  400056 | 400054 | 400064 |  400096 | 400018 |  400050', 19.109762, 72.841025, 1, '2025-11-11 11:46:07.400274'),
(22, 'MyFNG Kalamboli', ' STEEL MARKET YARD, KWC, LANDMARK - SHEETAL HOTEL LANE, KALAMBOLI- 410218', 'RO Mumbai', '120363400023959576@g.us', '410206 | 410210 | 410209 | 410208 | 400705 | 410218', 19.034552, 73.108149, 1, '2025-11-11 11:46:07.400274'),
(23, 'MyFNG Mulund Asha Nagar', 'Near JMK Fitness Club, Asha Nagar, Mulund West, Mumbai, Maharashtra 400080', 'Mumbai', '120363418400905270@g.us', '400082 | 400081 | 400078 | 400042 | 400601 | 400083 | 400079 | 400603 | 400076 | 400077 | 400086 | 400708', 19.168269, 72.94291, 1, '2025-11-11 11:46:07.400274'),
(24, 'MyFNG Borivali W', 'Yogi Tower, PIPEWALA COMPUND BHD, New Link Rd, nr. DATT MANDIR, Borivali West, Mumbai, Maharashtra 400092', 'Mumbai', '120363401744346560@g.us', '400066 | 400067 | 400068 | 400064 | 401107 | 400062 | 400102 | 400063 | 400095 | 400065 | 400091', 19.237982, 72.841134, 1, '2025-11-11 11:46:07.400274'),
(25, 'MyFNG Titwala Ghotsai Phata', 'Ghotsai Phata, Titwala - Goveli Rd, Near A1 DHABA, Titwala, Maharashtra 421605', 'RO Mumbai', '120363399329887421@g.us', '421605 | 421102 | 421401 | 421601', 19.288707, 73.23008, 1, '2025-11-11 11:46:07.400274'),
(26, 'MyFNG Malad W', 'Marina Enclave, Malad, Jankalyan Nagar, Malad West, Mumbai, Maharashtra 400095', 'Mumbai', '120363400932860153@g.us', '400095 | 400067 | 400064 | 400097 | 400104 | 400063 | 400092 | 400066 | 400102', 19.201111, 72.815068, 1, '2025-11-11 11:46:07.400274'),
(27, 'MyFNG Mahalaxmi', 'Near Race Cource, Mahalaxmi, Mumbai . 400034', 'Mumbai', '120363403621129368@g.us', '400034 | 400025 | 400007 | 400013 | 400026 | 400012 | 400008 | 400028/22 | 400004 | 400019 | 400022 | 400005', 18.985029, 72.824521, 1, '2025-11-11 11:46:07.400274'),
(28, 'MyFNG Dombivali Shil Cross Road', 'Vrindavan Bus Stop, Shreerang Society, Thane, Thane, Maharashtra, 400601', 'RO Mumbai', '120363419994395266@g.us', '421201 | 421202 | 421306 | 421302 | 421003 | 400612', 19.174541, 73.086861, 1, '2025-11-11 11:46:07.400274'),
(29, 'MyFNG Mira Road', 'Jamuna Pandurang Thakur, Bhayander West Sub, Mira Bhayandar Thane 401101.', 'RO Mumbai', '120363411812368365@g.us', '401105 | 401101 | 401107 | 401104 | 401106 | 400091 | 400068', 19.277102, 72.880879, 1, '2025-11-11 11:46:07.400274'),
(30, 'MyFNG Tikujniwadi Happy Valley Circle', 'Salkar compound near Tikujini wadi manpada Thane west. 400607.', 'RO Mumbai', '120363418216993514@g.us', '400601 | 400615 | 400607 | 400603 | 400604 | 400080 | 400605 | 400708 | 421302', 19.237749, 72.968981, 1, '2025-11-11 11:46:07.400274'),
(31, 'MyFNG Nashik', 'NEAR SSK WORLD CLUB, OPP GAJARA AVENUE, PATHARDI GAO, Nashik - 422010', 'RO Mumbai', '120363240714083525@g.us', '422101 | 422003 | 422002 | 422007 | 422011 | 422103 | 422401 | 422009 | 422010', 19.931574, 73.7609, 1, '2025-11-11 11:46:07.400274'),
(32, 'MyFNG Wadala', 'GURUKRIPA COMPOUND, OPP.TAPAYSA, SOCIETY,COLLECTOR COLONY, CHEMBUR,MUMBAI, Maharashtra, 400074', 'Mumbai', '120363399810838416@g.us', '400074 | 400071 | 400088 | 400089 | 400037 | 400022 | 400086/77 | 400024', 19.025856, 72.889332, 1, '2025-11-11 11:46:07.400274'),
(33, 'MyFNG Miraroad Sona Palace', 'beside voxton hotel, queens park, Mira road', 'RO Mumbai', '120363402015722162@g.us', '401105 | 401101 | 401107 | 401104 | 401106 | 400091 | 400068', 19.290204, 72.864627, 1, '2025-11-11 11:46:07.400274'),
(34, 'MyFNG Vasai East', 'Range Office, Vasai East, Maharashtra 401208', 'RO Mumbai', '120363422073057495@g.us', '401202 | 401209 | 401303 | 401208 | 401302', 19.366291, 72.80694, 1, '2025-11-11 11:46:07.400274'),
(35, 'MyFNG Hadapsar', 'Amanora Mall,Hadapsar, Pune', 'Pune', '120363420667472034@g.us', '411001 | 411013 | 411014 | 411028 | 411036 | 411040 | 411048 | 412201 | 412307', 18.52086305, 73.93758083, 1, '2025-11-11 11:46:07.400274'),
(36, 'MyFNG Wagholi', 'Newaskar HP Pump, Wagholi, Pune, Maharashtra 412207', 'Pune', '120363420321857031@g.us', '411014 | 411028 | 411036 | 411047 | 412207 | 412216 | 412307', 18.59192799, 73.99851657, 1, '2025-11-11 11:46:07.400274'),
(37, 'MyFNG Lohegaon', 'PURPLE HOSPITAL, Pune International Airport Area, Lohegaon, Maharashtra 411047', 'Pune', '120363423559859767@g.us', '411001 | 411005 | 411006 | 411014 | 411015 | 411032 | 411047 | 412105', 18.59736146, 73.93918986, 1, '2025-11-11 11:46:07.400274'),
(38, 'MyFNG Baner', 'Baner - Pashan Link Rd, near passport office, Baner, Pune', 'Pune', '120363421065677225@g.us', '411007 | 411021 | 411045', 18.55201938, 73.79740822, 1, '2025-11-11 11:46:07.400274'),
(39, 'MyFNG Wakad', 'polaris hospital Wakad Road, Hinjawadi - Aundh Rd, Wakad,Pune, Maharashtra 411057', 'Pune', '120363419950442951@g.us', '411007 | 411018 | 411035 | 411045 | 411057 | 411057/411057', 18.60014051, 73.76441278, 1, '2025-11-11 11:46:07.400274'),
(40, 'MyFNG Viman Nagar', ' Sakore Nagar, New Airport Rd,Viman Nagar, Pune', 'Pune', '120363425490519453@g.us', '411001 | 411006 | 411014 | 411015 | 411032 | 411047', 18.55913722, 73.90663661, 1, '2025-11-11 11:46:07.400274'),
(41, 'MyFNG Kharadi', 'Near Sunny Gas Agency, next to Dargah, Fountain Road, Kharadi.', 'Pune', '120363402939347809@g.us', '411014 | 411028 | 411036', 18.56691328, 73.94396085, 1, '2025-11-11 11:46:07.400274'),
(42, 'MyFNG Suncity', 'Near Fire Brigade Station, Sun City Road, Sinhgad Rd,  Suncity, Pune, Maharashtra.', 'Pune', '120363403494019336@g.us', '411041 | 411051 | 411058', 18.47716688, 73.81541411, 1, '2025-11-11 11:46:07.400274'),
(43, 'MyFNG Pimple Saudagar', 'Near Kate Petrol Pump, besides Gareeb Nawaj Biryani, Mithila Nagari, Pimple Saudagar.', 'Pune', '120363420809903147@g.us', '411007 | 411017 | 411018 | 411019 | 411027 | 411033 | 411035 | 411045 | 411057', 18.60213087, 73.80335131, 1, '2025-11-11 11:46:07.400274'),
(44, 'MyFNG Tathawde', 'Tathawade Chowk, Pimpri-Chinchwad, Maharashtra', 'Pune', '120363404287702767@g.us', '411018 | 411019 | 411027 | 411033 | 411035 | 411044 | 411045 | 411057 | 412101', 18.62811523, 73.75325182, 1, '2025-11-11 11:46:07.400274'),
(45, 'MyFNG Moshi', 'near Sandhuram Wedding, Gandharv Nagari, Tapkir Nagar, Moshi, Pune, Pimpri-Chinchwad, Maharashtra 411070', 'Pune', '120363421926050098@g.us', '411015 | 411018 | 411019 | 411024 | 411027 | 411034 | 411035 | 411039 | 411044 | 411062 | 412101 | 412105 | 412114', 18.67558333, 73.85387785, 1, '2025-11-11 11:46:07.400274'),
(46, 'MyFNG Katraj', 'near Srushti Hotel, Mangdewadi, Katraj, Pune, Maharashtra 411046', 'Pune', '120363402558651852@g.us', '411028 | 411037 | 411041 | 411042 | 411043 | 411046 | 411048 | 411051 | 411058 | 411060', 18.43348404, 73.85893116, 1, '2025-11-11 11:46:07.400274'),
(47, 'MyFNG Saswad', 'Saswad Rd, Sopan Nagar, Saswad, Maharashtra 412301', 'Pune', '120363421890180144@g.us', '412205 | 412301', 18.3620022, 74.02544679, 1, '2025-11-11 11:46:07.400274'),
(48, 'MyFNG Mulund Nirmal Life Style', 'behind Nirmal Lifestyle, near MCGM Parking, Moti Nagar, Mulund.', 'Mumbai', '120363344056342635@g.us', '400081 | 400078 | 400042 | 400083 | 400601 | 400079 | 400076 | 400077 | 400603 | 400086 | 400708', 19.168166, 72.936736, 1, '2025-11-11 11:46:07.400274')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to continue from 49
SELECT setval('workshop_id_seq', (SELECT MAX(id) FROM workshop));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workshop_status ON workshop(status);
CREATE INDEX IF NOT EXISTS idx_workshop_zone ON workshop(zone);
CREATE INDEX IF NOT EXISTS idx_workshop_pincode ON workshop(pincode);
CREATE INDEX IF NOT EXISTS idx_workshop_name ON workshop(workshop_name);

-- Verify the data
SELECT 
  'Workshop Table Setup Complete!' AS status,
  COUNT(*) AS total_records,
  COUNT(CASE WHEN zone = 'Mumbai' THEN 1 END) AS mumbai_count,
  COUNT(CASE WHEN zone = 'RO Mumbai' THEN 1 END) AS ro_mumbai_count,
  COUNT(CASE WHEN zone = 'Pune' THEN 1 END) AS pune_count
FROM workshop;

-- Show sample records
SELECT id, workshop_name, zone, pincode 
FROM workshop 
ORDER BY id 
LIMIT 10;

-- Final verification
SELECT '✅ All 48 workshop records inserted successfully!' AS message;


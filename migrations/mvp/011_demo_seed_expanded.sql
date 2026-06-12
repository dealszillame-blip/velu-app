-- Velu MVP — expanded demo seed (listings only, SQL-only fallback)
-- For full demo (users + proposals): run `npm run seed:demo` instead.
-- Safe to re-run: uses domain_listing_id as natural key via upsert RPC.

SELECT public.upsert_domain_land_listing('DEMO-001', '42 Banksia St', 'Ingleburn', '2565', 595000, '$595,000', 450, 15.5, 'R2', 150.8629, -34.0019, 'available');
SELECT public.upsert_domain_land_listing('DEMO-002', '18 Macarthur Blvd', 'Campbelltown', '2560', 720000, '$720,000', 520, 18, 'R2', 150.8139, -34.0669, 'available');
SELECT public.upsert_domain_land_listing('DEMO-003', '12 Kurrajong Ave', 'Campbelltown', '2560', 685000, '$685,000', 420, 14, 'R2', 150.8082, -34.0621, 'available');
SELECT public.upsert_domain_land_listing('DEMO-004', '55 Pemberton St', 'Minto', '2566', 520000, '$520,000', 380, 12.5, 'R2', 150.8447, -34.0278, 'available');
SELECT public.upsert_domain_land_listing('DEMO-005', '3 Oran Park Dr', 'Oran Park', '2570', 890000, '$890,000', 650, 20, 'R3', 150.74, -34.005, 'available');
SELECT public.upsert_domain_land_listing('DEMO-006', '28 Narellan Rd', 'Narellan', '2567', 745000, '$745,000', 510, 16.5, 'R2', 150.7408, -34.0478, 'available');
SELECT public.upsert_domain_land_listing('DEMO-007', '14 River Rd', 'Liverpool', '2170', 610000, '$610,000', 445, 15, 'R3', 150.9256, -33.9249, 'available');
SELECT public.upsert_domain_land_listing('DEMO-008', '9 Gregory Hills Dr', 'Gregory Hills', '2557', 795000, '$795,000', 560, 17, 'R2', 150.7689, -34.0211, 'available');
SELECT public.upsert_domain_land_listing('DEMO-009', '31 Camden Valley Way', 'Camden', '2570', 550000, '$550,000', 400, 13, 'RU4', 150.6969, -34.0544, 'available');
SELECT public.upsert_domain_land_listing('DEMO-010', '6 Eucalyptus Cl', 'Ingleburn', '2565', 575000, '$575,000', 435, 14.5, 'R2', 150.858, -34.008, 'available');
SELECT public.upsert_domain_land_listing('DEMO-011', '22 Rose St', 'Campbelltown', '2560', 640000, '$640,000', 465, 15, 'R2', 150.8175, -34.0695, 'under_offer');
SELECT public.upsert_domain_land_listing('DEMO-012', '8 Banksia Cres', 'Leumeah', '2560', 595000, '$595,000', 420, 14, 'R3', 150.832, -34.0485, 'under_offer');
SELECT public.upsert_domain_land_listing('DEMO-013', '7 Wattle Grove', 'Leumeah', '2560', 680000, '$680,000', 480, 16, 'R3', 150.8295, -34.0512, 'sold', NOW() - INTERVAL '2 days');
SELECT public.upsert_domain_land_listing('DEMO-014', '45 Badgally Rd', 'Campbelltown', '2560', 710000, '$710,000', 495, 16.5, 'R3', 150.821, -34.071, 'sold', NOW() - INTERVAL '5 days');
SELECT public.upsert_domain_land_listing('DEMO-015', '16 Appin Rd', 'Minto', '2566', 530000, '$530,000', 390, 12, 'R2', 150.849, -34.031, 'sold', NOW() - INTERVAL '8 days');

-- Link sold Leumeah lot to first registered buyer (if any)
UPDATE public.land_listings
SET buyer_id = (SELECT id FROM public.profiles WHERE role = 'buyer' ORDER BY created_at LIMIT 1)
WHERE domain_listing_id = 'DEMO-013'
  AND buyer_id IS NULL;

-- Onboard all registered builders for lead matching
UPDATE public.builder_profiles bp
SET
  anchor_address = COALESCE(bp.anchor_address, 'Campbelltown NSW 2560'),
  anchor_geom = COALESCE(bp.anchor_geom, ST_GeogFromText('POINT(150.8139 -34.0669)')),
  is_onboarded = TRUE,
  onboarding_status = 'onboarded'
WHERE EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = bp.id AND p.role = 'builder');

-- Velu MVP — builder leads test data
-- Run in Supabase SQL Editor after migrations 008–009.
-- Safe to re-run (uses domain_listing_id keys).

-- 6 sold lots across SW Sydney (builder leads feed source)
SELECT public.upsert_domain_land_listing('DEMO-013', '7 Wattle Grove', 'Leumeah', '2560', 680000, '$680,000', 480, 16, 'R3', 150.8295, -34.0512, 'sold', NOW() - INTERVAL '2 days');
SELECT public.upsert_domain_land_listing('DEMO-014', '45 Badgally Rd', 'Campbelltown', '2560', 710000, '$710,000', 495, 16.5, 'R3', 150.821, -34.071, 'sold', NOW() - INTERVAL '5 days');
SELECT public.upsert_domain_land_listing('DEMO-015', '16 Appin Rd', 'Minto', '2566', 530000, '$530,000', 390, 12, 'R2', 150.849, -34.031, 'sold', NOW() - INTERVAL '8 days');
SELECT public.upsert_domain_land_listing('DEMO-016', '2 Waratah St', 'Ingleburn', '2565', 565000, '$565,000', 410, 14, 'R2', 150.865, -34.004, 'sold', NOW() - INTERVAL '1 day');
SELECT public.upsert_domain_land_listing('DEMO-017', '11 Moore St', 'Liverpool', '2170', 625000, '$625,000', 460, 15.5, 'R3', 150.928, -33.928, 'sold', NOW() - INTERVAL '4 days');
SELECT public.upsert_domain_land_listing('DEMO-018', '4 Gledswood Hills Dr', 'Gregory Hills', '2557', 780000, '$780,000', 540, 17.5, 'R2', 150.772, -34.018, 'sold', NOW() - INTERVAL '6 days');

-- Link primary sold lot to first buyer (core demo loop)
UPDATE public.land_listings
SET buyer_id = (SELECT id FROM public.profiles WHERE role = 'buyer' ORDER BY created_at LIMIT 1)
WHERE domain_listing_id = 'DEMO-013'
  AND buyer_id IS NULL;

-- Ensure all builders are onboarded with a Campbelltown anchor (25 km radius)
UPDATE public.builder_profiles bp
SET
  anchor_address = COALESCE(bp.anchor_address, 'Campbelltown NSW 2560'),
  anchor_geom = COALESCE(bp.anchor_geom, ST_GeogFromText('POINT(150.8139 -34.0669)')),
  service_radius_km = GREATEST(bp.service_radius_km, 30),
  is_onboarded = TRUE,
  onboarding_status = 'onboarded',
  onboarded_at = COALESCE(bp.onboarded_at, NOW())
WHERE EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = bp.id AND p.role = 'builder');

-- Sample lead notifications for onboarded builders (first sold lot)
INSERT INTO public.notifications (recipient_id, type, title, body, metadata)
SELECT
  p.id,
  'new_lead'::notification_type,
  'New land sold nearby',
  '480m² in Leumeah 2560 just sold. Submit your proposal now.',
  jsonb_build_object(
    'listing_id', ll.id,
    'suburb', ll.suburb,
    'postcode', ll.postcode,
    'demo', true
  )
FROM public.profiles p
CROSS JOIN public.land_listings ll
WHERE p.role = 'builder'
  AND ll.domain_listing_id = 'DEMO-013'
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.recipient_id = p.id
      AND n.type = 'new_lead'
      AND n.metadata->>'listing_id' = ll.id::text
  );

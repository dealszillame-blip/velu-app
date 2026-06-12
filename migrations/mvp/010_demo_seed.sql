-- Velu MVP — demo seed data (run AFTER creating auth users via register flow)
-- Creates sample listings for map demo and one sold listing for the core loop test.
-- Safe to re-run: uses fixed addresses as natural keys.

-- Sample available listings (no agent required — source = domain-style demo)
INSERT INTO public.land_listings (
  address, suburb, postcode, price, land_size_sqm, frontage_meters, zoning,
  geom, status, source, listing_category
)
SELECT
  '42 Banksia St', 'Ingleburn', '2565', 595000, 450, 15.5, 'R2',
  ST_GeogFromText('POINT(150.8629 -34.0019)'), 'available', 'domain', 'vacant_land'
WHERE NOT EXISTS (
  SELECT 1 FROM public.land_listings WHERE address = '42 Banksia St' AND suburb = 'Ingleburn'
);

INSERT INTO public.land_listings (
  address, suburb, postcode, price, land_size_sqm, frontage_meters, zoning,
  geom, status, source, listing_category
)
SELECT
  '18 Macarthur Blvd', 'Campbelltown', '2560', 720000, 520, 18, 'R2',
  ST_GeogFromText('POINT(150.8139 -34.0669)'), 'available', 'domain', 'vacant_land'
WHERE NOT EXISTS (
  SELECT 1 FROM public.land_listings WHERE address = '18 Macarthur Blvd' AND suburb = 'Campbelltown'
);

INSERT INTO public.land_listings (
  address, suburb, postcode, price, land_size_sqm, frontage_meters, zoning,
  geom, status, source, listing_category, buyer_id, sold_at
)
SELECT
  '7 Wattle Grove', 'Leumeah', '2560', 680000, 480, 16, 'R3',
  ST_GeogFromText('POINT(150.8295 -34.0512)'), 'sold', 'domain', 'vacant_land',
  (SELECT id FROM public.profiles WHERE role = 'buyer' ORDER BY created_at LIMIT 1),
  NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (
  SELECT 1 FROM public.land_listings WHERE address = '7 Wattle Grove' AND suburb = 'Leumeah'
);

-- Ensure registered builders have anchor points for lead matching (SW Sydney)
UPDATE public.builder_profiles bp
SET
  anchor_address = COALESCE(bp.anchor_address, 'Campbelltown NSW 2560'),
  anchor_geom = COALESCE(
    bp.anchor_geom,
    ST_GeogFromText('POINT(150.8139 -34.0669)')
  ),
  is_onboarded = TRUE,
  onboarding_status = 'onboarded'
WHERE EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = bp.id AND p.role = 'builder'
);

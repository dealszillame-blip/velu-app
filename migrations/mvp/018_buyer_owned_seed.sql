-- Velu MVP — demo buyers with registered (buyer-owned) land
-- Run after 015_buyer_owned_land.sql and demo users exist (npm run seed:demo creates users).

DO $$
DECLARE
  v_buyer1 UUID;
  v_buyer2 UUID;
  v_builder2 UUID;
  v_builder3 UUID;
  v_listing UUID;
BEGIN
  SELECT id INTO v_buyer1 FROM auth.users WHERE email = 'demo.buyer@velu.dev' LIMIT 1;
  SELECT id INTO v_buyer2 FROM auth.users WHERE email = 'demo.buyer2@velu.dev' LIMIT 1;
  SELECT id INTO v_builder2 FROM auth.users WHERE email = 'demo.builder2@velu.dev' LIMIT 1;
  SELECT id INTO v_builder3 FROM auth.users WHERE email = 'demo.builder3@velu.dev' LIMIT 1;

  IF v_buyer1 IS NULL OR v_buyer2 IS NULL THEN
    RAISE NOTICE 'Demo buyers not found — run: npm run seed:demo';
    RETURN;
  END IF;

  DELETE FROM public.land_listings
  WHERE source = 'buyer_owned'
    AND buyer_id IN (v_buyer1, v_buyer2);

  -- Alex Morgan — Mount Annan
  v_listing := public.create_buyer_owned_listing(
    v_buyer1,
    '14 Banksia Cres',
    'Mount Annan',
    '2567',
    435,
    14,
    'R2',
    150.7642,
    -34.0581,
    685000
  );
  UPDATE public.land_listings
  SET sold_at = NOW() - INTERVAL '12 days',
      created_at = NOW() - INTERVAL '12 days'
  WHERE id = v_listing;

  -- Sam Chen — Oran Park
  v_listing := public.create_buyer_owned_listing(
    v_buyer2,
    '8 Figtree Blvd',
    'Oran Park',
    '2570',
    520,
    16,
    'R2',
    150.7408,
    -34.0012,
    745000
  );
  UPDATE public.land_listings
  SET sold_at = NOW() - INTERVAL '5 days',
      created_at = NOW() - INTERVAL '5 days'
  WHERE id = v_listing;

  -- Sam Chen — Gledswood Hills (second block)
  v_listing := public.create_buyer_owned_listing(
    v_buyer2,
    '2 Acacia Dr',
    'Gledswood Hills',
    '2557',
    400,
    12.5,
    'R2',
    150.7685,
    -34.0198,
    620000
  );
  UPDATE public.land_listings
  SET sold_at = NOW() - INTERVAL '18 days',
      created_at = NOW() - INTERVAL '18 days'
  WHERE id = v_listing;

  -- Sample proposals on buyer-owned land
  IF v_builder3 IS NOT NULL THEN
    INSERT INTO public.builder_proposals (
      builder_id,
      land_listing_id,
      buyer_id,
      package_name,
      base_price,
      estimated_build_weeks,
      inclusions,
      notes,
      status
    )
    SELECT
      v_builder3,
      ll.id,
      v_buyer1,
      'Annandale 4-Bed',
      478000,
      27,
      'Stone benchtops, ducted AC, driveway allowance',
      'Designed for R2 lots 400–450m² in Mount Annan.',
      'pending'
    FROM public.land_listings ll
    WHERE ll.buyer_id = v_buyer1
      AND ll.address = '14 Banksia Cres'
      AND ll.source = 'buyer_owned'
    ON CONFLICT (builder_id, land_listing_id) DO UPDATE SET
      package_name = EXCLUDED.package_name,
      base_price = EXCLUDED.base_price,
      status = EXCLUDED.status;
  END IF;

  IF v_builder2 IS NOT NULL THEN
    INSERT INTO public.builder_proposals (
      builder_id,
      land_listing_id,
      buyer_id,
      package_name,
      base_price,
      estimated_build_weeks,
      inclusions,
      notes,
      status,
      viewed_at
    )
    SELECT
      v_builder2,
      ll.id,
      v_buyer2,
      'Oran Park Family 5',
      525000,
      31,
      'Alfresco, double garage, premium fixtures',
      'Includes fixed site costs for Oran Park estates.',
      'viewed',
      NOW()
    FROM public.land_listings ll
    WHERE ll.buyer_id = v_buyer2
      AND ll.address = '8 Figtree Blvd'
      AND ll.source = 'buyer_owned'
    ON CONFLICT (builder_id, land_listing_id) DO UPDATE SET
      package_name = EXCLUDED.package_name,
      base_price = EXCLUDED.base_price,
      status = EXCLUDED.status,
      viewed_at = EXCLUDED.viewed_at;
  END IF;

  RAISE NOTICE 'Seeded 3 buyer-owned land parcels for demo buyers.';
END $$;

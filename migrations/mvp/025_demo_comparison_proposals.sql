-- Demonstration proposals so the buyer compare dashboard has 3 packages to rank.

DO $$
DECLARE
  v_buyer1 UUID;
  v_buyer2 UUID;
  v_builder1 UUID;
  v_builder2 UUID;
  v_builder3 UUID;
  v_listing_sam UUID;
  v_listing_alex UUID;
BEGIN
  SELECT id INTO v_buyer1 FROM auth.users WHERE email = 'demo.buyer@velu.dev' LIMIT 1;
  SELECT id INTO v_buyer2 FROM auth.users WHERE email = 'demo.buyer2@velu.dev' LIMIT 1;
  SELECT id INTO v_builder1 FROM auth.users WHERE email = 'demo.builder@velu.dev' LIMIT 1;
  SELECT id INTO v_builder2 FROM auth.users WHERE email = 'demo.builder2@velu.dev' LIMIT 1;
  SELECT id INTO v_builder3 FROM auth.users WHERE email = 'demo.builder3@velu.dev' LIMIT 1;

  SELECT id INTO v_listing_sam
  FROM public.land_listings
  WHERE buyer_id = v_buyer2 AND address = '8 Figtree Blvd' AND source = 'buyer_owned'
  LIMIT 1;

  SELECT id INTO v_listing_alex
  FROM public.land_listings
  WHERE buyer_id = v_buyer1 AND address = '14 Banksia Cres' AND source = 'buyer_owned'
  LIMIT 1;

  IF v_listing_sam IS NULL AND v_buyer2 IS NOT NULL THEN
    SELECT id INTO v_listing_sam
    FROM public.land_listings
    WHERE buyer_id = v_buyer2
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Enrich the existing Oran Park Family 5 package
  IF v_builder2 IS NOT NULL AND v_listing_sam IS NOT NULL THEN
    UPDATE public.builder_proposals
    SET
      home_specs = '{"bedrooms":5,"bathrooms":2.5,"car_spaces":2,"living_area_sqm":228,"storeys":1}'::jsonb,
      price_breakdown = '[
        {"category":"site","label":"Site costs & connections","amount":45000},
        {"category":"base","label":"Base build to lock-up","amount":286000},
        {"category":"kitchen","label":"Kitchen package","amount":30000},
        {"category":"bathroom","label":"Bathroom package","amount":28000},
        {"category":"electrical","label":"Electrical & fixtures","amount":24000},
        {"category":"external","label":"Alfresco + garage","amount":72000},
        {"category":"contingency","label":"Contingency allowance","amount":40000}
      ]'::jsonb,
      inclusion_items = '[
        {"category":"external","item":"Alfresco","detail":"Tiled outdoor living","included":true},
        {"category":"external","item":"Double garage","detail":"Remote doors","included":true},
        {"category":"kitchen","item":"Premium fixtures","detail":"Mixer taps and stone-look laminate","included":true}
      ]'::jsonb
    WHERE builder_id = v_builder2 AND land_listing_id = v_listing_sam;
  END IF;

  -- Apex: cheaper single + granny studio
  IF v_builder1 IS NOT NULL AND v_listing_sam IS NOT NULL AND v_buyer2 IS NOT NULL THEN
    INSERT INTO public.builder_proposals (
      builder_id, land_listing_id, buyer_id, package_name, base_price,
      estimated_build_weeks, inclusions, notes, status,
      home_specs, price_breakdown, inclusion_items
    ) VALUES (
      v_builder1, v_listing_sam, v_buyer2,
      'Oran Park Single + Studio', 498000, 28,
      'Granny-flat studio, stone benchtops, ducted AC, double garage, 10-year warranty',
      'Demonstration package. Ground-floor living with a rear granny-flat studio.',
      'pending',
      '{"bedrooms":4,"bathrooms":3,"car_spaces":2,"living_area_sqm":198,"storeys":1}'::jsonb,
      '[{"category":"site","label":"Site costs & connections","amount":42000},{"category":"base","label":"Base build to lock-up","amount":268000},{"category":"kitchen","label":"Kitchen package","amount":28000},{"category":"bathroom","label":"Bathroom + ensuite","amount":32000},{"category":"electrical","label":"Electrical & ducted AC","amount":26000},{"category":"external","label":"Granny flat studio fit-out","amount":62000},{"category":"driveway","label":"Driveway & paths","amount":18000},{"category":"contingency","label":"Contingency allowance","amount":22000}]'::jsonb,
      '[{"category":"kitchen","item":"Stone benchtops","detail":"40mm engineered stone","included":true},{"category":"electrical","item":"Ducted air conditioning","detail":"2 zones","included":true},{"category":"external","item":"Granny flat / studio","detail":"Self-contained rear studio","included":true},{"category":"external","item":"Double garage","detail":"Remote doors","included":true},{"category":"warranty","item":"Structural warranty","detail":"10 years","included":true}]'::jsonb
    )
    ON CONFLICT (builder_id, land_listing_id) DO UPDATE SET
      package_name = EXCLUDED.package_name,
      base_price = EXCLUDED.base_price,
      estimated_build_weeks = EXCLUDED.estimated_build_weeks,
      inclusions = EXCLUDED.inclusions,
      notes = EXCLUDED.notes,
      home_specs = EXCLUDED.home_specs,
      price_breakdown = EXCLUDED.price_breakdown,
      inclusion_items = EXCLUDED.inclusion_items,
      status = 'pending';
  END IF;

  -- SouthWest: 5-bed + granny, closest brief match
  IF v_builder3 IS NOT NULL AND v_listing_sam IS NOT NULL AND v_buyer2 IS NOT NULL THEN
    INSERT INTO public.builder_proposals (
      builder_id, land_listing_id, buyer_id, package_name, base_price,
      estimated_build_weeks, inclusions, notes, status,
      home_specs, price_breakdown, inclusion_items
    ) VALUES (
      v_builder3, v_listing_sam, v_buyer2,
      'Hawkesbury 25 Dual Living', 548000, 33,
      '5-bed single storey, granny flat, stone, ducted AC, solar-ready, landscaping',
      'Demonstration package. Closest match to a 5-bed + granny-flat brief.',
      'pending',
      '{"bedrooms":5,"bathrooms":3,"car_spaces":2,"living_area_sqm":246,"storeys":1}'::jsonb,
      '[{"category":"site","label":"Site costs & connections","amount":48000},{"category":"base","label":"Base build to lock-up","amount":292000},{"category":"kitchen","label":"Kitchen package","amount":34000},{"category":"bathroom","label":"3-way bathroom package","amount":38000},{"category":"electrical","label":"Electrical & ducted AC","amount":28000},{"category":"external","label":"Granny flat + landscaping","amount":72000},{"category":"energy","label":"Solar-ready upgrade","amount":12000},{"category":"contingency","label":"Contingency allowance","amount":24000}]'::jsonb,
      '[{"category":"kitchen","item":"Stone benchtops","detail":"40mm stone + butler pantry","included":true},{"category":"electrical","item":"Ducted air conditioning","detail":"3 zones","included":true},{"category":"external","item":"Granny flat / studio","detail":"1-bed self-contained","included":true},{"category":"energy","item":"Solar ready","detail":"Inverter wiring included","included":true},{"category":"external","item":"Alfresco","detail":"Tiled outdoor living","included":true},{"category":"warranty","item":"Structural warranty","detail":"10 years + 2-year defects","included":true}]'::jsonb
    )
    ON CONFLICT (builder_id, land_listing_id) DO UPDATE SET
      package_name = EXCLUDED.package_name,
      base_price = EXCLUDED.base_price,
      estimated_build_weeks = EXCLUDED.estimated_build_weeks,
      inclusions = EXCLUDED.inclusions,
      notes = EXCLUDED.notes,
      home_specs = EXCLUDED.home_specs,
      price_breakdown = EXCLUDED.price_breakdown,
      inclusion_items = EXCLUDED.inclusion_items,
      status = 'pending';
  END IF;

  -- Extra packages on Alex Mount Annan so that buyer also has a comparison set
  IF v_builder1 IS NOT NULL AND v_listing_alex IS NOT NULL AND v_buyer1 IS NOT NULL THEN
    INSERT INTO public.builder_proposals (
      builder_id, land_listing_id, buyer_id, package_name, base_price,
      estimated_build_weeks, inclusions, notes, status,
      home_specs, price_breakdown, inclusion_items
    ) VALUES (
      v_builder1, v_listing_alex, v_buyer1,
      'The Campbell 220', 468000, 26,
      'Engineered stone, split-system AC, Colorbond roof, double garage',
      'Demonstration package. Fastest programme and lowest lump sum.',
      'pending',
      '{"bedrooms":4,"bathrooms":2,"car_spaces":2,"living_area_sqm":186,"storeys":2}'::jsonb,
      '[{"category":"site","label":"Site costs & connections","amount":36000},{"category":"base","label":"Base build to lock-up","amount":274000},{"category":"kitchen","label":"Kitchen package","amount":22000},{"category":"bathroom","label":"Bathroom package","amount":24000},{"category":"electrical","label":"Split-system AC","amount":14000},{"category":"external","label":"Driveway allowance","amount":16000},{"category":"contingency","label":"Contingency allowance","amount":18000}]'::jsonb,
      '[{"category":"kitchen","item":"Engineered stone","detail":"20mm","included":true},{"category":"electrical","item":"Split-system AC","detail":"Living + main bedroom","included":true},{"category":"external","item":"Double garage","detail":"Colorbond","included":true}]'::jsonb
    )
    ON CONFLICT (builder_id, land_listing_id) DO UPDATE SET
      package_name = EXCLUDED.package_name,
      base_price = EXCLUDED.base_price,
      home_specs = EXCLUDED.home_specs,
      price_breakdown = EXCLUDED.price_breakdown,
      inclusion_items = EXCLUDED.inclusion_items;
  END IF;

  IF v_builder2 IS NOT NULL AND v_listing_alex IS NOT NULL AND v_buyer1 IS NOT NULL THEN
    INSERT INTO public.builder_proposals (
      builder_id, land_listing_id, buyer_id, package_name, base_price,
      estimated_build_weeks, inclusions, notes, status,
      home_specs, price_breakdown, inclusion_items
    ) VALUES (
      v_builder2, v_listing_alex, v_buyer1,
      'Hawkesbury 25 Dual Living', 548000, 33,
      '5-bed single storey, granny flat, stone, ducted AC, solar-ready',
      'Demonstration package for Mount Annan.',
      'viewed',
      '{"bedrooms":5,"bathrooms":3,"car_spaces":2,"living_area_sqm":246,"storeys":1}'::jsonb,
      '[{"category":"site","label":"Site costs & connections","amount":48000},{"category":"base","label":"Base build to lock-up","amount":292000},{"category":"kitchen","label":"Kitchen package","amount":34000},{"category":"bathroom","label":"Bathroom package","amount":38000},{"category":"electrical","label":"Ducted AC","amount":28000},{"category":"external","label":"Granny flat","amount":72000},{"category":"contingency","label":"Contingency","amount":24000}]'::jsonb,
      '[{"category":"external","item":"Granny flat / studio","detail":"1-bed self-contained","included":true},{"category":"electrical","item":"Ducted air conditioning","detail":"3 zones","included":true}]'::jsonb
    )
    ON CONFLICT (builder_id, land_listing_id) DO UPDATE SET
      package_name = EXCLUDED.package_name,
      base_price = EXCLUDED.base_price,
      home_specs = EXCLUDED.home_specs,
      price_breakdown = EXCLUDED.price_breakdown,
      inclusion_items = EXCLUDED.inclusion_items,
      viewed_at = COALESCE(public.builder_proposals.viewed_at, NOW());
  END IF;
END $$;

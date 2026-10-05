-- Velu audit NOW punch list (1 Oct 2026): data integrity for leads, lot
-- measurements, placeholder builders, and fabricated identical track records.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.is_placeholder_builder(
  p_licence TEXT,
  p_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    COALESCE(upper(regexp_replace(p_licence, '[^A-Za-z0-9]', '', 'g')), '')
      ~ '^(A{3,}|U{3,}|X{3,}|TEST|DUMMY|FOO|BAR|AAAAA)$'
    OR COALESCE(upper(regexp_replace(p_name, '[^A-Za-z0-9]', '', 'g')), '')
      ~ '^(U{2,}|TEST|TESTBUILDER|FOO|BAR|DUMMY|XXXX)$'
    OR (
      length(regexp_replace(COALESCE(p_licence, ''), '[^A-Za-z0-9]', '', 'g')) >= 3
      AND regexp_replace(COALESCE(p_licence, ''), '[^A-Za-z0-9]', '', 'g')
        ~* '^(.)\1+$'
    );
$$;

-- 1. Buyer-owned land: reuse the same address + buyer instead of inserting duplicates.
CREATE OR REPLACE FUNCTION public.create_buyer_owned_listing(
  p_buyer_id UUID,
  p_address TEXT,
  p_suburb TEXT,
  p_postcode VARCHAR(4),
  p_land_size_sqm NUMERIC,
  p_frontage_meters NUMERIC,
  p_zoning VARCHAR(10),
  p_longitude DOUBLE PRECISION,
  p_latitude DOUBLE PRECISION,
  p_land_value NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_norm TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_buyer_id AND role = 'buyer'
  ) THEN
    RAISE EXCEPTION 'Only buyers can register owned land';
  END IF;

  IF COALESCE(p_land_value, 0) > 0
     AND p_land_size_sqm > 0
     AND (
       p_land_value > 4000000
       OR p_land_value / p_land_size_sqm > 6000
     ) THEN
    RAISE EXCEPTION 'Land value looks about 10× too high for this lot size';
  END IF;

  v_norm := lower(regexp_replace(p_address, '[^a-zA-Z0-9]+', ' ', 'g'));

  SELECT ll.id INTO v_id
  FROM public.land_listings ll
  WHERE ll.buyer_id = p_buyer_id
    AND ll.source = 'buyer_owned'
    AND lower(regexp_replace(ll.address, '[^a-zA-Z0-9]+', ' ', 'g')) = v_norm
    AND lower(ll.suburb) = lower(p_suburb)
  ORDER BY ll.updated_at DESC
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE public.land_listings
    SET
      address = p_address,
      postcode = p_postcode,
      price = GREATEST(COALESCE(p_land_value, 0), 0),
      price_display = CASE
        WHEN COALESCE(p_land_value, 0) > 0 THEN NULL
        ELSE 'Land owned — build quotes only'
      END,
      land_size_sqm = p_land_size_sqm,
      frontage_meters = p_frontage_meters,
      zoning = p_zoning,
      geom = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      updated_at = NOW()
    WHERE id = v_id;
    RETURN v_id;
  END IF;

  INSERT INTO public.land_listings (
    agent_id,
    buyer_id,
    address,
    suburb,
    postcode,
    price,
    price_display,
    land_size_sqm,
    frontage_meters,
    zoning,
    geom,
    status,
    source,
    sold_at
  ) VALUES (
    NULL,
    p_buyer_id,
    p_address,
    p_suburb,
    p_postcode,
    GREATEST(COALESCE(p_land_value, 0), 0),
    CASE
      WHEN COALESCE(p_land_value, 0) > 0 THEN NULL
      ELSE 'Land owned — build quotes only'
    END,
    p_land_size_sqm,
    p_frontage_meters,
    p_zoning,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    'sold',
    'buyer_owned',
    NOW()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_buyer_owned_listing(
  UUID, TEXT, TEXT, VARCHAR, NUMERIC, NUMERIC, VARCHAR,
  DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC
) TO authenticated;

-- 1. Builder leads: one row per address + buyer.
CREATE OR REPLACE FUNCTION public.get_sold_leads_for_builder(p_builder_id UUID)
RETURNS TABLE (
  id UUID,
  address TEXT,
  suburb TEXT,
  postcode VARCHAR(4),
  price NUMERIC,
  price_display TEXT,
  land_size_sqm NUMERIC,
  frontage_meters NUMERIC,
  zoning VARCHAR(10),
  status listing_status,
  sold_at TIMESTAMPTZ,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  source TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (
    lower(regexp_replace(ll.address, '[^a-zA-Z0-9]+', ' ', 'g')),
    lower(ll.suburb),
    COALESCE(ll.buyer_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
    ll.id,
    ll.address,
    ll.suburb,
    ll.postcode,
    ll.price,
    ll.price_display,
    ll.land_size_sqm,
    ll.frontage_meters,
    ll.zoning,
    ll.status,
    ll.sold_at,
    ST_X(ll.geom::geometry) AS longitude,
    ST_Y(ll.geom::geometry) AS latitude,
    ll.source
  FROM public.land_listings ll
  JOIN public.builder_profiles bp ON bp.id = p_builder_id
  WHERE
    ll.status = 'sold'
    AND bp.is_onboarded = TRUE
    AND bp.anchor_geom IS NOT NULL
    AND ST_DWithin(bp.anchor_geom, ll.geom, bp.service_radius_km * 1000)
  ORDER BY
    lower(regexp_replace(ll.address, '[^a-zA-Z0-9]+', ' ', 'g')),
    lower(ll.suburb),
    COALESCE(ll.buyer_id, '00000000-0000-0000-0000-000000000000'::uuid),
    CASE WHEN ll.source = 'buyer_owned' THEN 0 ELSE 1 END,
    CASE
      WHEN ll.land_size_sqm > 0 AND ll.price > 0
           AND ll.price / ll.land_size_sqm BETWEEN 200 AND 6000 THEN 0
      ELSE 1
    END,
    ll.sold_at DESC NULLS LAST,
    ll.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_sold_leads_for_builder(UUID) TO authenticated;

-- 8. Compare cards: licence + insurance from the builder profile.
DROP FUNCTION IF EXISTS public.get_proposals_for_buyer(UUID);

CREATE OR REPLACE FUNCTION public.get_proposals_for_buyer(p_buyer_id UUID)
RETURNS TABLE (
  id UUID,
  builder_id UUID,
  builder_name TEXT,
  land_listing_id UUID,
  listing_address TEXT,
  listing_suburb TEXT,
  package_name TEXT,
  base_price NUMERIC,
  inclusions TEXT,
  estimated_build_weeks INT,
  notes TEXT,
  price_breakdown JSONB,
  inclusion_items JSONB,
  home_specs JSONB,
  status proposal_status,
  created_at TIMESTAMPTZ,
  license_number TEXT,
  license_verify_url TEXT,
  is_license_valid BOOLEAN,
  insurance_verified BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bp.id,
    bp.builder_id,
    COALESCE(p.company_name, p.full_name) AS builder_name,
    bp.land_listing_id,
    ll.address AS listing_address,
    ll.suburb AS listing_suburb,
    bp.package_name,
    bp.base_price,
    bp.inclusions,
    bp.estimated_build_weeks,
    bp.notes,
    bp.price_breakdown,
    bp.inclusion_items,
    bp.home_specs,
    bp.status,
    bp.created_at,
    bpr.license_number,
    bpr.license_verify_url,
    bpr.is_license_valid,
    bpr.insurance_verified
  FROM public.builder_proposals bp
  JOIN public.profiles p ON p.id = bp.builder_id
  JOIN public.land_listings ll ON ll.id = bp.land_listing_id
  LEFT JOIN public.builder_profiles bpr ON bpr.id = bp.builder_id
  WHERE
    bp.buyer_id = p_buyer_id
    OR (bp.buyer_id IS NULL AND ll.buyer_id = p_buyer_id)
  ORDER BY bp.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_proposals_for_buyer(UUID) TO authenticated;

-- 5. Hide placeholder licences from the NSW register nearby list.
CREATE OR REPLACE FUNCTION public.get_licensed_builders_near_listing(
  p_listing_id UUID,
  p_radius_km NUMERIC DEFAULT 40,
  p_limit INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.land_listings ll
    WHERE ll.id = p_listing_id
      AND ll.buyer_id = auth.uid()
      AND ll.source = 'buyer_owned'
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(builder_row ORDER BY (builder_row->>'distance_km')::numeric)
    FROM (
      SELECT jsonb_build_object(
        'id', b.id,
        'licence_number', b.licence_number,
        'licensee', b.licensee,
        'suburb', b.suburb,
        'postcode', b.postcode,
        'state', b.state,
        'latitude', b.latitude,
        'longitude', b.longitude,
        'status', b.status,
        'expires', b.expires_on,
        'verify_url', b.verify_url,
        'google_rating', b.google_rating,
        'google_review_count', b.google_review_count,
        'google_maps_url', b.google_maps_url,
        'website_url', b.website_url,
        'last_property_sold_address', b.last_property_sold_address,
        'last_property_sold_at', b.last_property_sold_at,
        'avg_delay_weeks', b.avg_delay_weeks,
        'distance_km', ROUND((ST_Distance(b.geom, ll.geom) / 1000.0)::numeric, 1)
      ) AS builder_row
      FROM public.nsw_licensed_builders b
      JOIN public.land_listings ll ON ll.id = p_listing_id
      WHERE b.geom IS NOT NULL
        AND b.status = 'Current'
        AND NOT public.is_placeholder_builder(b.licence_number, b.licensee)
        AND ST_DWithin(b.geom, ll.geom, GREATEST(p_radius_km, 5) * 1000)
      ORDER BY ST_Distance(b.geom, ll.geom)
      LIMIT GREATEST(LEAST(p_limit, 50), 1)
    ) matched
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_licensed_builders_near_listing(UUID, NUMERIC, INT) TO authenticated;

-- 5. Hide placeholder onboarded builders from nearby (keep prior JSON shape).
CREATE OR REPLACE FUNCTION public.get_public_builders_near_listing(p_listing_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.land_listings ll
    WHERE ll.id = p_listing_id
      AND ll.buyer_id = auth.uid()
      AND ll.source = 'buyer_owned'
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(builder_row ORDER BY (builder_row->>'distance_km')::numeric)
    FROM (
      SELECT jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'company_name', p.company_name,
        'avatar_url', p.avatar_url,
        'headline', bp.headline,
        'google_rating', bp.google_rating,
        'google_review_count', bp.google_review_count,
        'anchor_address', bp.anchor_address,
        'service_radius_km', bp.service_radius_km,
        'profile_published', bp.profile_published,
        'license_number', bp.license_number,
        'is_license_valid', bp.is_license_valid,
        'license_verified_at', bp.license_verified_at,
        'license_verify_url', bp.license_verify_url,
        'insurance_verified', bp.insurance_verified,
        'years_in_business', bp.years_in_business,
        'builder_type', bp.builder_type,
        'last_property_sold_address', bp.last_property_sold_address,
        'last_property_sold_at', bp.last_property_sold_at,
        'avg_delay_weeks', bp.avg_delay_weeks,
        'google_maps_url', bp.google_maps_url,
        'distance_km', ROUND((ST_Distance(bp.anchor_geom, ll.geom) / 1000.0)::numeric, 1),
        'notices', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', n.id,
              'title', n.title,
              'body', n.body,
              'severity', n.severity,
              'issued_at', n.issued_at,
              'source', n.source
            )
            ORDER BY n.issued_at DESC NULLS LAST
          )
          FROM public.builder_compliance_notices n
          WHERE n.builder_id = p.id AND n.is_active = TRUE
        ), '[]'::jsonb),
        'portfolio', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', recent.id,
              'title', recent.title,
              'location', recent.location,
              'completed_year', recent.completed_year,
              'image_url', recent.image_url
            )
          )
          FROM (
            SELECT pp.id, pp.title, pp.location, pp.completed_year, pp.image_url
            FROM public.builder_portfolio_projects pp
            WHERE pp.builder_id = p.id
            ORDER BY pp.sort_order, pp.created_at
            LIMIT 3
          ) recent
        ), '[]'::jsonb)
      ) AS builder_row
      FROM public.builder_profiles bp
      JOIN public.profiles p ON p.id = bp.id
      JOIN public.land_listings ll ON ll.id = p_listing_id
      WHERE bp.is_onboarded = TRUE
        AND bp.anchor_geom IS NOT NULL
        AND NOT public.is_placeholder_builder(
          bp.license_number,
          COALESCE(p.company_name, p.full_name)
        )
        AND ST_DWithin(bp.anchor_geom, ll.geom, bp.service_radius_km * 1000)
    ) matched
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_builders_near_listing(UUID) TO authenticated;

-- Existing 10× prices: if dividing by 10 lands in a realistic $/m² band, correct it.
UPDATE public.land_listings
SET
  price = price / 10,
  price_display = to_char(price / 10, 'FM"$"999,999,999')
WHERE land_size_sqm > 0
  AND price > 0
  AND price / land_size_sqm > 6000
  AND (price / 10.0) / land_size_sqm BETWEEN 200 AND 6000;

-- 2. Figtree SSOT: listing matches land measurements 518 m² / 13.5 m / 20 m.
UPDATE public.land_listings
SET
  land_size_sqm = 518,
  frontage_meters = 13.5,
  depth_meters = 20
WHERE address ILIKE '%Figtree%'
  AND suburb ILIKE 'Oran Park';

-- 3. demo.buyer2 brief: single-level living, matching Figtree measurements.
UPDATE public.buyer_profiles bp
SET
  build_requirements = jsonb_build_object(
    'storeys', 'ground_only',
    'house_type', 'single_storey',
    'granny_flat', 'yes',
    'bedrooms', 5,
    'bathrooms', 3,
    'car_spaces', 2,
    'construction_grade', 'medium',
    'preferred_builder_types', jsonb_build_array('bulk', 'semi_custom'),
    'land_size_sqm', 518,
    'frontage_meters', 13.5,
    'depth_meters', 20,
    'additional_notes', 'Single-level living, granny flat for parents.'
  ),
  requirements_completed_at = COALESCE(bp.requirements_completed_at, NOW())
FROM auth.users u
WHERE bp.id = u.id
  AND u.email = 'demo.buyer2@velu.dev';

-- 4. Stop treating the Wattle Grove placeholder as a verified last sale / delay.
UPDATE public.builder_profiles
SET
  last_property_sold_address = NULL,
  last_property_sold_at = NULL,
  avg_delay_weeks = NULL
WHERE last_property_sold_address = '7 Wattle Grove, Leumeah'
  AND COALESCE(avg_delay_weeks, 1.5) = 1.5;

-- Distinct demo track records (only if those users exist).
UPDATE public.builder_profiles bp
SET
  last_property_sold_address = '45 Badgally Rd, Campbelltown',
  last_property_sold_at = CURRENT_DATE - 19,
  avg_delay_weeks = 0.4
FROM auth.users u
WHERE bp.id = u.id AND u.email = 'demo.builder@velu.dev';

UPDATE public.builder_profiles bp
SET
  last_property_sold_address = '14 River Rd, Liverpool',
  last_property_sold_at = CURRENT_DATE - 41,
  avg_delay_weeks = 2.1
FROM auth.users u
WHERE bp.id = u.id AND u.email = 'demo.builder2@velu.dev';

UPDATE public.builder_profiles bp
SET
  last_property_sold_address = '4 Gledswood Hills Dr, Gregory Hills',
  last_property_sold_at = CURRENT_DATE - 12,
  avg_delay_weeks = 1.1
FROM auth.users u
WHERE bp.id = u.id AND u.email = 'demo.builder3@velu.dev';

UPDATE public.builder_profiles bp
SET
  last_property_sold_address = 'Lot 2209 Brabham Precinct, Oran Park',
  last_property_sold_at = CURRENT_DATE - 21,
  avg_delay_weeks = 0
FROM auth.users u
WHERE bp.id = u.id AND u.email = 'demo.dhursan@velu.dev';

-- 5. Unpublish junk / QA builders (UUU / AAAAA) from buyer-facing directory.
UPDATE public.builder_profiles bp
SET profile_published = FALSE
FROM public.profiles p
WHERE bp.id = p.id
  AND public.is_placeholder_builder(
    bp.license_number,
    COALESCE(p.company_name, p.full_name)
  );

DELETE FROM public.nsw_licensed_builders
WHERE public.is_placeholder_builder(licence_number, licensee);

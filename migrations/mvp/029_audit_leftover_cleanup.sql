-- Leftover production cleanup after 028 (Chalford duplicate land_listings +
-- unpublished AAAAA / UUU builder_profiles).
--
-- THIS FILE IS SQL. Paste the whole file into the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query), the same way as 028.
-- Do not paste npm commands here — they are not SQL and will error with
-- syntax error at or near "npm".
-- Safe to re-run.

-- Street-type aliases so "12 Chalford Circuit" and "12 Chalford Cct" collide.
CREATE OR REPLACE FUNCTION public.normalize_listing_address(
  p_address TEXT,
  p_suburb TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v TEXT;
  v_suburb TEXT;
BEGIN
  v := lower(COALESCE(p_address, ''));
  v := regexp_replace(v, '\y(street|st)\y', 'st', 'g');
  v := regexp_replace(v, '\y(road|rd)\y', 'rd', 'g');
  v := regexp_replace(v, '\y(avenue|ave)\y', 'ave', 'g');
  v := regexp_replace(v, '\y(drive|dr)\y', 'dr', 'g');
  v := regexp_replace(v, '\y(boulevard|blvd)\y', 'blvd', 'g');
  v := regexp_replace(v, '\y(circuit|cct|circ)\y', 'cct', 'g');
  v := regexp_replace(v, '\y(place|pl)\y', 'pl', 'g');
  v := regexp_replace(v, '\y(court|ct)\y', 'ct', 'g');
  v := regexp_replace(v, '\y(crescent|cres)\y', 'cres', 'g');
  v := regexp_replace(v, '\y(lane|ln)\y', 'ln', 'g');
  v := regexp_replace(v, '\y(nsw|australia)\y', ' ', 'g');
  v := regexp_replace(v, '\y\d{4}\y', ' ', 'g');
  v := regexp_replace(v, '[^a-z0-9]+', ' ', 'g');
  v_suburb := trim(regexp_replace(
    regexp_replace(lower(COALESCE(p_suburb, '')), '[^a-z0-9]+', ' ', 'g'),
    '\s+',
    ' ',
    'g'
  ));
  IF v_suburb <> '' THEN
    v := regexp_replace(v, '\y' || v_suburb || '\y', ' ', 'g');
  END IF;
  RETURN trim(regexp_replace(v, '\s+', ' ', 'g'));
END;
$$;

GRANT EXECUTE ON FUNCTION public.normalize_listing_address(TEXT, TEXT) TO authenticated;

-- Real demo / live builders that 029 must never delete.
CREATE OR REPLACE FUNCTION public.is_protected_live_builder(
  p_company TEXT,
  p_full_name TEXT,
  p_license TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    COALESCE(p_company, '')
      ~* '(apex homes|meridian building|southwest living|south west living|dhursan)'
    OR COALESCE(p_full_name, '')
      ~* '(apex homes|meridian building|southwest living|south west living|dhursan)'
    OR COALESCE(upper(regexp_replace(p_license, '[^A-Za-z0-9]', '', 'g')), '')
      IN ('NSWBLD28491', 'NSWBLD31756', 'NSWBLD40283', '369795C');
$$;

-- Buyer-owned register: reuse Circuit/Cct variants for the same buyer.
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

  v_norm := public.normalize_listing_address(p_address, p_suburb);

  SELECT ll.id INTO v_id
  FROM public.land_listings ll
  WHERE ll.buyer_id = p_buyer_id
    AND ll.source = 'buyer_owned'
    AND public.normalize_listing_address(ll.address, ll.suburb) = v_norm
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

-- Builder leads: DISTINCT ON buyer + Circuit/Cct-normalized address.
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
    public.normalize_listing_address(ll.address, ll.suburb),
    lower(trim(ll.suburb)),
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
    public.normalize_listing_address(ll.address, ll.suburb),
    lower(trim(ll.suburb)),
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

-- 1. Duplicate land_listings: keep one row per (buyer_id, normalized address).
-- 028 updated prices / DISTINCT ON for leads but never DELETEd extra copies.
-- Prefer the 028-updated Chalford row (ef01c387… @ $740k, 2026-10-05T16:24:47Z)
-- when it is in the group; otherwise the newest complete sane-price row.
-- Re-point proposals, site reports, architect requests, inquiries/messages,
-- projects, and lead notifications before DELETE.
DO $$
BEGIN
  DROP TABLE IF EXISTS listing_keep_map;

  CREATE TEMP TABLE listing_keep_map AS
  WITH ranked AS (
    SELECT
      ll.id,
      ll.buyer_id,
      public.normalize_listing_address(ll.address, ll.suburb) AS addr_key,
      lower(trim(ll.suburb)) AS suburb_key,
      ROW_NUMBER() OVER (
        PARTITION BY
          ll.buyer_id,
          public.normalize_listing_address(ll.address, ll.suburb),
          lower(trim(ll.suburb))
        ORDER BY
          CASE WHEN ll.id::text LIKE 'ef01c387%' THEN 0 ELSE 1 END,
          CASE WHEN ll.source = 'buyer_owned' THEN 0 ELSE 1 END,
          CASE
            WHEN ll.land_size_sqm > 0 AND ll.price > 0
                 AND ll.price / ll.land_size_sqm BETWEEN 200 AND 6000 THEN 0
            ELSE 1
          END,
          (
            (CASE WHEN ll.land_size_sqm > 0 THEN 1 ELSE 0 END)
            + (CASE WHEN ll.frontage_meters > 0 THEN 1 ELSE 0 END)
            + (CASE WHEN COALESCE(ll.depth_meters, 0) > 0 THEN 1 ELSE 0 END)
            + (CASE WHEN EXISTS (
                SELECT 1 FROM public.builder_proposals bp
                WHERE bp.land_listing_id = ll.id
              ) THEN 2 ELSE 0 END)
            + (CASE WHEN EXISTS (
                SELECT 1 FROM public.site_report_requests sr
                WHERE sr.land_listing_id = ll.id
              ) THEN 2 ELSE 0 END)
          ) DESC,
          ll.updated_at DESC NULLS LAST,
          ll.created_at DESC
      ) AS rn
    FROM public.land_listings ll
    WHERE ll.buyer_id IS NOT NULL
  )
  SELECT drop_row.id AS drop_id, keep_row.id AS keep_id
  FROM ranked drop_row
  JOIN ranked keep_row
    ON keep_row.buyer_id = drop_row.buyer_id
   AND keep_row.addr_key = drop_row.addr_key
   AND keep_row.suburb_key = drop_row.suburb_key
   AND keep_row.rn = 1
  WHERE drop_row.rn > 1;

  IF NOT EXISTS (SELECT 1 FROM listing_keep_map) THEN
    RAISE NOTICE '029: no duplicate land_listings to delete';
  ELSE
    -- Collapse unique children across every copy in a group (keep + extras),
    -- then re-point survivors. Avoids UNIQUE clashes when two extras share a
    -- builder / report key and the keep row has none.
    DELETE FROM public.builder_proposals p
    USING (
      SELECT id FROM (
        SELECT
          p2.id,
          ROW_NUMBER() OVER (
            PARTITION BY p2.builder_id, COALESCE(m.keep_id, p2.land_listing_id)
            ORDER BY
              CASE WHEN m.drop_id IS NULL THEN 0 ELSE 1 END,
              p2.created_at DESC NULLS LAST
          ) AS rn
        FROM public.builder_proposals p2
        LEFT JOIN listing_keep_map m ON p2.land_listing_id = m.drop_id
        WHERE p2.land_listing_id IN (
          SELECT drop_id FROM listing_keep_map
          UNION
          SELECT keep_id FROM listing_keep_map
        )
      ) ranked
      WHERE ranked.rn > 1
    ) extra
    WHERE p.id = extra.id;

    UPDATE public.builder_proposals extra
    SET land_listing_id = m.keep_id
    FROM listing_keep_map m
    WHERE extra.land_listing_id = m.drop_id;

    DELETE FROM public.site_report_requests sr
    USING (
      SELECT id FROM (
        SELECT
          sr2.id,
          ROW_NUMBER() OVER (
            PARTITION BY sr2.report_definition_key, COALESCE(m.keep_id, sr2.land_listing_id)
            ORDER BY
              CASE WHEN m.drop_id IS NULL THEN 0 ELSE 1 END,
              sr2.updated_at DESC NULLS LAST,
              sr2.created_at DESC NULLS LAST
          ) AS rn
        FROM public.site_report_requests sr2
        LEFT JOIN listing_keep_map m ON sr2.land_listing_id = m.drop_id
        WHERE sr2.land_listing_id IN (
          SELECT drop_id FROM listing_keep_map
          UNION
          SELECT keep_id FROM listing_keep_map
        )
      ) ranked
      WHERE ranked.rn > 1
    ) extra
    WHERE sr.id = extra.id;

    UPDATE public.site_report_requests extra
    SET land_listing_id = m.keep_id
    FROM listing_keep_map m
    WHERE extra.land_listing_id = m.drop_id;

    DELETE FROM public.architect_requests ar
    USING (
      SELECT id FROM (
        SELECT
          ar2.id,
          ROW_NUMBER() OVER (
            PARTITION BY ar2.architect_key, COALESCE(m.keep_id, ar2.land_listing_id)
            ORDER BY
              CASE WHEN m.drop_id IS NULL THEN 0 ELSE 1 END,
              ar2.updated_at DESC NULLS LAST,
              ar2.created_at DESC NULLS LAST
          ) AS rn
        FROM public.architect_requests ar2
        LEFT JOIN listing_keep_map m ON ar2.land_listing_id = m.drop_id
        WHERE ar2.land_listing_id IN (
          SELECT drop_id FROM listing_keep_map
          UNION
          SELECT keep_id FROM listing_keep_map
        )
      ) ranked
      WHERE ranked.rn > 1
    ) extra
    WHERE ar.id = extra.id;

    UPDATE public.architect_requests extra
    SET land_listing_id = m.keep_id
    FROM listing_keep_map m
    WHERE extra.land_listing_id = m.drop_id;

    DROP TABLE IF EXISTS inquiry_merge_map;
    CREATE TEMP TABLE inquiry_merge_map AS
    WITH involved AS (
      SELECT
        i.id,
        i.buyer_id,
        i.builder_id,
        i.land_listing_id,
        i.created_at,
        COALESCE(m.keep_id, i.land_listing_id) AS keep_id,
        CASE WHEN m.drop_id IS NULL THEN 0 ELSE 1 END AS is_drop
      FROM public.builder_inquiries i
      LEFT JOIN listing_keep_map m ON i.land_listing_id = m.drop_id
      WHERE i.land_listing_id IN (
        SELECT drop_id FROM listing_keep_map
        UNION
        SELECT keep_id FROM listing_keep_map
      )
    ),
    ranked AS (
      SELECT
        involved.*,
        ROW_NUMBER() OVER (
          PARTITION BY buyer_id, builder_id, keep_id
          ORDER BY is_drop, created_at DESC NULLS LAST
        ) AS rn
      FROM involved
    )
    SELECT drop_row.id AS drop_inquiry_id, keep_row.id AS keep_inquiry_id
    FROM ranked drop_row
    JOIN ranked keep_row
      ON drop_row.buyer_id = keep_row.buyer_id
     AND drop_row.builder_id = keep_row.builder_id
     AND drop_row.keep_id = keep_row.keep_id
     AND keep_row.rn = 1
    WHERE drop_row.rn > 1;

    UPDATE public.inquiry_messages im
    SET inquiry_id = mm.keep_inquiry_id
    FROM inquiry_merge_map mm
    WHERE im.inquiry_id = mm.drop_inquiry_id;

    DELETE FROM public.builder_inquiries
    WHERE id IN (SELECT drop_inquiry_id FROM inquiry_merge_map);

    UPDATE public.builder_inquiries extra
    SET land_listing_id = m.keep_id
    FROM listing_keep_map m
    WHERE extra.land_listing_id = m.drop_id;

    UPDATE public.construction_projects extra
    SET land_listing_id = m.keep_id
    FROM listing_keep_map m
    WHERE extra.land_listing_id = m.drop_id;

    UPDATE public.notifications n
    SET metadata = jsonb_set(n.metadata, '{listing_id}', to_jsonb(m.keep_id::text), TRUE)
    FROM listing_keep_map m
    WHERE n.metadata->>'listing_id' = m.drop_id::text;

    DELETE FROM public.land_listings
    WHERE id IN (SELECT drop_id FROM listing_keep_map);

    RAISE NOTICE '029: deleted extra land_listings copies';
  END IF;
END $$;

-- 2. Unpublished AAAAA / UUU leftover. 028 only set profile_published = FALSE.
-- Do not delete auth.users / profiles (Velu login). Do not touch Apex, Meridian,
-- SouthWest, or Dhursan. Drop the placeholder builder_profiles row so it cannot
-- reappear in the directory.
UPDATE public.builder_profiles bp
SET
  profile_published = FALSE,
  is_onboarded = FALSE
FROM public.profiles p
WHERE bp.id = p.id
  AND public.is_placeholder_builder(
    bp.license_number,
    COALESCE(p.company_name, p.full_name)
  )
  AND NOT public.is_protected_live_builder(
    p.company_name,
    p.full_name,
    bp.license_number
  )
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = bp.id
      AND lower(u.email) IN (
        'demo.builder@velu.dev',
        'demo.builder2@velu.dev',
        'demo.builder3@velu.dev',
        'demo.dhursan@velu.dev'
      )
  );

DELETE FROM public.builder_profiles bp
USING public.profiles p
WHERE bp.id = p.id
  AND public.is_placeholder_builder(
    bp.license_number,
    COALESCE(p.company_name, p.full_name)
  )
  AND NOT public.is_protected_live_builder(
    p.company_name,
    p.full_name,
    bp.license_number
  )
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = bp.id
      AND lower(u.email) IN (
        'demo.builder@velu.dev',
        'demo.builder2@velu.dev',
        'demo.builder3@velu.dev',
        'demo.dhursan@velu.dev'
      )
  );

DELETE FROM public.nsw_licensed_builders
WHERE public.is_placeholder_builder(licence_number, licensee);

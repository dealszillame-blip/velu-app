-- Velu MVP — Domain API listing sync support

ALTER TABLE public.land_listings
  ADD COLUMN IF NOT EXISTS domain_listing_id TEXT,
  ADD COLUMN IF NOT EXISTS domain_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'agent',
  ADD COLUMN IF NOT EXISTS price_display TEXT,
  ADD COLUMN IF NOT EXISTS domain_data JSONB;

ALTER TABLE public.land_listings
  DROP CONSTRAINT IF EXISTS land_listings_source_check;

ALTER TABLE public.land_listings
  ADD CONSTRAINT land_listings_source_check
  CHECK (source IN ('agent', 'domain'));

CREATE UNIQUE INDEX IF NOT EXISTS land_listings_domain_listing_id_idx
  ON public.land_listings (domain_listing_id)
  WHERE domain_listing_id IS NOT NULL;

INSERT INTO public.feature_flags (key, module, description, enabled) VALUES
  ('DOMAIN_SYNC', 'mvp', 'Sync vacant land listings from Domain Developer API', TRUE)
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  module = EXCLUDED.module;

CREATE OR REPLACE FUNCTION public.upsert_domain_land_listing(
  p_domain_listing_id TEXT,
  p_address TEXT,
  p_suburb TEXT,
  p_postcode VARCHAR(4),
  p_price NUMERIC,
  p_price_display TEXT,
  p_land_size_sqm NUMERIC,
  p_frontage_meters NUMERIC,
  p_zoning VARCHAR(10),
  p_longitude DOUBLE PRECISION,
  p_latitude DOUBLE PRECISION,
  p_status listing_status,
  p_sold_at TIMESTAMPTZ DEFAULT NULL,
  p_domain_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.land_listings (
    domain_listing_id,
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
    sold_at,
    source,
    domain_synced_at,
    domain_data,
    listing_category
  ) VALUES (
    p_domain_listing_id,
    p_address,
    p_suburb,
    p_postcode,
    p_price,
    p_price_display,
    p_land_size_sqm,
    p_frontage_meters,
    p_zoning,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_status,
    p_sold_at,
    'domain',
    NOW(),
    p_domain_data,
    'vacant_land'
  )
  ON CONFLICT (domain_listing_id) DO UPDATE SET
    address = EXCLUDED.address,
    suburb = EXCLUDED.suburb,
    postcode = EXCLUDED.postcode,
    price = EXCLUDED.price,
    price_display = EXCLUDED.price_display,
    land_size_sqm = EXCLUDED.land_size_sqm,
    frontage_meters = EXCLUDED.frontage_meters,
    zoning = EXCLUDED.zoning,
    geom = EXCLUDED.geom,
    status = EXCLUDED.status,
    sold_at = EXCLUDED.sold_at,
    domain_synced_at = NOW(),
    domain_data = EXCLUDED.domain_data,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_domain_land_listing(
  TEXT, TEXT, TEXT, VARCHAR, NUMERIC, TEXT, NUMERIC, NUMERIC, VARCHAR,
  DOUBLE PRECISION, DOUBLE PRECISION, listing_status, TIMESTAMPTZ, JSONB
) TO service_role;

-- Return type changed (added price_display, source) — must drop before recreate
DROP FUNCTION IF EXISTS public.get_listings_for_map(
  listing_status, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT
);

CREATE OR REPLACE FUNCTION public.get_listings_for_map(
  p_status listing_status DEFAULT NULL,
  p_price_min NUMERIC DEFAULT NULL,
  p_price_max NUMERIC DEFAULT NULL,
  p_size_min NUMERIC DEFAULT NULL,
  p_size_max NUMERIC DEFAULT NULL,
  p_suburb TEXT DEFAULT NULL
)
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
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  source TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
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
    ST_X(ll.geom::geometry) AS longitude,
    ST_Y(ll.geom::geometry) AS latitude,
    ll.source
  FROM public.land_listings ll
  WHERE
    (p_status IS NULL OR ll.status = p_status)
    AND (p_price_min IS NULL OR ll.price >= p_price_min OR ll.price = 0)
    AND (p_price_max IS NULL OR ll.price <= p_price_max OR ll.price = 0)
    AND (p_size_min IS NULL OR ll.land_size_sqm >= p_size_min)
    AND (p_size_max IS NULL OR ll.land_size_sqm <= p_size_max)
    AND (p_suburb IS NULL OR ll.suburb ILIKE p_suburb)
  ORDER BY ll.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_listings_for_map(
  listing_status, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT
) TO anon, authenticated;

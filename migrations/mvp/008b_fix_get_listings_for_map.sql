-- Fix: get_listings_for_map return type (run if 008 failed with 42P13)
-- Safe to run even if 008 already succeeded.

ALTER TABLE public.land_listings
  ADD COLUMN IF NOT EXISTS domain_listing_id TEXT,
  ADD COLUMN IF NOT EXISTS domain_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'agent',
  ADD COLUMN IF NOT EXISTS price_display TEXT,
  ADD COLUMN IF NOT EXISTS domain_data JSONB;

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

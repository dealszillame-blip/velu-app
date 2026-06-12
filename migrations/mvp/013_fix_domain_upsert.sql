-- Fix upsert_domain_land_listing ON CONFLICT for partial unique index

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
  ON CONFLICT (domain_listing_id) WHERE domain_listing_id IS NOT NULL DO UPDATE SET
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

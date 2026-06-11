-- Velu MVP — listing create + map query helpers

CREATE OR REPLACE FUNCTION public.create_land_listing(
  p_agent_id UUID,
  p_address TEXT,
  p_suburb TEXT,
  p_postcode VARCHAR(4),
  p_price NUMERIC,
  p_land_size_sqm NUMERIC,
  p_frontage_meters NUMERIC,
  p_zoning VARCHAR(10),
  p_longitude DOUBLE PRECISION,
  p_latitude DOUBLE PRECISION,
  p_status listing_status DEFAULT 'available'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_agent_id AND role = 'agent'
  ) THEN
    RAISE EXCEPTION 'Only agents can create listings';
  END IF;

  INSERT INTO public.land_listings (
    agent_id,
    address,
    suburb,
    postcode,
    price,
    land_size_sqm,
    frontage_meters,
    zoning,
    geom,
    status
  ) VALUES (
    p_agent_id,
    p_address,
    p_suburb,
    p_postcode,
    p_price,
    p_land_size_sqm,
    p_frontage_meters,
    p_zoning,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_status
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_land_listing(
  UUID, TEXT, TEXT, VARCHAR, NUMERIC, NUMERIC, NUMERIC, VARCHAR,
  DOUBLE PRECISION, DOUBLE PRECISION, listing_status
) TO authenticated;

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
  land_size_sqm NUMERIC,
  frontage_meters NUMERIC,
  zoning VARCHAR(10),
  status listing_status,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION
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
    ll.land_size_sqm,
    ll.frontage_meters,
    ll.zoning,
    ll.status,
    ST_X(ll.geom::geometry) AS longitude,
    ST_Y(ll.geom::geometry) AS latitude
  FROM public.land_listings ll
  WHERE
    (p_status IS NULL OR ll.status = p_status)
    AND (p_price_min IS NULL OR ll.price >= p_price_min)
    AND (p_price_max IS NULL OR ll.price <= p_price_max)
    AND (p_size_min IS NULL OR ll.land_size_sqm >= p_size_min)
    AND (p_size_max IS NULL OR ll.land_size_sqm <= p_size_max)
    AND (p_suburb IS NULL OR ll.suburb ILIKE p_suburb)
  ORDER BY ll.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_listings_for_map(
  listing_status, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT
) TO anon, authenticated;

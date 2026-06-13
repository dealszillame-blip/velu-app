-- Velu MVP — buyer-owned land onboarding (already holding a block)

ALTER TABLE public.land_listings
  DROP CONSTRAINT IF EXISTS land_listings_source_check;

ALTER TABLE public.land_listings
  ADD CONSTRAINT land_listings_source_check
  CHECK (source IN ('agent', 'domain', 'buyer_owned'));

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
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_buyer_id AND role = 'buyer'
  ) THEN
    RAISE EXCEPTION 'Only buyers can register owned land';
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

DROP POLICY IF EXISTS "listings: insert (buyer owned)" ON public.land_listings;

CREATE POLICY "listings: insert (buyer owned)"
  ON public.land_listings FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id
    AND source = 'buyer_owned'
    AND status = 'sold'
    AND agent_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'buyer'
    )
  );

DROP POLICY IF EXISTS "listings: update own (buyer owned)" ON public.land_listings;

CREATE POLICY "listings: update own (buyer owned)"
  ON public.land_listings FOR UPDATE
  USING (
    auth.uid() = buyer_id
    AND source = 'buyer_owned'
  );

-- Hide private buyer parcels from the public map browse
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
    ll.source <> 'buyer_owned'
    AND (p_status IS NULL OR ll.status = p_status)
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

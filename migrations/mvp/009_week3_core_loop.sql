-- Velu MVP — Week 3: sold leads, proposal gates, core loop RPCs

DROP POLICY IF EXISTS "proposals: insert (builder)" ON public.builder_proposals;

CREATE POLICY "proposals: insert (builder)"
  ON public.builder_proposals FOR INSERT
  WITH CHECK (
    auth.uid() = builder_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'builder'
    )
    AND EXISTS (
      SELECT 1 FROM public.builder_profiles
      WHERE id = auth.uid() AND is_onboarded = TRUE
    )
  );

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
  ORDER BY ll.sold_at DESC NULLS LAST, ll.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_sold_leads_for_builder(UUID) TO authenticated;

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
  status proposal_status,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bp.id,
    bp.builder_id,
    p.full_name AS builder_name,
    bp.land_listing_id,
    ll.address AS listing_address,
    ll.suburb AS listing_suburb,
    bp.package_name,
    bp.base_price,
    bp.inclusions,
    bp.estimated_build_weeks,
    bp.notes,
    bp.status,
    bp.created_at
  FROM public.builder_proposals bp
  JOIN public.profiles p ON p.id = bp.builder_id
  JOIN public.land_listings ll ON ll.id = bp.land_listing_id
  WHERE
    bp.buyer_id = p_buyer_id
    OR (bp.buyer_id IS NULL AND ll.buyer_id = p_buyer_id)
  ORDER BY bp.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_proposals_for_buyer(UUID) TO authenticated;

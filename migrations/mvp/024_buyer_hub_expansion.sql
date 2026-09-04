-- Velu MVP — buyer hub: architects, builder compliance, published packages, map builders

CREATE TABLE IF NOT EXISTS public.architect_directory (
  key           TEXT PRIMARY KEY CHECK (key ~ '^[a-z0-9_]+$'),
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  specialty     TEXT,
  service_area  TEXT,
  website_url   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.architect_requests (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  architect_key         TEXT NOT NULL REFERENCES public.architect_directory(key) ON DELETE RESTRICT,
  land_listing_id       UUID NOT NULL REFERENCES public.land_listings(id) ON DELETE CASCADE,
  buyer_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'quoted', 'accepted', 'in_progress', 'delivered', 'cancelled')),
  buyer_notes           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (land_listing_id, architect_key)
);

CREATE INDEX IF NOT EXISTS architect_requests_buyer_idx
  ON public.architect_requests(buyer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.builder_compliance_notices (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  builder_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  source       TEXT NOT NULL DEFAULT 'nsw_fair_trading',
  severity     TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'action')),
  issued_at    DATE,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS builder_compliance_notices_builder_idx
  ON public.builder_compliance_notices(builder_id, is_active);

CREATE TABLE IF NOT EXISTS public.builder_published_packages (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key                TEXT UNIQUE,
  builder_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  storeys            TEXT NOT NULL CHECK (storeys IN ('single', 'double')),
  name               TEXT NOT NULL,
  description        TEXT NOT NULL,
  bedrooms           INT,
  bathrooms          NUMERIC(3, 1),
  living_area_sqm    NUMERIC(8, 2),
  indicative_price   NUMERIC(12, 2),
  source_name        TEXT,
  source_url         TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order         INT NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS builder_published_packages_storeys_idx
  ON public.builder_published_packages(storeys, is_active, sort_order);

ALTER TABLE public.architect_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architect_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_compliance_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_published_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "architect_directory: read active"
  ON public.architect_directory FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = TRUE);

CREATE POLICY "architect_requests: read own"
  ON public.architect_requests FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "architect_requests: insert own"
  ON public.architect_requests FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id
    AND status = 'requested'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'buyer'
    )
    AND EXISTS (
      SELECT 1 FROM public.land_listings
      WHERE id = land_listing_id
        AND buyer_id = auth.uid()
        AND source = 'buyer_owned'
    )
  );

CREATE POLICY "builder_compliance_notices: read authenticated"
  ON public.builder_compliance_notices FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = TRUE);

CREATE POLICY "builder_published_packages: read active"
  ON public.builder_published_packages FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = TRUE);

DROP TRIGGER IF EXISTS architect_directory_updated_at ON public.architect_directory;
CREATE TRIGGER architect_directory_updated_at
  BEFORE UPDATE ON public.architect_directory
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS architect_requests_updated_at ON public.architect_requests;
CREATE TRIGGER architect_requests_updated_at
  BEFORE UPDATE ON public.architect_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.architect_directory (key, name, description, specialty, service_area, sort_order)
VALUES
  (
    'custom_home_architect',
    'Custom home architect',
    'Site-specific floor plans and DA-ready drawings for irregular or sloping lots.',
    'Custom new homes',
    'South West Sydney',
    10
  ),
  (
    'dual_occ_designer',
    'Dual occupancy designer',
    'Knockdown-rebuild and dual-occupancy layouts that maximise yield on suburban blocks.',
    'Dual occupancy',
    'South West Sydney',
    20
  ),
  (
    'interior_spatial',
    'Interior & spatial designer',
    'Kitchen, bathroom and living layouts once the builder package is selected.',
    'Interiors',
    'Greater Sydney',
    30
  )
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  specialty = EXCLUDED.specialty,
  service_area = EXCLUDED.service_area,
  is_active = TRUE,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.builder_published_packages (
  key, storeys, name, description, bedrooms, bathrooms, living_area_sqm,
  indicative_price, source_name, sort_order
) VALUES
  (
    'single_family',
    'single',
    'Single-storey family home',
    'Typical single-level package advertised by volume builders: open-plan living, three-way bathroom, double garage.',
    4, 2, 185, 420000, 'Typical published range', 10
  ),
  (
    'single_granny',
    'single',
    'Single-storey + granny flat',
    'Ground-floor living with a self-contained studio or granny flat at the rear — common published offering for ageing-in-place.',
    4, 3, 210, 495000, 'Typical published range', 20
  ),
  (
    'double_family',
    'double',
    'Double-storey family home',
    'Two-storey package with upstairs bedrooms, downstairs living and an upstairs rumpus — the most common published double-storey design.',
    4, 2.5, 240, 545000, 'Typical published range', 30
  ),
  (
    'double_five_bed',
    'double',
    'Double-storey 5-bed',
    'Larger two-storey design with five bedrooms, dual living and a theatre nook — typical of premium published ranges.',
    5, 3, 280, 625000, 'Typical published range', 40
  )
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  bedrooms = EXCLUDED.bedrooms,
  bathrooms = EXCLUDED.bathrooms,
  living_area_sqm = EXCLUDED.living_area_sqm,
  indicative_price = EXCLUDED.indicative_price,
  source_name = EXCLUDED.source_name,
  is_active = TRUE,
  sort_order = EXCLUDED.sort_order;

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
        'insurance_verified', bp.insurance_verified,
        'years_in_business', bp.years_in_business,
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
        AND ST_DWithin(bp.anchor_geom, ll.geom, bp.service_radius_km * 1000)
    ) matched
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_builders_near_listing(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_builders_for_map()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  company_name TEXT,
  google_rating NUMERIC,
  years_in_business INT,
  license_number TEXT,
  insurance_verified BOOLEAN,
  service_radius_km INT,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.company_name,
    bp.google_rating,
    bp.years_in_business,
    bp.license_number,
    bp.insurance_verified,
    bp.service_radius_km,
    ST_X(bp.anchor_geom::geometry) AS longitude,
    ST_Y(bp.anchor_geom::geometry) AS latitude
  FROM public.builder_profiles bp
  JOIN public.profiles p ON p.id = bp.id
  WHERE bp.is_onboarded = TRUE
    AND bp.anchor_geom IS NOT NULL
    AND p.role = 'builder'
  ORDER BY bp.google_rating DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_builders_for_map() TO authenticated;

-- Licensed NSW builders from the public Fair Trading / Verify NSW register.
-- These are directory records, not Velu user accounts.
--
-- Run ONLY this file in the Supabase SQL Editor.
-- Do not paste "npm run sync:nsw-builders" here — that is a terminal command
-- and will error with: syntax error at or near "npm".
-- After this migration succeeds, load the licence list from the app:
--   Admin → Data → Import Sydney snapshot
-- or from a terminal in the project folder:
--   npm run sync:nsw-builders

CREATE TABLE IF NOT EXISTS public.nsw_licensed_builders (
  id                         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  licence_number             TEXT NOT NULL UNIQUE,
  nsw_licence_id             TEXT,
  licensee                   TEXT NOT NULL,
  licensee_type              TEXT,
  licence_type               TEXT,
  status                     TEXT NOT NULL DEFAULT 'Current',
  granted_on                 DATE,
  expires_on                 DATE,
  suburb                     TEXT,
  state                      TEXT NOT NULL DEFAULT 'NSW',
  postcode                   TEXT,
  latitude                   DOUBLE PRECISION,
  longitude                  DOUBLE PRECISION,
  geom                       GEOGRAPHY(POINT, 4326),
  abn                        TEXT,
  acn                        TEXT,
  verify_url                 TEXT,
  google_place_id            TEXT,
  google_rating              NUMERIC(2, 1),
  google_review_count        INT,
  google_maps_url            TEXT,
  website_url                TEXT,
  last_property_sold_address TEXT,
  last_property_sold_at      DATE,
  avg_delay_weeks            NUMERIC(5, 1),
  source                     TEXT NOT NULL DEFAULT 'verify_nsw',
  last_synced_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  google_synced_at           TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nsw_licensed_builders_geom_idx
  ON public.nsw_licensed_builders USING GIST (geom);

CREATE INDEX IF NOT EXISTS nsw_licensed_builders_suburb_idx
  ON public.nsw_licensed_builders (suburb);

CREATE OR REPLACE FUNCTION public.nsw_licensed_builders_set_geom()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.geom := NULL;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS nsw_licensed_builders_set_geom ON public.nsw_licensed_builders;
CREATE TRIGGER nsw_licensed_builders_set_geom
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON public.nsw_licensed_builders
  FOR EACH ROW
  EXECUTE FUNCTION public.nsw_licensed_builders_set_geom();

ALTER TABLE public.nsw_licensed_builders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nsw_licensed_builders: authenticated read" ON public.nsw_licensed_builders;
CREATE POLICY "nsw_licensed_builders: authenticated read"
  ON public.nsw_licensed_builders FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "nsw_licensed_builders: admin manage" ON public.nsw_licensed_builders;
CREATE POLICY "nsw_licensed_builders: admin manage"
  ON public.nsw_licensed_builders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

GRANT SELECT ON public.nsw_licensed_builders TO authenticated;

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
        AND ST_DWithin(b.geom, ll.geom, GREATEST(p_radius_km, 5) * 1000)
      ORDER BY ST_Distance(b.geom, ll.geom)
      LIMIT GREATEST(LEAST(p_limit, 50), 1)
    ) matched
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_licensed_builders_near_listing(UUID, NUMERIC, INT) TO authenticated;

-- Velu MVP — optional site report add-ons for buyer-owned land onboarding

CREATE TYPE site_report_request_status AS ENUM (
  'requested',
  'quoted',
  'accepted',
  'in_progress',
  'delivered',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS public.site_report_definitions (
  key           TEXT PRIMARY KEY CHECK (key ~ '^[a-z0-9_]+$'),
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  price         NUMERIC(12, 2),
  pricing_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS site_report_definitions_active_idx
  ON public.site_report_definitions(is_active, sort_order);

CREATE TABLE IF NOT EXISTS public.site_report_requests (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_definition_key TEXT NOT NULL REFERENCES public.site_report_definitions(key) ON DELETE RESTRICT,
  land_listing_id       UUID NOT NULL REFERENCES public.land_listings(id) ON DELETE CASCADE,
  buyer_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status                site_report_request_status NOT NULL DEFAULT 'requested',
  buyer_notes           TEXT,
  quoted_price          NUMERIC(12, 2),
  pricing_snapshot      JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quoted_at             TIMESTAMPTZ,
  accepted_at           TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (land_listing_id, report_definition_key)
);

CREATE INDEX IF NOT EXISTS site_report_requests_buyer_idx
  ON public.site_report_requests(buyer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS site_report_requests_land_idx
  ON public.site_report_requests(land_listing_id);

CREATE INDEX IF NOT EXISTS site_report_requests_status_idx
  ON public.site_report_requests(status);

ALTER TABLE public.site_report_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_report_definitions: read active"
  ON public.site_report_definitions FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = TRUE);

CREATE POLICY "site_report_definitions: admin manage"
  ON public.site_report_definitions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

ALTER TABLE public.site_report_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_report_requests: read own"
  ON public.site_report_requests FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "site_report_requests: insert own requested"
  ON public.site_report_requests FOR INSERT
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

CREATE POLICY "site_report_requests: admin manage"
  ON public.site_report_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS site_report_definitions_updated_at ON public.site_report_definitions;
CREATE TRIGGER site_report_definitions_updated_at
  BEFORE UPDATE ON public.site_report_definitions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS site_report_requests_updated_at ON public.site_report_requests;
CREATE TRIGGER site_report_requests_updated_at
  BEFORE UPDATE ON public.site_report_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.site_report_definitions (
  key,
  name,
  description,
  price,
  pricing_rules,
  sort_order
) VALUES
  (
    'soil_report',
    'Soil Report',
    'Geotechnical soil classification for slab and foundation design, including AS 2870 site classification.',
    NULL,
    '{"pricing_model":"manual_quote","future_parameters":["land_size_sqm","suburb","postcode","soil_zone"]}'::jsonb,
    10
  ),
  (
    'site_survey',
    'Site Survey',
    'Contour and feature survey capturing levels, boundaries, services, and site features for design and approvals.',
    NULL,
    '{"pricing_model":"manual_quote","future_parameters":["land_size_sqm","suburb","postcode","site_access"]}'::jsonb,
    20
  )
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = COALESCE(public.site_report_definitions.price, EXCLUDED.price),
  pricing_rules = EXCLUDED.pricing_rules,
  is_active = TRUE,
  sort_order = EXCLUDED.sort_order;

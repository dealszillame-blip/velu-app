-- Verified Sydney builder criteria, extra add-on reports, provider portal,
-- tender knowledge base, and construction/builder type fields.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'report_provider';

ALTER TABLE public.builder_profiles
  ADD COLUMN IF NOT EXISTS builder_type TEXT
    CHECK (builder_type IS NULL OR builder_type IN ('bulk', 'semi_custom', 'custom', 'designer')),
  ADD COLUMN IF NOT EXISTS license_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS license_verify_url TEXT,
  ADD COLUMN IF NOT EXISTS last_property_sold_address TEXT,
  ADD COLUMN IF NOT EXISTS last_property_sold_at DATE,
  ADD COLUMN IF NOT EXISTS avg_delay_weeks NUMERIC(5, 1);

CREATE TABLE IF NOT EXISTS public.report_provider_profiles (
  id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  report_keys  TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_report_requests
  ADD COLUMN IF NOT EXISTS assigned_provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deliverable_url TEXT,
  ADD COLUMN IF NOT EXISTS result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS provider_notes TEXT;

CREATE INDEX IF NOT EXISTS site_report_requests_provider_idx
  ON public.site_report_requests(assigned_provider_id);

CREATE TABLE IF NOT EXISTS public.tender_knowledge_base (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key              TEXT UNIQUE,
  region           TEXT NOT NULL DEFAULT 'south_west_sydney',
  package_name     TEXT NOT NULL,
  builder_type     TEXT,
  construction_grade TEXT,
  bedrooms         INT,
  bathrooms        NUMERIC(3, 1),
  storeys          INT,
  living_area_sqm  NUMERIC(8, 2),
  base_price       NUMERIC(12, 2) NOT NULL,
  estimated_build_weeks INT,
  inclusions       TEXT,
  notes            TEXT,
  source_name      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tender_knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tender_knowledge_base: authenticated read" ON public.tender_knowledge_base;
CREATE POLICY "tender_knowledge_base: authenticated read"
  ON public.tender_knowledge_base FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = TRUE);

DROP POLICY IF EXISTS "tender_knowledge_base: admin manage" ON public.tender_knowledge_base;
CREATE POLICY "tender_knowledge_base: admin manage"
  ON public.tender_knowledge_base FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

INSERT INTO public.site_report_definitions (key, name, description, price, pricing_rules, is_active, sort_order)
VALUES
  (
    'third_party_inspection',
    '3rd party inspection',
    'Independent inspection of the build at nominated stages (slab, frame, lock-up, completion).',
    NULL,
    '{"pricing_model":"manual_quote","future_parameters":["stage","suburb"]}'::jsonb,
    TRUE,
    30
  ),
  (
    'bal_report',
    'BAL report',
    'Bushfire Attack Level assessment for BAL-rated construction and planning conditions.',
    NULL,
    '{"pricing_model":"manual_quote","future_parameters":["suburb","postcode"]}'::jsonb,
    TRUE,
    40
  ),
  (
    'acoustic_report',
    'Acoustic report',
    'Noise assessment for lots near roads, rail or flight paths, including glazing recommendations.',
    NULL,
    '{"pricing_model":"manual_quote","future_parameters":["suburb","postcode"]}'::jsonb,
    TRUE,
    50
  ),
  (
    'legal_check',
    'Legal check',
    'Contract and title review of the land and HIA/Master Builders package before you accept.',
    NULL,
    '{"pricing_model":"manual_quote"}'::jsonb,
    TRUE,
    60
  )
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  pricing_rules = EXCLUDED.pricing_rules,
  is_active = TRUE,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.tender_knowledge_base (
  key, region, package_name, builder_type, construction_grade,
  bedrooms, bathrooms, storeys, living_area_sqm, base_price,
  estimated_build_weeks, inclusions, notes, source_name
) VALUES
  (
    'sws-volume-4bed-2025',
    'south_west_sydney',
    'Volume 4-bed single storey (2025 cohort)',
    'bulk',
    'ground',
    4, 2, 1, 186, 465000, 28,
    'Stone benchtops, ducted AC, double garage, 6-year warranty',
    'Median of volume-builder packages on R2 lots 400–500m² in SW Sydney.',
    'Velu stored tenders'
  ),
  (
    'sws-family-5bed-granny-2025',
    'south_west_sydney',
    'Family 5-bed + granny (2025 cohort)',
    'semi_custom',
    'medium',
    5, 3, 1, 240, 540000, 33,
    'Granny flat, stone, ducted AC, solar-ready, landscaping',
    'Typical dual-living package used as a knowledge-base benchmark.',
    'Velu stored tenders'
  ),
  (
    'sws-luxury-double-2025',
    'south_west_sydney',
    'Luxury double storey (2025 cohort)',
    'custom',
    'luxury',
    5, 3, 2, 280, 720000, 38,
    'Stone, butler pantry, ducted 3-zone, solar, landscaping, 10-year warranty',
    'Upper-quartile custom packages for larger SW Sydney lots.',
    'Velu stored tenders'
  )
ON CONFLICT (key) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  inclusions = EXCLUDED.inclusions,
  notes = EXCLUDED.notes;

DROP POLICY IF EXISTS "site_report_requests: provider read assigned" ON public.site_report_requests;
CREATE POLICY "site_report_requests: provider read assigned"
  ON public.site_report_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text = 'report_provider'
    )
    AND (
      assigned_provider_id = auth.uid()
      OR (
        assigned_provider_id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.report_provider_profiles rpp
          WHERE rpp.id = auth.uid()
            AND site_report_requests.report_definition_key = ANY (rpp.report_keys)
        )
      )
    )
  );

DROP POLICY IF EXISTS "site_report_requests: provider update assigned" ON public.site_report_requests;
CREATE POLICY "site_report_requests: provider update assigned"
  ON public.site_report_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text = 'report_provider'
    )
    AND (
      assigned_provider_id = auth.uid()
      OR (
        assigned_provider_id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.report_provider_profiles rpp
          WHERE rpp.id = auth.uid()
            AND site_report_requests.report_definition_key = ANY (rpp.report_keys)
        )
      )
    )
  )
  WITH CHECK (
    assigned_provider_id = auth.uid()
  );

ALTER TABLE public.report_provider_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_provider_profiles: read own" ON public.report_provider_profiles;
CREATE POLICY "report_provider_profiles: read own"
  ON public.report_provider_profiles FOR SELECT
  USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "report_provider_profiles: write own" ON public.report_provider_profiles;
CREATE POLICY "report_provider_profiles: write own"
  ON public.report_provider_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "report_provider_profiles: update own" ON public.report_provider_profiles;
CREATE POLICY "report_provider_profiles: update own"
  ON public.report_provider_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "report_provider_profiles: admin manage" ON public.report_provider_profiles;
CREATE POLICY "report_provider_profiles: admin manage"
  ON public.report_provider_profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

GRANT SELECT, INSERT, UPDATE ON public.report_provider_profiles TO authenticated;
GRANT SELECT ON public.tender_knowledge_base TO authenticated;

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
        'is_license_valid', bp.is_license_valid,
        'license_verified_at', bp.license_verified_at,
        'license_verify_url', bp.license_verify_url,
        'insurance_verified', bp.insurance_verified,
        'years_in_business', bp.years_in_business,
        'builder_type', bp.builder_type,
        'last_property_sold_address', bp.last_property_sold_address,
        'last_property_sold_at', bp.last_property_sold_at,
        'avg_delay_weeks', bp.avg_delay_weeks,
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

-- Enrich existing demo builders so nearby cards show the minimum criteria.
UPDATE public.builder_profiles bp
SET
  builder_type = COALESCE(bp.builder_type, 'bulk'),
  google_rating = COALESCE(bp.google_rating, 4.6),
  google_review_count = COALESCE(bp.google_review_count, 42),
  is_license_valid = TRUE,
  license_verified_at = COALESCE(bp.license_verified_at, NOW()),
  license_verify_url = COALESCE(
    bp.license_verify_url,
    'https://verify.licence.nsw.gov.au/home/Trades'
  ),
  last_property_sold_address = COALESCE(bp.last_property_sold_address, '7 Wattle Grove, Leumeah'),
  last_property_sold_at = COALESCE(bp.last_property_sold_at, CURRENT_DATE - 40),
  avg_delay_weeks = COALESCE(bp.avg_delay_weeks, 1.5),
  profile_published = TRUE,
  insurance_verified = TRUE
WHERE bp.is_onboarded = TRUE;

-- Dhursan Homes (NSW contractor licences 369795C / 341107C) — Oran Park / Sydney SW.
DO $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = 'demo.dhursan@velu.dev' LIMIT 1;
  IF v_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.profiles (id, role, full_name, phone_number, company_name)
  VALUES (
    v_id,
    'builder',
    'Dhursan Homes',
    '0246663803',
    'Dhursan Homes Pty Ltd'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'builder',
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    phone_number = EXCLUDED.phone_number;

  INSERT INTO public.builder_profiles (
    id, license_number, license_expiry, is_license_valid, insurance_verified,
    service_radius_km, anchor_address, subscription_tier, is_onboarded,
    onboarding_status, onboarded_at, headline, google_rating, google_review_count,
    years_in_business, profile_published, website_url, builder_type,
    license_verified_at, license_verify_url,
    last_property_sold_address, last_property_sold_at, avg_delay_weeks
  ) VALUES (
    v_id,
    '369795C',
    '2029-06-17',
    TRUE,
    TRUE,
    45,
    'Suite 106, 3 Fordham Way, Oran Park NSW 2570',
    'pro',
    TRUE,
    'onboarded',
    NOW(),
    'House & land and new homes across South West Sydney. NSW licences 369795C and 341107C.',
    5.0,
    85,
    7,
    TRUE,
    'https://dhursanconstruction.com.au',
    'bulk',
    NOW(),
    'https://verify.licence.nsw.gov.au/results?searchTerm=dhursan&filter=search&status=all',
    'Lot 2209 Brabham Precinct, Oran Park',
    CURRENT_DATE - 21,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    license_number = EXCLUDED.license_number,
    license_expiry = EXCLUDED.license_expiry,
    is_license_valid = TRUE,
    insurance_verified = TRUE,
    service_radius_km = EXCLUDED.service_radius_km,
    anchor_address = EXCLUDED.anchor_address,
    is_onboarded = TRUE,
    headline = EXCLUDED.headline,
    google_rating = EXCLUDED.google_rating,
    google_review_count = EXCLUDED.google_review_count,
    years_in_business = EXCLUDED.years_in_business,
    profile_published = TRUE,
    website_url = EXCLUDED.website_url,
    builder_type = EXCLUDED.builder_type,
    license_verified_at = EXCLUDED.license_verified_at,
    license_verify_url = EXCLUDED.license_verify_url,
    last_property_sold_address = EXCLUDED.last_property_sold_address,
    last_property_sold_at = EXCLUDED.last_property_sold_at,
    avg_delay_weeks = EXCLUDED.avg_delay_weeks;

  PERFORM public.set_builder_anchor_geom(
    v_id,
    150.7442,
    -34.0051,
    'Suite 106, 3 Fordham Way, Oran Park NSW 2570'
  );

  INSERT INTO public.builder_compliance_notices (
    builder_id, title, body, source, severity, issued_at, is_active
  )
  SELECT
    v_id,
    'Fair Trading penalty notice (licence 341107C)',
    'A penalty notice is recorded against contractor licence 341107C in 2025. Confirm current status on Verify NSW before you sign.',
    'nsw_fair_trading',
    'warning',
    '2025-01-15',
    TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.builder_compliance_notices n
    WHERE n.builder_id = v_id AND n.title LIKE 'Fair Trading penalty%'
  );

  INSERT INTO public.builder_portfolio_projects (
    builder_id, title, location, completed_year, sort_order
  )
  SELECT v_id, 'Brabham Precinct house & land', 'Oran Park NSW', 2026, 1
  WHERE NOT EXISTS (
    SELECT 1 FROM public.builder_portfolio_projects p
    WHERE p.builder_id = v_id AND p.title = 'Brabham Precinct house & land'
  );
END $$;

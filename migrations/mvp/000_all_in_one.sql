-- Velu MVP � run this entire file once in Supabase SQL Editor


-- ========== 001_extensions_and_types.sql ==========

-- Velu MVP — extensions and types
-- Run in Supabase SQL Editor in order (001 → 005)

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE user_role AS ENUM (
  'buyer',
  'builder',
  'agent',
  'admin',
  'pending_agent'
);

CREATE TYPE listing_status AS ENUM ('available', 'under_offer', 'sold');

CREATE TYPE construction_milestone AS ENUM (
  'contract',
  'slab',
  'frame',
  'lockup',
  'fixing',
  'completion'
);

CREATE TYPE proposal_status AS ENUM (
  'draft',
  'pending',
  'viewed',
  'accepted',
  'rejected',
  'expired'
);

CREATE TYPE notification_type AS ENUM (
  'new_lead',
  'proposal_received',
  'proposal_accepted',
  'milestone_update',
  'license_expiry',
  'subscription_alert'
);

CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'premium');

CREATE TYPE inquiry_status AS ENUM (
  'inquiry_sent',
  'quote_received',
  'site_inspection_scheduled',
  'contract_signed',
  'closed'
);

CREATE TYPE builder_onboarding_status AS ENUM (
  'licence_pending',
  'insurance_pending',
  'designs_pending',
  'approval_pending',
  'onboarded'
);

-- ========== 002_mvp_tables.sql ==========

-- Velu MVP — core tables

CREATE TABLE public.profiles (
  id                      UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role                    user_role NOT NULL DEFAULT 'buyer',
  full_name               TEXT NOT NULL,
  phone_number            TEXT,
  company_name            TEXT,
  avatar_url              TEXT,
  agency_licence_number   TEXT,
  agency_licence_expiry   DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.land_listings (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  address           TEXT NOT NULL,
  suburb            TEXT NOT NULL,
  postcode          VARCHAR(4) NOT NULL,
  price             NUMERIC(12, 2) NOT NULL,
  land_size_sqm     NUMERIC(8, 2) NOT NULL,
  frontage_meters   NUMERIC(5, 2) NOT NULL,
  zoning            VARCHAR(10) NOT NULL,
  geom              GEOGRAPHY(Point, 4326) NOT NULL,
  status            listing_status NOT NULL DEFAULT 'available',
  buyer_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sold_at           TIMESTAMPTZ,
  lga               TEXT,
  gnaf_pid          TEXT,
  depth_meters      NUMERIC(5, 2),
  listing_category  TEXT NOT NULL DEFAULT 'vacant_land'
    CHECK (listing_category IN ('vacant_land')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX land_listings_geom_idx ON public.land_listings USING gist(geom);
CREATE INDEX land_listings_status_idx ON public.land_listings(status);
CREATE INDEX land_listings_postcode_idx ON public.land_listings(postcode);
CREATE INDEX land_listings_lga_idx ON public.land_listings(lga);

CREATE TABLE public.builder_profiles (
  id                  UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  license_number      TEXT NOT NULL,
  license_expiry      DATE,
  is_license_valid    BOOLEAN NOT NULL DEFAULT TRUE,
  insurance_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  service_radius_km   INT NOT NULL DEFAULT 25,
  anchor_address      TEXT,
  anchor_geom         GEOGRAPHY(Point, 4326),
  target_postcodes    TEXT[] NOT NULL DEFAULT '{}',
  target_lgas         TEXT[] NOT NULL DEFAULT '{}',
  subscription_tier   subscription_tier NOT NULL DEFAULT 'free',
  is_onboarded        BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_status   builder_onboarding_status NOT NULL DEFAULT 'licence_pending',
  onboarded_at        TIMESTAMPTZ,
  onboarding_notes    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX builder_profiles_anchor_geom_idx ON public.builder_profiles USING gist(anchor_geom);
CREATE INDEX builder_profiles_onboarded_idx ON public.builder_profiles(is_onboarded);

CREATE TABLE public.builder_designs (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  builder_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  min_frontage_meters NUMERIC(5, 2) NOT NULL,
  min_land_size_sqm   NUMERIC(8, 2) NOT NULL,
  max_land_size_sqm   NUMERIC(8, 2),
  suitable_zonings    TEXT[] NOT NULL DEFAULT '{}',
  storeys             INT NOT NULL DEFAULT 1,
  bedrooms            INT NOT NULL,
  bathrooms           NUMERIC(3, 1) NOT NULL,
  car_spaces          INT NOT NULL DEFAULT 1,
  floor_area_sqm      NUMERIC(8, 2),
  base_price          NUMERIC(12, 2) NOT NULL,
  price_matrix        JSONB NOT NULL DEFAULT '[]',
  floor_plan_url      TEXT,
  facade_render_url   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX builder_designs_builder_idx ON public.builder_designs(builder_id);
CREATE INDEX builder_designs_active_idx ON public.builder_designs(is_active);

CREATE TABLE public.builder_proposals (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  builder_id            UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  land_listing_id       UUID REFERENCES public.land_listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  package_name          TEXT NOT NULL,
  base_price            NUMERIC(12, 2) NOT NULL,
  inclusions            TEXT,
  estimated_build_weeks INT,
  notes                 TEXT,
  status                proposal_status NOT NULL DEFAULT 'pending',
  viewed_at             TIMESTAMPTZ,
  responded_at          TIMESTAMPTZ,
  price_valid_until     DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (builder_id, land_listing_id)
);

CREATE INDEX proposals_listing_idx ON public.builder_proposals(land_listing_id);

CREATE TABLE public.construction_projects (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id         UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  builder_id       UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  land_listing_id  UUID REFERENCES public.land_listings(id) ON DELETE SET NULL,
  current_stage    construction_milestone NOT NULL DEFAULT 'contract',
  stage_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stage_notes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type          notification_type NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_recipient_idx ON public.notifications(recipient_id, is_read);

CREATE TABLE public.feature_flags (
  key         TEXT PRIMARY KEY,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  module      TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.saved_searches (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL DEFAULT 'My Search',
  filters    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.builder_inquiries (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  builder_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  land_listing_id  UUID REFERENCES public.land_listings(id) ON DELETE SET NULL,
  status           inquiry_status NOT NULL DEFAULT 'inquiry_sent',
  message          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========== 003_mvp_rls.sql ==========

-- Velu MVP — row-level security

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

ALTER TABLE public.land_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings: read available"
  ON public.land_listings FOR SELECT
  USING (status = 'available');

CREATE POLICY "listings: read all (authenticated)"
  ON public.land_listings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "listings: insert (agent)"
  ON public.land_listings FOR INSERT
  WITH CHECK (
    auth.uid() = agent_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'agent'
    )
  );

CREATE POLICY "listings: update own (agent)"
  ON public.land_listings FOR UPDATE
  USING (
    auth.uid() = agent_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'agent'
    )
  );

ALTER TABLE public.builder_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "builder_profiles: read onboarded (authenticated)"
  ON public.builder_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_onboarded = TRUE);

CREATE POLICY "builder_profiles: read own"
  ON public.builder_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "builder_profiles: insert own"
  ON public.builder_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "builder_profiles: update own"
  ON public.builder_profiles FOR UPDATE
  USING (auth.uid() = id);

ALTER TABLE public.builder_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "builder_designs: read active"
  ON public.builder_designs FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "builder_designs: manage own"
  ON public.builder_designs FOR ALL
  USING (auth.uid() = builder_id)
  WITH CHECK (auth.uid() = builder_id);

ALTER TABLE public.builder_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals: read own (builder)"
  ON public.builder_proposals FOR SELECT
  USING (auth.uid() = builder_id);

CREATE POLICY "proposals: read received (buyer)"
  ON public.builder_proposals FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "proposals: insert (builder)"
  ON public.builder_proposals FOR INSERT
  WITH CHECK (
    auth.uid() = builder_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'builder'
    )
  );

CREATE POLICY "proposals: update own (builder)"
  ON public.builder_proposals FOR UPDATE
  USING (auth.uid() = builder_id);

CREATE POLICY "proposals: buyer respond"
  ON public.builder_proposals FOR UPDATE
  USING (auth.uid() = buyer_id);

ALTER TABLE public.construction_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects: read (participant)"
  ON public.construction_projects FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = builder_id);

CREATE POLICY "projects: insert (builder)"
  ON public.construction_projects FOR INSERT
  WITH CHECK (
    auth.uid() = builder_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'builder'
    )
  );

CREATE POLICY "projects: update (builder)"
  ON public.construction_projects FOR UPDATE
  USING (auth.uid() = builder_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: read own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "notifications: mark read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flags: read authenticated"
  ON public.feature_flags FOR SELECT
  USING (auth.uid() IS NOT NULL);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_searches: manage own"
  ON public.saved_searches FOR ALL
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

ALTER TABLE public.builder_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inquiries: buyer manage"
  ON public.builder_inquiries FOR ALL
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "inquiries: builder read"
  ON public.builder_inquiries FOR SELECT
  USING (auth.uid() = builder_id);

CREATE POLICY "inquiries: builder update"
  ON public.builder_inquiries FOR UPDATE
  USING (auth.uid() = builder_id);

-- ========== 004_mvp_functions.sql ==========

-- Velu MVP — triggers and utility functions

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER land_listings_updated_at
  BEFORE UPDATE ON public.land_listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER builder_profiles_updated_at
  BEFORE UPDATE ON public.builder_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER builder_designs_updated_at
  BEFORE UPDATE ON public.builder_designs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER builder_inquiries_updated_at
  BEFORE UPDATE ON public.builder_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.get_builders_near_listing(p_listing_id UUID)
RETURNS TABLE (
  id            UUID,
  full_name     TEXT,
  email         TEXT,
  phone_number  TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    au.email::TEXT,
    p.phone_number
  FROM public.builder_profiles bp
  JOIN public.profiles p ON p.id = bp.id
  JOIN auth.users au ON au.id = bp.id
  JOIN public.land_listings ll ON ll.id = p_listing_id
  WHERE
    bp.is_onboarded = TRUE
    AND bp.anchor_geom IS NOT NULL
    AND ST_DWithin(
      bp.anchor_geom,
      ll.geom,
      bp.service_radius_km * 1000
    );
$$ LANGUAGE sql;

GRANT EXECUTE ON FUNCTION public.get_builders_near_listing(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims JSONB;
  user_role TEXT;
BEGIN
  SELECT role::TEXT INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::UUID;

  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role, 'buyer')));
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM authenticated;

CREATE OR REPLACE FUNCTION public.set_builder_anchor_geom(
  p_builder_id UUID,
  p_longitude DOUBLE PRECISION,
  p_latitude DOUBLE PRECISION,
  p_address TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.builder_profiles
  SET
    anchor_address = p_address,
    anchor_geom = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
  WHERE id = p_builder_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_builder_anchor_geom(UUID, DOUBLE PRECISION, DOUBLE PRECISION, TEXT)
  TO authenticated;

-- ========== 005_feature_flags.sql ==========

-- Velu MVP — feature flag seed data

INSERT INTO public.feature_flags (key, module, description, enabled) VALUES
  ('HIA_TENDER_PDF',        'module2', 'Full HIA tender form + PDF generation',                 FALSE),
  ('STRIPE_BILLING',        'module3', 'Stripe subscription tiers and quota enforcement',       FALSE),
  ('PROPTRACK_SYNC',        'module4', 'Daily PropTrack/Domain API sync cron',                  FALSE),
  ('FAIR_TRADING_SCRAPER',  'module4', 'Weekly NSW Fair Trading licence validation cron',       FALSE),
  ('ADMIN_PANEL',           'module5', 'Admin dashboard, builder verification, agent approval',   FALSE),
  ('ADVANCED_COMPARATOR',   'module6', 'Inclusions diff, full tender comparison columns',       FALSE),
  ('MILESTONE_PHOTOS',      'module7', 'Photo upload + certificate downloads on milestones',    FALSE),
  ('SMS_NOTIFICATIONS',     'module8', 'Twilio SMS alerts to builders on lead',                 FALSE),
  ('EMAIL_NOTIFICATIONS',   'module8', 'SendGrid dynamic email templates',                      FALSE),
  ('TRADES_ECOSYSTEM',      'module9', 'Phase 3 trades platform',                              FALSE),
  ('BUILDER_ONBOARDING_GATE', 'mvp',   'Enforce is_onboarded=TRUE as lead access gate',         TRUE);

-- ========== 006_realtime.sql ==========

-- Velu MVP — enable Realtime on key tables (Week 3 lead feed + notifications)

-- Required for Realtime UPDATE events (sold status changes)
ALTER TABLE public.land_listings REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.construction_projects REPLICA IDENTITY FULL;

-- Add tables to Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.land_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.construction_projects;

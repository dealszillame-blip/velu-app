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

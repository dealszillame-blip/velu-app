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

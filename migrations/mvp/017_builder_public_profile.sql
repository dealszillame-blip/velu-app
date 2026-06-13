-- Velu MVP — LinkedIn-style builder public profile

ALTER TABLE public.builder_profiles
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS google_rating NUMERIC(2, 1),
  ADD COLUMN IF NOT EXISTS google_review_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS years_in_business INT,
  ADD COLUMN IF NOT EXISTS profile_published BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.builder_portfolio_projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  location       TEXT,
  completed_year INT,
  image_url      TEXT,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS builder_portfolio_builder_idx
  ON public.builder_portfolio_projects(builder_id, sort_order);

CREATE TABLE IF NOT EXISTS public.builder_google_review_highlights (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_name  TEXT NOT NULL,
  rating         INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text    TEXT NOT NULL,
  reviewed_at    DATE,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS builder_google_reviews_builder_idx
  ON public.builder_google_review_highlights(builder_id, sort_order);

CREATE TABLE IF NOT EXISTS public.builder_product_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_name   TEXT NOT NULL,
  reviewer_name  TEXT NOT NULL,
  rating         INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text    TEXT NOT NULL,
  reviewed_at    DATE,
  is_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS builder_product_reviews_builder_idx
  ON public.builder_product_reviews(builder_id, sort_order);

CREATE TABLE IF NOT EXISTS public.builder_gallery_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  caption     TEXT,
  category    TEXT NOT NULL DEFAULT 'project'
    CHECK (category IN ('project', 'team', 'site', 'completion')),
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS builder_gallery_builder_idx
  ON public.builder_gallery_images(builder_id, sort_order);

ALTER TABLE public.builder_portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_google_review_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio: manage own"
  ON public.builder_portfolio_projects FOR ALL
  USING (auth.uid() = builder_id)
  WITH CHECK (auth.uid() = builder_id);

CREATE POLICY "portfolio: read published"
  ON public.builder_portfolio_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.builder_profiles bp
      WHERE bp.id = builder_id
        AND bp.is_onboarded
        AND (bp.profile_published OR auth.uid() = builder_id)
    )
  );

CREATE POLICY "google_reviews: manage own"
  ON public.builder_google_review_highlights FOR ALL
  USING (auth.uid() = builder_id)
  WITH CHECK (auth.uid() = builder_id);

CREATE POLICY "google_reviews: read published"
  ON public.builder_google_review_highlights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.builder_profiles bp
      WHERE bp.id = builder_id
        AND bp.is_onboarded
        AND (bp.profile_published OR auth.uid() = builder_id)
    )
  );

CREATE POLICY "product_reviews: manage own"
  ON public.builder_product_reviews FOR ALL
  USING (auth.uid() = builder_id)
  WITH CHECK (auth.uid() = builder_id);

CREATE POLICY "product_reviews: read published"
  ON public.builder_product_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.builder_profiles bp
      WHERE bp.id = builder_id
        AND bp.is_onboarded
        AND (bp.profile_published OR auth.uid() = builder_id)
    )
  );

CREATE POLICY "gallery: manage own"
  ON public.builder_gallery_images FOR ALL
  USING (auth.uid() = builder_id)
  WITH CHECK (auth.uid() = builder_id);

CREATE POLICY "gallery: read published"
  ON public.builder_gallery_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.builder_profiles bp
      WHERE bp.id = builder_id
        AND bp.is_onboarded
        AND (bp.profile_published OR auth.uid() = builder_id)
    )
  );

CREATE OR REPLACE FUNCTION public.get_builder_public_profile(p_builder_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'company_name', p.company_name,
    'avatar_url', p.avatar_url,
    'headline', bp.headline,
    'bio', bp.bio,
    'cover_image_url', bp.cover_image_url,
    'google_maps_url', bp.google_maps_url,
    'google_rating', bp.google_rating,
    'google_review_count', bp.google_review_count,
    'website_url', bp.website_url,
    'years_in_business', bp.years_in_business,
    'service_radius_km', bp.service_radius_km,
    'anchor_address', bp.anchor_address,
    'is_onboarded', bp.is_onboarded,
    'profile_published', bp.profile_published,
    'license_number', bp.license_number,
    'insurance_verified', bp.insurance_verified
  )
  INTO v_profile
  FROM public.profiles p
  JOIN public.builder_profiles bp ON bp.id = p.id
  WHERE p.id = p_builder_id
    AND p.role = 'builder'
    AND bp.is_onboarded = TRUE
    AND (
      bp.profile_published = TRUE
      OR auth.uid() = p_builder_id
    );

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_profile || jsonb_build_object(
    'portfolio', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pp.id,
          'title', pp.title,
          'description', pp.description,
          'location', pp.location,
          'completed_year', pp.completed_year,
          'image_url', pp.image_url,
          'sort_order', pp.sort_order
        ) ORDER BY pp.sort_order, pp.created_at
      )
      FROM public.builder_portfolio_projects pp
      WHERE pp.builder_id = p_builder_id
    ), '[]'::jsonb),
    'google_reviews', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', gr.id,
          'reviewer_name', gr.reviewer_name,
          'rating', gr.rating,
          'review_text', gr.review_text,
          'reviewed_at', gr.reviewed_at,
          'sort_order', gr.sort_order
        ) ORDER BY gr.sort_order, gr.created_at
      )
      FROM public.builder_google_review_highlights gr
      WHERE gr.builder_id = p_builder_id
    ), '[]'::jsonb),
    'product_reviews', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pr.id,
          'product_name', pr.product_name,
          'reviewer_name', pr.reviewer_name,
          'rating', pr.rating,
          'review_text', pr.review_text,
          'reviewed_at', pr.reviewed_at,
          'is_verified', pr.is_verified,
          'sort_order', pr.sort_order
        ) ORDER BY pr.sort_order, pr.created_at
      )
      FROM public.builder_product_reviews pr
      WHERE pr.builder_id = p_builder_id
    ), '[]'::jsonb),
    'gallery', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', gi.id,
          'image_url', gi.image_url,
          'caption', gi.caption,
          'category', gi.category,
          'sort_order', gi.sort_order
        ) ORDER BY gi.sort_order, gi.created_at
      )
      FROM public.builder_gallery_images gi
      WHERE gi.builder_id = p_builder_id
    ), '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_builder_public_profile(UUID) TO authenticated, anon;

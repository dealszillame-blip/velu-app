-- Velu MVP — buyer build requirements (captured at registration)

CREATE TABLE IF NOT EXISTS public.buyer_profiles (
  id                      UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  build_requirements      JSONB NOT NULL DEFAULT '{}'::jsonb,
  requirements_completed_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS buyer_profiles_completed_idx
  ON public.buyer_profiles(requirements_completed_at);

ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer_profiles: read own"
  ON public.buyer_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "buyer_profiles: insert own"
  ON public.buyer_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'buyer'
    )
  );

CREATE POLICY "buyer_profiles: update own"
  ON public.buyer_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "buyer_profiles: read (builder on sold lead)"
  ON public.buyer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'builder'
    )
    AND EXISTS (
      SELECT 1 FROM public.land_listings ll
      WHERE ll.buyer_id = buyer_profiles.id
        AND ll.status = 'sold'
    )
  );

CREATE OR REPLACE FUNCTION public.get_buyer_build_requirements(p_buyer_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bp.build_requirements
  FROM public.buyer_profiles bp
  JOIN public.profiles p ON p.id = bp.id
  WHERE bp.id = p_buyer_id
    AND p.role = 'buyer'
    AND (
      auth.uid() = p_buyer_id
      OR (
        EXISTS (
          SELECT 1 FROM public.profiles viewer
          WHERE viewer.id = auth.uid() AND viewer.role = 'builder'
        )
        AND EXISTS (
          SELECT 1 FROM public.land_listings ll
          WHERE ll.buyer_id = p_buyer_id AND ll.status = 'sold'
        )
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_buyer_build_requirements(UUID) TO authenticated;

DROP TRIGGER IF EXISTS buyer_profiles_updated_at ON public.buyer_profiles;
CREATE TRIGGER buyer_profiles_updated_at
  BEFORE UPDATE ON public.buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Demo buyer build requirements (after demo users exist)
DO $$
DECLARE
  v_buyer1 UUID;
  v_buyer2 UUID;
BEGIN
  SELECT id INTO v_buyer1 FROM auth.users WHERE email = 'demo.buyer@velu.dev' LIMIT 1;
  SELECT id INTO v_buyer2 FROM auth.users WHERE email = 'demo.buyer2@velu.dev' LIMIT 1;

  IF v_buyer1 IS NOT NULL THEN
    INSERT INTO public.buyer_profiles (id, build_requirements, requirements_completed_at)
    VALUES (
      v_buyer1,
      '{"storeys":"ground_plus_one","granny_flat":"no","bedrooms":4,"bathrooms":2,"car_spaces":2,"additional_notes":"Open-plan living, study nook, covered alfresco."}'::jsonb,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      build_requirements = EXCLUDED.build_requirements,
      requirements_completed_at = EXCLUDED.requirements_completed_at;
  END IF;

  IF v_buyer2 IS NOT NULL THEN
    INSERT INTO public.buyer_profiles (id, build_requirements, requirements_completed_at)
    VALUES (
      v_buyer2,
      '{"storeys":"ground_only","granny_flat":"yes","bedrooms":5,"bathrooms":3,"car_spaces":2,"additional_notes":"Single-level living, granny flat for parents."}'::jsonb,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      build_requirements = EXCLUDED.build_requirements,
      requirements_completed_at = EXCLUDED.requirements_completed_at;
  END IF;
END $$;

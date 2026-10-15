-- Velu MVP — builder-supplied milestone payment details
-- SQL only. Paste this file into the Supabase SQL Editor. This is not an npm command.
-- Velu does not process, hold, or transfer money. The account fields are text the builder typed.
-- They are not verified with a bank. Buyers pay the builder outside Velu.

-- 1. Details live on the builder profile so every project for that builder shows the same account.
ALTER TABLE public.builder_profiles
  ADD COLUMN IF NOT EXISTS account_name TEXT,
  ADD COLUMN IF NOT EXISTS bsb TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'builder_profiles_account_name_check'
  ) THEN
    ALTER TABLE public.builder_profiles
      ADD CONSTRAINT builder_profiles_account_name_check
      CHECK (account_name IS NULL OR char_length(btrim(account_name)) BETWEEN 2 AND 80);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'builder_profiles_bsb_check'
  ) THEN
    ALTER TABLE public.builder_profiles
      ADD CONSTRAINT builder_profiles_bsb_check
      CHECK (bsb IS NULL OR bsb ~ '^[0-9]{6}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'builder_profiles_account_number_check'
  ) THEN
    ALTER TABLE public.builder_profiles
      ADD CONSTRAINT builder_profiles_account_number_check
      CHECK (account_number IS NULL OR account_number ~ '^[0-9]{5,10}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'builder_profiles_payment_details_complete_check'
  ) THEN
    ALTER TABLE public.builder_profiles
      ADD CONSTRAINT builder_profiles_payment_details_complete_check
      CHECK (
        (account_name IS NULL AND bsb IS NULL AND account_number IS NULL)
        OR (account_name IS NOT NULL AND bsb IS NOT NULL AND account_number IS NOT NULL)
      );
  END IF;
END
$$;

-- Table-level SELECT cannot be narrowed with a column REVOKE. Re-grant every column
-- except the three payment fields so a signed-in user cannot read every builder's
-- account from the Data API. Project buyers read them through the function below.
-- service_role is unchanged and can still read the columns for server jobs.
REVOKE SELECT ON TABLE public.builder_profiles FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  license_number,
  license_expiry,
  is_license_valid,
  insurance_verified,
  service_radius_km,
  anchor_address,
  anchor_geom,
  target_postcodes,
  target_lgas,
  subscription_tier,
  is_onboarded,
  onboarding_status,
  onboarded_at,
  onboarding_notes,
  created_at,
  updated_at,
  headline,
  bio,
  cover_image_url,
  google_maps_url,
  google_rating,
  google_review_count,
  website_url,
  years_in_business,
  profile_published,
  builder_type,
  license_verified_at,
  license_verify_url,
  last_property_sold_address,
  last_property_sold_at,
  avg_delay_weeks
) ON TABLE public.builder_profiles TO anon, authenticated;

-- 2. A stage moves only after the builder records that they received that stage's payment.
CREATE TABLE IF NOT EXISTS public.milestone_payment_confirmations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  stage         public.construction_milestone NOT NULL,
  confirmed_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  confirmed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'milestone_payment_confirmations_project_stage_key'
  ) THEN
    ALTER TABLE public.milestone_payment_confirmations
      ADD CONSTRAINT milestone_payment_confirmations_project_stage_key
      UNIQUE (project_id, stage);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS milestone_payment_confirmations_project_idx
  ON public.milestone_payment_confirmations(project_id);

ALTER TABLE public.milestone_payment_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "milestone payments: read participants"
  ON public.milestone_payment_confirmations;
CREATE POLICY "milestone payments: read participants"
  ON public.milestone_payment_confirmations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND (cp.buyer_id = auth.uid() OR cp.builder_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "milestone payments: builder confirms current stage"
  ON public.milestone_payment_confirmations;
CREATE POLICY "milestone payments: builder confirms current stage"
  ON public.milestone_payment_confirmations FOR INSERT
  WITH CHECK (
    confirmed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND cp.builder_id = auth.uid()
        AND cp.current_stage = stage
        AND cp.current_stage IS DISTINCT FROM 'completion'::public.construction_milestone
    )
  );

GRANT SELECT, INSERT ON public.milestone_payment_confirmations TO authenticated;

-- 3. Read the account only for the buyer or builder on that project.
CREATE OR REPLACE FUNCTION public.get_project_builder_payment_details(p_project_id UUID)
RETURNS TABLE (
  account_name TEXT,
  bsb TEXT,
  account_number TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT bp.account_name, bp.bsb, bp.account_number
  FROM public.construction_projects cp
  JOIN public.builder_profiles bp ON bp.id = cp.builder_id
  WHERE cp.id = p_project_id
    AND (cp.buyer_id = auth.uid() OR cp.builder_id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_own_builder_payment_details()
RETURNS TABLE (
  account_name TEXT,
  bsb TEXT,
  account_number TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT bp.account_name, bp.bsb, bp.account_number
  FROM public.builder_profiles bp
  WHERE bp.id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.get_project_builder_payment_details(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_own_builder_payment_details() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_builder_payment_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_builder_payment_details() TO authenticated;

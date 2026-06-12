-- Velu MVP — detailed proposal breakdown + builder templates

ALTER TABLE public.builder_proposals
  ADD COLUMN IF NOT EXISTS price_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS inclusion_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS home_specs JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.builder_proposal_templates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  package_name          TEXT NOT NULL,
  estimated_build_weeks INT,
  notes                 TEXT,
  price_breakdown       JSONB NOT NULL DEFAULT '[]'::jsonb,
  inclusion_items       JSONB NOT NULL DEFAULT '[]'::jsonb,
  home_specs            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS builder_proposal_templates_builder_idx
  ON public.builder_proposal_templates(builder_id);

ALTER TABLE public.builder_proposal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates: builder read own"
  ON public.builder_proposal_templates FOR SELECT
  USING (auth.uid() = builder_id);

CREATE POLICY "templates: builder insert own"
  ON public.builder_proposal_templates FOR INSERT
  WITH CHECK (
    auth.uid() = builder_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'builder'
    )
  );

CREATE POLICY "templates: builder update own"
  ON public.builder_proposal_templates FOR UPDATE
  USING (auth.uid() = builder_id);

CREATE POLICY "templates: builder delete own"
  ON public.builder_proposal_templates FOR DELETE
  USING (auth.uid() = builder_id);

-- Extend buyer proposal RPC with breakdown fields
DROP FUNCTION IF EXISTS public.get_proposals_for_buyer(UUID);

CREATE OR REPLACE FUNCTION public.get_proposals_for_buyer(p_buyer_id UUID)
RETURNS TABLE (
  id UUID,
  builder_id UUID,
  builder_name TEXT,
  land_listing_id UUID,
  listing_address TEXT,
  listing_suburb TEXT,
  package_name TEXT,
  base_price NUMERIC,
  inclusions TEXT,
  estimated_build_weeks INT,
  notes TEXT,
  price_breakdown JSONB,
  inclusion_items JSONB,
  home_specs JSONB,
  status proposal_status,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bp.id,
    bp.builder_id,
    COALESCE(p.company_name, p.full_name) AS builder_name,
    bp.land_listing_id,
    ll.address AS listing_address,
    ll.suburb AS listing_suburb,
    bp.package_name,
    bp.base_price,
    bp.inclusions,
    bp.estimated_build_weeks,
    bp.notes,
    bp.price_breakdown,
    bp.inclusion_items,
    bp.home_specs,
    bp.status,
    bp.created_at
  FROM public.builder_proposals bp
  JOIN public.profiles p ON p.id = bp.builder_id
  JOIN public.land_listings ll ON ll.id = bp.land_listing_id
  WHERE
    bp.buyer_id = p_buyer_id
    OR (bp.buyer_id IS NULL AND ll.buyer_id = p_buyer_id)
  ORDER BY bp.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_proposals_for_buyer(UUID) TO authenticated;

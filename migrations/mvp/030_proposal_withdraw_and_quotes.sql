-- Velu MVP — Phase 1 quotes, withdraw, and contract type
-- SQL only. Paste this file into the Supabase SQL Editor. This is not an npm command.
-- IMMUTABLE fix: the partial unique index compares proposal_status directly (no status::text). Enum-to-text is STABLE, so Postgres rejects it in an index predicate (42P17).

-- 1. Allow builders to withdraw a pending/viewed proposal so they can resubmit.
ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'withdrawn';

-- 2. Quote contract type on the existing proposal (and template) rows.
--    JSONB line items stay on price_breakdown; no HIA PDF table.
ALTER TABLE public.builder_proposals
  ADD COLUMN IF NOT EXISTS contract_type TEXT;

ALTER TABLE public.builder_proposal_templates
  ADD COLUMN IF NOT EXISTS contract_type TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'builder_proposals_contract_type_check'
  ) THEN
    ALTER TABLE public.builder_proposals
      ADD CONSTRAINT builder_proposals_contract_type_check
      CHECK (
        contract_type IS NULL
        OR contract_type IN ('fixed_price', 'cost_plus', 'hybrid')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'builder_proposal_templates_contract_type_check'
  ) THEN
    ALTER TABLE public.builder_proposal_templates
      ADD CONSTRAINT builder_proposal_templates_contract_type_check
      CHECK (
        contract_type IS NULL
        OR contract_type IN ('fixed_price', 'cost_plus', 'hybrid')
      );
  END IF;
END
$$;

UPDATE public.builder_proposals
SET contract_type = 'fixed_price'
WHERE contract_type IS NULL;

-- 3. Replace UNIQUE (builder_id, land_listing_id) with a partial unique index
--    so withdrawn/expired rows do not block a second submit.
--    Drop first so a re-paste replaces a failed or older index definition.
--    Compare the enum with IN (labels that already exist). That is the same set as
--    NOT IN ('withdrawn', 'expired'), without a status::text cast and without using
--    the new 'withdrawn' label in this transaction (Postgres cannot use a value
--    added above until that ADD VALUE commits).
ALTER TABLE public.builder_proposals
  DROP CONSTRAINT IF EXISTS builder_proposals_builder_id_land_listing_id_key;

DROP INDEX IF EXISTS builder_proposals_builder_id_land_listing_id_key;

DROP INDEX IF EXISTS public.builder_proposals_one_active_per_listing;

CREATE UNIQUE INDEX IF NOT EXISTS builder_proposals_one_active_per_listing
  ON public.builder_proposals (builder_id, land_listing_id)
  WHERE status IN ('draft', 'pending', 'viewed', 'accepted', 'rejected');

-- 4. Compare RPC: contract_type on the card; hide withdrawn resubmits.
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
  contract_type TEXT,
  price_breakdown JSONB,
  inclusion_items JSONB,
  home_specs JSONB,
  status proposal_status,
  created_at TIMESTAMPTZ,
  license_number TEXT,
  license_verify_url TEXT,
  is_license_valid BOOLEAN,
  insurance_verified BOOLEAN
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
    bp.contract_type,
    bp.price_breakdown,
    bp.inclusion_items,
    bp.home_specs,
    bp.status,
    bp.created_at,
    bpr.license_number,
    bpr.license_verify_url,
    bpr.is_license_valid,
    bpr.insurance_verified
  FROM public.builder_proposals bp
  JOIN public.profiles p ON p.id = bp.builder_id
  JOIN public.land_listings ll ON ll.id = bp.land_listing_id
  LEFT JOIN public.builder_profiles bpr ON bpr.id = bp.builder_id
  WHERE
    bp.status::text <> 'withdrawn'
    AND (
      bp.buyer_id = p_buyer_id
      OR (bp.buyer_id IS NULL AND ll.buyer_id = p_buyer_id)
    )
  ORDER BY bp.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_proposals_for_buyer(UUID) TO authenticated;

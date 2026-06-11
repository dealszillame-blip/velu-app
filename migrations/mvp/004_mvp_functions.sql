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

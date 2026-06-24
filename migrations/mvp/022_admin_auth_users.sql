-- Velu MVP — admin auth user listing (service_role only)

CREATE OR REPLACE FUNCTION public.admin_list_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  raw_user_meta_data jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT u.id, u.email::text, u.created_at, u.raw_user_meta_data
  FROM auth.users u
  ORDER BY u.created_at DESC
  LIMIT 1000;
$$;

REVOKE ALL ON FUNCTION public.admin_list_auth_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_auth_users() TO service_role;

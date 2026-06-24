-- Velu — promote an existing account to admin
--
-- BEFORE RUNNING:
-- 1. The person must already have a Velu account (signed up via /register/buyer etc.)
--    OR exist in Supabase → Authentication → Users
-- 2. Replace the email below with the account you want to promote
--
-- AFTER RUNNING:
-- Sign in at /login, then open /admin/dashboard

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'dealszillame@gmail.com';  -- ← change this
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found for %. Sign up first, or create the user in Supabase Auth → Users.', v_email;
  END IF;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (v_user_id, 'admin', split_part(v_email, '@', 1))
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';

  RAISE NOTICE 'Admin access granted for % (id: %)', v_email, v_user_id;
END $$;

-- Verify:
SELECT p.id, au.email, p.role, p.full_name
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.role = 'admin';

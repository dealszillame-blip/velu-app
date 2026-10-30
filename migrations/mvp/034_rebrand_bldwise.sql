-- bldwise — rename stored brand strings and demo fixture logins.
-- Paste into the Supabase SQL Editor on databases that already ran 001–033.
-- Real customer accounts are not changed. Only the seeded demo emails are.

DO $$
BEGIN
  IF to_regclass('public.tender_knowledge_base') IS NOT NULL THEN
    UPDATE public.tender_knowledge_base
    SET source_name = 'bldwise stored tenders'
    WHERE source_name = 'Velu stored tenders';
  END IF;

  IF to_regclass('public.project_defects') IS NOT NULL THEN
    EXECUTE $comment$
      COMMENT ON TABLE public.project_defects IS
        'Post-handover defects between the buyer and the builder. bldwise does not lodge warranty claims, hold retention, or decide disputes.'
    $comment$;
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Demo password first, while the addresses are still the old ones.
UPDATE auth.users
SET encrypted_password = crypt('bldwiseDemo123!', gen_salt('bf'))
WHERE email IN (
  'demo.buyer@velu.dev',
  'demo.buyer2@velu.dev',
  'demo.builder@velu.dev',
  'demo.builder2@velu.dev',
  'demo.builder3@velu.dev',
  'demo.dhursan@velu.dev',
  'demo.soil@velu.dev',
  'demo.survey@velu.dev'
);

UPDATE auth.identities AS i
SET
  identity_data = CASE
    WHEN i.identity_data IS NULL THEN i.identity_data
    ELSE jsonb_set(
      i.identity_data,
      '{email}',
      to_jsonb(replace(i.identity_data->>'email', '@velu.dev', '@bldwise.dev'))
    )
  END,
  provider_id = CASE
    WHEN i.provider_id LIKE '%@velu.dev'
      THEN replace(i.provider_id, '@velu.dev', '@bldwise.dev')
    ELSE i.provider_id
  END
FROM auth.users AS u
WHERE i.user_id = u.id
  AND u.email IN (
    'demo.buyer@velu.dev',
    'demo.buyer2@velu.dev',
    'demo.builder@velu.dev',
    'demo.builder2@velu.dev',
    'demo.builder3@velu.dev',
    'demo.dhursan@velu.dev',
    'demo.soil@velu.dev',
    'demo.survey@velu.dev'
  );

UPDATE auth.users
SET email = replace(email, '@velu.dev', '@bldwise.dev')
WHERE email IN (
  'demo.buyer@velu.dev',
  'demo.buyer2@velu.dev',
  'demo.builder@velu.dev',
  'demo.builder2@velu.dev',
  'demo.builder3@velu.dev',
  'demo.dhursan@velu.dev',
  'demo.soil@velu.dev',
  'demo.survey@velu.dev'
);

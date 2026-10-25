-- Private storage for site documents a buyer attaches to their block.
-- Safe to re-run. Does not change build stages.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'buyer-site-documents',
  'buyer-site-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "buyer site documents insert" ON storage.objects;
DROP POLICY IF EXISTS "buyer site documents select" ON storage.objects;
DROP POLICY IF EXISTS "buyer site documents update" ON storage.objects;
DROP POLICY IF EXISTS "buyer site documents delete" ON storage.objects;

CREATE POLICY "buyer site documents insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'buyer-site-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "buyer site documents select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'buyer-site-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "buyer site documents update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'buyer-site-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "buyer site documents delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'buyer-site-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

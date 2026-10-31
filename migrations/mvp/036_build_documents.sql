-- Documents a buyer attaches to a construction project.
-- The builder on that project can open them. Safe to re-run.
-- Paste this file into the Supabase SQL Editor. This is not an npm command.

CREATE TABLE IF NOT EXISTS public.project_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  uploaded_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  file_name     TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_documents DROP CONSTRAINT IF EXISTS project_documents_file_name_check;
ALTER TABLE public.project_documents
  ADD CONSTRAINT project_documents_file_name_check
  CHECK (char_length(btrim(file_name)) BETWEEN 1 AND 180);

ALTER TABLE public.project_documents DROP CONSTRAINT IF EXISTS project_documents_storage_path_check;
ALTER TABLE public.project_documents
  ADD CONSTRAINT project_documents_storage_path_check
  CHECK (char_length(storage_path) BETWEEN 3 AND 500);

CREATE UNIQUE INDEX IF NOT EXISTS project_documents_storage_path_key
  ON public.project_documents (storage_path);

CREATE INDEX IF NOT EXISTS project_documents_project_created_idx
  ON public.project_documents (project_id, created_at);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project documents: participants read" ON public.project_documents;
CREATE POLICY "project documents: participants read"
  ON public.project_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND (cp.buyer_id = auth.uid() OR cp.builder_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "project documents: buyer inserts" ON public.project_documents;
CREATE POLICY "project documents: buyer inserts"
  ON public.project_documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND cp.buyer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "project documents: buyer deletes" ON public.project_documents;
CREATE POLICY "project documents: buyer deletes"
  ON public.project_documents FOR DELETE
  USING (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND cp.buyer_id = auth.uid()
    )
  );

REVOKE ALL ON TABLE public.project_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.project_documents TO authenticated;

COMMENT ON TABLE public.project_documents IS
  'Files the buyer adds to a build. The buyer and the builder on that project can read them.';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'build-documents',
  'build-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "build documents insert" ON storage.objects;
DROP POLICY IF EXISTS "build documents select" ON storage.objects;
DROP POLICY IF EXISTS "build documents delete" ON storage.objects;

CREATE POLICY "build documents insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'build-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT cp.id::text
      FROM public.construction_projects cp
      WHERE cp.buyer_id = auth.uid()
    )
  );

CREATE POLICY "build documents select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'build-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT cp.id::text
      FROM public.construction_projects cp
      WHERE cp.buyer_id = auth.uid() OR cp.builder_id = auth.uid()
    )
  );

CREATE POLICY "build documents delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'build-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT cp.id::text
      FROM public.construction_projects cp
      WHERE cp.buyer_id = auth.uid()
    )
  );

-- Velu MVP — post-handover defects
-- SQL only. Paste this file into the Supabase SQL Editor. This is not an npm command.
-- Re-runnable. It does not seed data and does not update construction projects.
--
-- Defects exist only after the build is at Handover (current_stage = completion).
-- The buyer reports one. The builder marks it fixed. The buyer approves it or sends it back.
-- Statuses: open → completed_by_builder → approved. Sending it back returns it to open.
-- Velu does not lodge warranty claims, hold retention, or decide disputes.
-- There is no warranty table and no retention amount.

CREATE TABLE IF NOT EXISTS public.project_defects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  author_buyer_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'open',
  builder_completed_at  TIMESTAMPTZ,
  buyer_approved_at     TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_defects DROP CONSTRAINT IF EXISTS project_defects_status_check;
ALTER TABLE public.project_defects
  ADD CONSTRAINT project_defects_status_check
  CHECK (status IN ('open', 'completed_by_builder', 'approved'));

ALTER TABLE public.project_defects DROP CONSTRAINT IF EXISTS project_defects_title_check;
ALTER TABLE public.project_defects
  ADD CONSTRAINT project_defects_title_check
  CHECK (char_length(title) BETWEEN 2 AND 80);

ALTER TABLE public.project_defects DROP CONSTRAINT IF EXISTS project_defects_description_check;
ALTER TABLE public.project_defects
  ADD CONSTRAINT project_defects_description_check
  CHECK (char_length(description) BETWEEN 2 AND 2000);

ALTER TABLE public.project_defects DROP CONSTRAINT IF EXISTS project_defects_timestamps_check;
ALTER TABLE public.project_defects
  ADD CONSTRAINT project_defects_timestamps_check
  CHECK (
    (
      status = 'open'
      AND builder_completed_at IS NULL
      AND buyer_approved_at IS NULL
    )
    OR (
      status = 'completed_by_builder'
      AND builder_completed_at IS NOT NULL
      AND buyer_approved_at IS NULL
    )
    OR (
      status = 'approved'
      AND builder_completed_at IS NOT NULL
      AND buyer_approved_at IS NOT NULL
    )
  );

CREATE INDEX IF NOT EXISTS project_defects_project_created_idx
  ON public.project_defects (project_id, created_at);

-- author_buyer_id is the buyer who reported the defect.
CREATE OR REPLACE FUNCTION public.enforce_project_defect_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_buyer UUID;
  v_builder UUID;
  v_stage public.construction_milestone;
BEGIN
  SELECT cp.buyer_id, cp.builder_id, cp.current_stage
    INTO v_buyer, v_builder, v_stage
  FROM public.construction_projects cp
  WHERE cp.id = NEW.project_id;

  IF NOT FOUND OR v_stage IS DISTINCT FROM 'completion'::public.construction_milestone THEN
    RAISE EXCEPTION 'Defects are only available after handover';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.title := btrim(NEW.title);
    NEW.description := btrim(NEW.description);

    IF NEW.author_buyer_id IS DISTINCT FROM v_buyer OR auth.uid() IS DISTINCT FROM v_buyer THEN
      RAISE EXCEPTION 'Only the buyer on this project can report a defect';
    END IF;

    IF NEW.status IS DISTINCT FROM 'open'
       OR NEW.builder_completed_at IS NOT NULL
       OR NEW.buyer_approved_at IS NOT NULL THEN
      RAISE EXCEPTION 'A new defect starts open';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.project_id IS DISTINCT FROM OLD.project_id
     OR NEW.author_buyer_id IS DISTINCT FROM OLD.author_buyer_id
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Defect title and description stay as the buyer wrote them';
  END IF;

  IF OLD.status = 'open' AND NEW.status = 'completed_by_builder' THEN
    IF auth.uid() IS DISTINCT FROM v_builder THEN
      RAISE EXCEPTION 'Only the builder can mark a defect fixed';
    END IF;
    NEW.builder_completed_at := NOW();
    NEW.buyer_approved_at := NULL;
  ELSIF OLD.status = 'completed_by_builder' AND NEW.status = 'approved' THEN
    IF auth.uid() IS DISTINCT FROM v_buyer THEN
      RAISE EXCEPTION 'Only the buyer can approve a defect';
    END IF;
    NEW.builder_completed_at := OLD.builder_completed_at;
    NEW.buyer_approved_at := NOW();
  ELSIF OLD.status = 'completed_by_builder' AND NEW.status = 'open' THEN
    IF auth.uid() IS DISTINCT FROM v_buyer THEN
      RAISE EXCEPTION 'Only the buyer can send a defect back';
    END IF;
    NEW.builder_completed_at := NULL;
    NEW.buyer_approved_at := NULL;
  ELSE
    RAISE EXCEPTION 'That defect status change is not allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_defects_enforce_change ON public.project_defects;
CREATE TRIGGER project_defects_enforce_change
  BEFORE INSERT OR UPDATE ON public.project_defects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_defect_change();

ALTER TABLE public.project_defects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project defects: participants read"
  ON public.project_defects;
CREATE POLICY "project defects: participants read"
  ON public.project_defects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND (cp.buyer_id = auth.uid() OR cp.builder_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "project defects: buyer creates after handover"
  ON public.project_defects;
CREATE POLICY "project defects: buyer creates after handover"
  ON public.project_defects FOR INSERT
  WITH CHECK (
    author_buyer_id = auth.uid()
    AND status = 'open'
    AND builder_completed_at IS NULL
    AND buyer_approved_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND cp.buyer_id = auth.uid()
        AND cp.current_stage = 'completion'::public.construction_milestone
    )
  );

DROP POLICY IF EXISTS "project defects: builder marks completed"
  ON public.project_defects;
CREATE POLICY "project defects: builder marks completed"
  ON public.project_defects FOR UPDATE
  USING (
    status = 'open'
    AND EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND cp.builder_id = auth.uid()
        AND cp.current_stage = 'completion'::public.construction_milestone
    )
  )
  WITH CHECK (
    status = 'completed_by_builder'
    AND builder_completed_at IS NOT NULL
    AND buyer_approved_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND cp.builder_id = auth.uid()
        AND cp.buyer_id = author_buyer_id
        AND cp.current_stage = 'completion'::public.construction_milestone
    )
  );

DROP POLICY IF EXISTS "project defects: buyer approves"
  ON public.project_defects;
CREATE POLICY "project defects: buyer approves"
  ON public.project_defects FOR UPDATE
  USING (
    status = 'completed_by_builder'
    AND EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND cp.buyer_id = auth.uid()
        AND cp.current_stage = 'completion'::public.construction_milestone
    )
  )
  WITH CHECK (
    status = 'approved'
    AND builder_completed_at IS NOT NULL
    AND buyer_approved_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND cp.buyer_id = auth.uid()
        AND cp.buyer_id = author_buyer_id
        AND cp.current_stage = 'completion'::public.construction_milestone
    )
  );

DROP POLICY IF EXISTS "project defects: buyer sends back"
  ON public.project_defects;
CREATE POLICY "project defects: buyer sends back"
  ON public.project_defects FOR UPDATE
  USING (
    status = 'completed_by_builder'
    AND EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND cp.buyer_id = auth.uid()
        AND cp.current_stage = 'completion'::public.construction_milestone
    )
  )
  WITH CHECK (
    status = 'open'
    AND builder_completed_at IS NULL
    AND buyer_approved_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.construction_projects cp
      WHERE cp.id = project_id
        AND cp.buyer_id = auth.uid()
        AND cp.buyer_id = author_buyer_id
        AND cp.current_stage = 'completion'::public.construction_milestone
    )
  );

REVOKE ALL ON TABLE public.project_defects FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.project_defects TO authenticated;

COMMENT ON TABLE public.project_defects IS
  'Post-handover defects between the buyer and the builder. Velu does not lodge warranty claims, hold retention, or decide disputes.';

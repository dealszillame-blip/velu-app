-- Velu MVP — builder pre-launch expression of interest

CREATE TABLE IF NOT EXISTS public.builder_prelaunch_interest (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  company_name    TEXT,
  service_area    TEXT NOT NULL,
  specialties     TEXT[] NOT NULL DEFAULT '{}',
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'invited', 'archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS builder_prelaunch_interest_status_idx
  ON public.builder_prelaunch_interest(status);

CREATE INDEX IF NOT EXISTS builder_prelaunch_interest_email_idx
  ON public.builder_prelaunch_interest(email);

ALTER TABLE public.builder_prelaunch_interest ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS builder_prelaunch_interest_updated_at ON public.builder_prelaunch_interest;
CREATE TRIGGER builder_prelaunch_interest_updated_at
  BEFORE UPDATE ON public.builder_prelaunch_interest
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

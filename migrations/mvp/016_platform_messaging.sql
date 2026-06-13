-- Velu MVP — in-platform buyer ↔ builder messaging (no contact details shared)

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'message_received';

ALTER TABLE public.builder_inquiries
  ADD COLUMN IF NOT EXISTS initiated_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

UPDATE public.builder_inquiries
SET initiated_by = buyer_id
WHERE initiated_by IS NULL;

ALTER TABLE public.builder_inquiries
  ALTER COLUMN initiated_by SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS builder_inquiries_participants_listing_idx
  ON public.builder_inquiries (buyer_id, builder_id, land_listing_id)
  WHERE land_listing_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.inquiry_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id  UUID REFERENCES public.builder_inquiries(id) ON DELETE CASCADE NOT NULL,
  sender_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS inquiry_messages_inquiry_idx
  ON public.inquiry_messages(inquiry_id, created_at);

INSERT INTO public.inquiry_messages (inquiry_id, sender_id, body, created_at)
SELECT id, buyer_id, message, created_at
FROM public.builder_inquiries
WHERE message IS NOT NULL
  AND TRIM(message) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.inquiry_messages m WHERE m.inquiry_id = builder_inquiries.id
  );

UPDATE public.builder_inquiries bi
SET
  last_message_at = latest.created_at,
  last_message_preview = LEFT(latest.body, 160)
FROM (
  SELECT DISTINCT ON (inquiry_id)
    inquiry_id,
    body,
    created_at
  FROM public.inquiry_messages
  ORDER BY inquiry_id, created_at DESC
) latest
WHERE bi.id = latest.inquiry_id;

ALTER TABLE public.inquiry_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiry_messages: read participant" ON public.inquiry_messages;
DROP POLICY IF EXISTS "inquiry_messages: insert participant" ON public.inquiry_messages;
DROP POLICY IF EXISTS "inquiry_messages: mark read" ON public.inquiry_messages;

CREATE POLICY "inquiry_messages: read participant"
  ON public.inquiry_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.builder_inquiries i
      WHERE i.id = inquiry_id
        AND (auth.uid() = i.buyer_id OR auth.uid() = i.builder_id)
    )
  );

CREATE POLICY "inquiry_messages: insert participant"
  ON public.inquiry_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.builder_inquiries i
      WHERE i.id = inquiry_id
        AND (auth.uid() = i.buyer_id OR auth.uid() = i.builder_id)
    )
  );

CREATE POLICY "inquiry_messages: mark read"
  ON public.inquiry_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.builder_inquiries i
      WHERE i.id = inquiry_id
        AND auth.uid() IN (i.buyer_id, i.builder_id)
        AND auth.uid() <> sender_id
    )
  );

DROP POLICY IF EXISTS "inquiries: buyer manage" ON public.builder_inquiries;
DROP POLICY IF EXISTS "inquiries: builder read" ON public.builder_inquiries;
DROP POLICY IF EXISTS "inquiries: builder update" ON public.builder_inquiries;

CREATE POLICY "inquiries: read participant"
  ON public.builder_inquiries FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = builder_id);

CREATE POLICY "inquiries: insert buyer"
  ON public.builder_inquiries FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id
    AND auth.uid() = initiated_by
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'buyer'
    )
  );

CREATE POLICY "inquiries: insert builder"
  ON public.builder_inquiries FOR INSERT
  WITH CHECK (
    auth.uid() = builder_id
    AND auth.uid() = initiated_by
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'builder'
    )
  );

CREATE POLICY "inquiries: update participant"
  ON public.builder_inquiries FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = builder_id);

CREATE OR REPLACE FUNCTION public.get_inquiry_threads_for_user(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  buyer_id UUID,
  builder_id UUID,
  land_listing_id UUID,
  listing_address TEXT,
  listing_suburb TEXT,
  counterpart_name TEXT,
  counterpart_role user_role,
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count BIGINT,
  status inquiry_status,
  initiated_by UUID
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.buyer_id,
    i.builder_id,
    i.land_listing_id,
    ll.address AS listing_address,
    ll.suburb AS listing_suburb,
    CASE
      WHEN p_user_id = i.buyer_id THEN COALESCE(builder_prof.company_name, builder_prof.full_name)
      ELSE split_part(buyer_prof.full_name, ' ', 1)
    END AS counterpart_name,
    CASE
      WHEN p_user_id = i.buyer_id THEN 'builder'::user_role
      ELSE 'buyer'::user_role
    END AS counterpart_role,
    i.last_message_preview,
    i.last_message_at,
    (
      SELECT COUNT(*)
      FROM public.inquiry_messages m
      WHERE m.inquiry_id = i.id
        AND m.sender_id <> p_user_id
        AND m.read_at IS NULL
    ) AS unread_count,
    i.status,
    i.initiated_by
  FROM public.builder_inquiries i
  LEFT JOIN public.land_listings ll ON ll.id = i.land_listing_id
  LEFT JOIN public.profiles builder_prof ON builder_prof.id = i.builder_id
  LEFT JOIN public.profiles buyer_prof ON buyer_prof.id = i.buyer_id
  WHERE i.buyer_id = p_user_id OR i.builder_id = p_user_id
  ORDER BY COALESCE(i.last_message_at, i.created_at) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_inquiry_threads_for_user(UUID) TO authenticated;

ALTER TABLE public.inquiry_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiry_messages;

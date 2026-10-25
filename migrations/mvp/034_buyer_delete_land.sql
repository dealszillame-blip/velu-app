-- Let a buyer delete a block they registered.
-- Safe to re-run. Does not change milestone stages on other blocks.

DROP POLICY IF EXISTS "listings: delete own (buyer owned)" ON public.land_listings;

CREATE POLICY "listings: delete own (buyer owned)"
  ON public.land_listings FOR DELETE
  USING (
    auth.uid() = buyer_id
    AND source = 'buyer_owned'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'buyer'
    )
  );

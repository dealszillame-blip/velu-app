-- Velu MVP — enable Realtime on key tables (Week 3 lead feed + notifications)

-- Required for Realtime UPDATE events (sold status changes)
ALTER TABLE public.land_listings REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.construction_projects REPLICA IDENTITY FULL;

-- Add tables to Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.land_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.construction_projects;

-- Velu MVP — approvals, site clearance, and excavation
-- SQL only. Paste this file into the Supabase SQL Editor. This is not an npm command.
-- Adds three labels to construction_milestone. Does not update any project.
-- A build already on slab, frame, lockup, fixing, or completion stays on that stage.
-- New labels are appended. Postgres enum sort order is not the build order.
-- The app orders stages in lib/types.ts CONSTRUCTION_STAGES:
--   contract, approvals, site_clearance, excavation, slab, frame, lockup, fixing, completion.

ALTER TYPE public.construction_milestone ADD VALUE IF NOT EXISTS 'approvals';
ALTER TYPE public.construction_milestone ADD VALUE IF NOT EXISTS 'site_clearance';
ALTER TYPE public.construction_milestone ADD VALUE IF NOT EXISTS 'excavation';

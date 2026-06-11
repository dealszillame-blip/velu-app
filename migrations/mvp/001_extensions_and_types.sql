-- Velu MVP — extensions and types
-- Run in Supabase SQL Editor in order (001 → 005)

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE user_role AS ENUM (
  'buyer',
  'builder',
  'agent',
  'admin',
  'pending_agent'
);

CREATE TYPE listing_status AS ENUM ('available', 'under_offer', 'sold');

CREATE TYPE construction_milestone AS ENUM (
  'contract',
  'slab',
  'frame',
  'lockup',
  'fixing',
  'completion'
);

CREATE TYPE proposal_status AS ENUM (
  'draft',
  'pending',
  'viewed',
  'accepted',
  'rejected',
  'expired'
);

CREATE TYPE notification_type AS ENUM (
  'new_lead',
  'proposal_received',
  'proposal_accepted',
  'milestone_update',
  'license_expiry',
  'subscription_alert'
);

CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'premium');

CREATE TYPE inquiry_status AS ENUM (
  'inquiry_sent',
  'quote_received',
  'site_inspection_scheduled',
  'contract_signed',
  'closed'
);

CREATE TYPE builder_onboarding_status AS ENUM (
  'licence_pending',
  'insurance_pending',
  'designs_pending',
  'approval_pending',
  'onboarded'
);

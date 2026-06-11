-- Velu MVP — feature flag seed data

INSERT INTO public.feature_flags (key, module, description, enabled) VALUES
  ('HIA_TENDER_PDF',        'module2', 'Full HIA tender form + PDF generation',                 FALSE),
  ('STRIPE_BILLING',        'module3', 'Stripe subscription tiers and quota enforcement',       FALSE),
  ('PROPTRACK_SYNC',        'module4', 'Daily PropTrack/Domain API sync cron',                  FALSE),
  ('FAIR_TRADING_SCRAPER',  'module4', 'Weekly NSW Fair Trading licence validation cron',       FALSE),
  ('ADMIN_PANEL',           'module5', 'Admin dashboard, builder verification, agent approval',   FALSE),
  ('ADVANCED_COMPARATOR',   'module6', 'Inclusions diff, full tender comparison columns',       FALSE),
  ('MILESTONE_PHOTOS',      'module7', 'Photo upload + certificate downloads on milestones',    FALSE),
  ('SMS_NOTIFICATIONS',     'module8', 'Twilio SMS alerts to builders on lead',                 FALSE),
  ('EMAIL_NOTIFICATIONS',   'module8', 'SendGrid dynamic email templates',                      FALSE),
  ('TRADES_ECOSYSTEM',      'module9', 'Phase 3 trades platform',                              FALSE),
  ('BUILDER_ONBOARDING_GATE', 'mvp',   'Enforce is_onboarded=TRUE as lead access gate',         TRUE);

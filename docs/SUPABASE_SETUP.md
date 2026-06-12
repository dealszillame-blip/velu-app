# Supabase setup for Velu MVP

Follow these steps in order. Takes about 15 minutes.

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**.
3. Settings:
   - **Name:** `velu-mvp`
   - **Database password:** save this somewhere safe
   - **Region:** **Asia Pacific (Sydney)** — `ap-southeast-2` (Australian data hosting)
4. Wait ~2 minutes for the project to provision.

---

## Step 2 — Copy API keys into `.env.local`

1. In Supabase: **Project Settings → API**
2. Copy these values:

| Supabase dashboard | `.env.local` variable |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

3. In your terminal:

```powershell
cd velu-app
copy .env.example .env.local
```

4. Open `.env.local` and paste the three values.

> **Never commit `.env.local` or expose the service role key in client code.**

---

## Step 3 — Run database migrations

1. In Supabase: **SQL Editor → New query**
2. Run each file **in order** from `migrations/mvp/`:

| Order | File | What it does |
|------:|------|--------------|
| 1 | `001_extensions_and_types.sql` | PostGIS + ENUM types |
| 2 | `002_mvp_tables.sql` | All tables |
| 3 | `003_mvp_rls.sql` | Row-level security |
| 4 | `004_mvp_functions.sql` | Triggers + geospatial RPC |
| 5 | `005_feature_flags.sql` | Feature flag seed data |
| 6 | `006_realtime.sql` | Realtime for lead feed |
| 7 | `007_listing_rpc.sql` | Listing create + map query (Week 2) |
| 8 | `008_domain_sync.sql` | Domain API sync columns + upsert RPC |
| 8b | `008b_fix_get_listings_for_map.sql` | Only if 008 errors with 42P13 on `get_listings_for_map` |
| 9 | `009_week3_core_loop.sql` | Sold leads RPC + proposal onboarding gate |
| 10 | `010_demo_seed.sql` | Optional demo listings (after user signup) |

**Shortcut:** open `migrations/mvp/000_all_in_one.sql` and run the entire file in one go, then run `008_domain_sync.sql` if you used the all-in-one shortcut before this migration existed.

Each query should return **Success. No rows returned**.

### Verify tables exist

**Table Editor** should show: `profiles`, `land_listings`, `builder_profiles`, `notifications`, `feature_flags`, etc.

Or run locally:

```powershell
node --env-file=.env.local scripts/verify-supabase.mjs
```

---

## Step 4 — Configure Auth (important for local dev)

### Disable email confirmation (recommended for dev)

1. **Authentication → Providers → Email**
2. Turn **OFF** “Confirm email”
3. Save

This lets you sign up and land on dashboards immediately without checking email.

### Site URL

1. **Authentication → URL Configuration**
2. Set:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** add `http://localhost:3000/**`

---

## Step 5 — Enable PostGIS (if migration failed on extension)

If `001` errors on PostGIS:

1. **Database → Extensions**
2. Search `postgis` → **Enable**
3. Re-run `001_extensions_and_types.sql`

---

## Step 6 — Realtime (dashboard check)

After running `006_realtime.sql`, confirm in:

**Database → Publications → supabase_realtime**

Tables listed should include:
- `land_listings`
- `notifications`
- `construction_projects`

---

## Step 7 — Optional: JWT custom claims hook

Adds `user_role` to JWT tokens (used by middleware).

1. **Authentication → Hooks**
2. Enable **Custom Access Token** hook
3. Select function: `public.custom_access_token_hook`
4. Save

Skip for now if hooks UI is unavailable — the app reads role from `profiles` table directly.

---

## Step 8 — Test the app

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register:

| Role | URL | Expected redirect |
|------|-----|-------------------|
| Buyer | `/register/buyer` | `/buyer/map` |
| Builder | `/register/builder` | `/builder/dashboard` |
| Agent | `/register/agent` | `/agent/listings` |

Check **Authentication → Users** in Supabase — you should see new users after signup.

Check **Table Editor → profiles** — a row per user with the correct `role`.

---

## Troubleshooting

### “Missing NEXT_PUBLIC_SUPABASE_URL”
Create `.env.local` from `.env.example` and restart `npm run dev`.

### Signup works but profile not created
- Check browser Network tab for failed `POST /api/onboarding/...` calls
- Confirm migrations ran (especially `profiles` table + RLS insert policy)
- With email confirmation ON, you must verify email **before** onboarding API runs — disable for dev

### “permission denied for table profiles”
Re-run `003_mvp_rls.sql`. The insert policy requires `auth.uid() = id`.

### Builder geocoding fails
Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.local` (free token at [mapbox.com](https://account.mapbox.com)). Builder profile still creates without it — anchor coordinates just won’t be set.

### Re-run migrations on a fresh project
If you need to start over, use **SQL Editor**:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then run migrations 001→006 again.

---

## Week 3 extras (don’t do yet)

When you reach the sold-listing demo:

1. Deploy Edge Function `notify-builders-on-sale`
2. **Database → Webhooks** → on `land_listings` UPDATE where `status = 'sold'`
3. Point webhook to the Edge Function URL

See `README.md` for Edge Function deploy steps.

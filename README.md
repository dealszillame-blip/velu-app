# Velu MVP

Verified vacant-land marketplace for South West Sydney — buyers, builders, and agents.

Built from `Velu_MVP_PRD_v2.md` (Week 1 foundation).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind + shadcn/ui
- **Supabase** — Auth, PostgreSQL + PostGIS, Realtime, Edge Functions
- **MapLibre GL** + OpenFreeMap tiles (free, no API key)
- **Geocoding** — OpenStreetMap Nominatim (free, no API key)

## Quick start

### 1. Install dependencies

```bash
cd velu-app
npm install
```

### 2. Create a Supabase project

**Full walkthrough:** [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

1. Create a project at [supabase.com](https://supabase.com) (region: **ap-southeast-2** for AU hosting).
2. Copy API keys into `.env.local` (see `.env.example`).
3. Run **`migrations/mvp/000_all_in_one.sql`** in the Supabase SQL Editor (or run 001→006 individually).
4. Disable email confirmation under **Authentication → Providers → Email** for local dev.
5. Set **Site URL** to `http://localhost:3000` under **Authentication → URL Configuration**.
6. Verify: `npm run verify:supabase`

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase URL, anon key, and service role key.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Domain API — land listings sync

Listings are sourced from the **Domain Developer API** (Agents & Listings package) instead of manual agent entry for the demo.

### Setup

1. Register at [developer.domain.com.au](https://developer.domain.com.au)
2. Create a project → **Credentials** → OAuth client (Client Credentials)
3. **API Access** → add **Agents & Listings** to your project
4. Add to `.env.local`:
   - `DOMAIN_CLIENT_ID`
   - `DOMAIN_CLIENT_SECRET`
   - `DOMAIN_SYNC_SECRET` (any random string — protects the sync endpoint)
5. Run migration **`008_domain_sync.sql`** in Supabase SQL Editor

### Sync listings

```bash
npm run sync:domain
```

This fetches vacant land in South West Sydney postcodes and upserts into `land_listings` with statuses:

| Domain | Velu status   | Map filter      |
|--------|---------------|-----------------|
| Active | `available`   | Available       |
| Under contract | `under_offer` | Under contract |
| Sold   | `sold`        | Sold            |

Buyers can switch status on the map filter panel at `/buyer/map`.

You can also trigger sync via API (e.g. for cron):

```bash
curl -X POST http://localhost:3000/api/sync/domain \
  -H "Authorization: Bearer YOUR_DOMAIN_SYNC_SECRET"
```


Sign up as buyer, builder, and agent — each role lands on their dashboard:

| Role    | Register              | Dashboard            |
|---------|-----------------------|----------------------|
| Buyer   | `/register/buyer`     | `/buyer/map`         |
| Builder | `/register/builder`   | `/builder/dashboard` |
| Agent   | `/register/agent`     | `/agent/listings`    |

## Project structure

```
app/
  (auth)/          login, register, verify
  (buyer)/         map, compare
  (builder)/       dashboard, leads, proposals
  (agent)/         listings
  api/onboarding/  profile creation per role
components/        auth forms, shared nav
lib/               supabase clients, auth, flags, mapbox
migrations/mvp/    SQL schema (run in Supabase)
supabase/functions/ Edge Functions (Week 3)
```

## Edge Function (Week 3)

Deploy `notify-builders-on-sale` when wiring the sold-listing webhook:

```bash
supabase functions deploy notify-builders-on-sale
```

Register a database webhook: `land_listings` UPDATE where `status = sold`.

## Build plan

| Week | Focus                                      |
|------|--------------------------------------------|
| 1    | Auth, onboarding, role dashboards ✅        |
| 2    | Domain listing sync + MapLibre map         |
| 3    | Sold trigger, lead feed, proposals         |
| 4    | Buyer comparator + accept flow             |
| 5    | Milestone tracker + demo polish            |

## Scripts

```bash
npm run verify:supabase  # check Supabase connection
npm run sync:domain      # pull listings from Domain API
```

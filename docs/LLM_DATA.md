# How Velu collects licensed builders and Google reviews

Nearby builders on My land come from the **NSW Fair Trading public register**, not from Velu-onboarded accounts.

## 1. NSW licence register

Velu calls the same public API as [Verify NSW](https://verify.licence.nsw.gov.au/):

`POST https://verify.licence.nsw.gov.au/publicregisterapi/api/v1/licence/search/advQuery`

Filters:

- Licence group `Trades`
- Class `Contractor Licence — Builder` (`HBS_CON_Builder`)
- Status `Current`
- Greater Sydney postcodes / coordinates

A snapshot of **10,193** current Greater Sydney contractor-builder licences is stored in `scripts/data/nsw-sydney-builders.json.gz` (collected 15 Sep 2026). That file is a cache of public register rows (name, licence number, suburb, expiry, ABN). It is **not** a Velu user list.

### Load into Supabase

1. In the **Supabase SQL Editor**, paste and run `migrations/mvp/027_nsw_builder_directory.sql` (SQL only).
2. Then load the licence rows — **not** in the SQL Editor:
   - Admin → **Data** → **Import Sydney snapshot**, or
   - in a terminal: `npm run sync:nsw-builders`

Do not paste `npm run …` into SQL Editor. That command is not SQL.

Live refresh (Admin → Refresh from Verify NSW) re-queries the public register for common builder/suburb terms. The register caps each query at 200 rows, so the snapshot is the complete Sydney set.

## 2. Weekly licence check + Google reviews

Every Sunday at 20:00 UTC Velu refreshes the directory:

1. Discover new/updated Greater Sydney contractor-builder licences from Verify NSW
2. Recheck stored licences (oldest `last_synced_at` first), including Expired / Cancelled / Suspended / Surrendered. Nearby only shows `Current`. Missing licences are marked `Not found` and drop off the map
3. Refresh Google Places ratings for the oldest `google_synced_at` rows (does **not** scrape google.com)

Run it in three ways:

| How | What it does |
|-----|----------------|
| **GitHub Action** `Weekly builder directory sync` | Full batch (~400 licence rechecks, ~150 Google refreshes). Needs repo secrets `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GOOGLE_PLACES_API_KEY` |
| **Vercel Cron** `GET /api/sync/builders` | Smaller batch that fits a 60s function. Auth: `Authorization: Bearer CRON_SECRET` (or `BUILDER_SYNC_SECRET`) |
| **Admin → Data → Run weekly update now** or `npm run sync:nsw-builders:weekly` | Manual run |

```bash
curl https://velu-app-sigma.vercel.app/api/sync/builders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Optional env: `WEEKLY_LICENCE_RECHECK_LIMIT`, `WEEKLY_GOOGLE_REFRESH_LIMIT`.

## 3. Google reviews

Velu does **not** scrape google.com. It uses the [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service/text-search) text search:

- Env: `GOOGLE_PLACES_API_KEY` (or `GOOGLE_MAPS_API_KEY`)
- Query: `{licensee} builder {suburb} {postcode} NSW Australia`
- Stores `rating`, `userRatingCount`, Maps URL

Then Admin → **Match Google reviews** (fills rows that still have no rating) or wait for the weekly job (refreshes existing ratings too).

Last-sale and delay fields are not on the licence register. Use the LLM ingest below for those.

## 4. Optional LLM ingest

For last property sold / project delays on a named builder, paste JSON on `/admin/data` as before.

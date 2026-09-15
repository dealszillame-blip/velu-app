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

1. Run `migrations/mvp/027_nsw_builder_directory.sql`
2. Either:
   - Admin → **Data** → **Import Sydney snapshot**, or
   - `npm run sync:nsw-builders`

Live refresh (Admin → Refresh from Verify NSW) re-queries the public register for common builder/suburb terms. The register caps each query at 200 rows, so the snapshot is the complete Sydney set.

## 2. Google reviews

Velu does **not** scrape google.com. It uses the [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service/text-search) text search:

- Env: `GOOGLE_PLACES_API_KEY` (or `GOOGLE_MAPS_API_KEY`)
- Query: `{licensee} builder {suburb} {postcode} NSW Australia`
- Stores `rating`, `userRatingCount`, Maps URL

Then Admin → **Match Google reviews** (or the sync script when the key is present).

Last-sale and delay fields are not on the licence register. Use the LLM ingest below for those.

## 3. Optional LLM ingest

For last property sold / project delays on a named builder, paste JSON on `/admin/data` as before.

# How to use an LLM to collect and update Velu data

Velu does not scrape Verify NSW or Google. An operator (or a scheduled agent) asks a model for **structured JSON**, then posts it to the admin ingest API.

## 1. Collect

Give the model the prompt in **Admin → LLM data** (`/admin/data`), plus a source:

- Verify NSW search, e.g. [dhursan](https://verify.licence.nsw.gov.au/results?searchTerm=dhursan&filter=search&status=all)
- The builder website and Google rating
- Last advertised sale and any delay / Fair Trading notice

The model must return **one JSON object**, not prose.

### Builder record

```json
{
  "kind": "builder",
  "company_name": "Dhursan Homes Pty Ltd",
  "license_number": "369795C",
  "license_verify_url": "https://verify.licence.nsw.gov.au/results?searchTerm=dhursan&filter=search&status=all",
  "is_license_valid": true,
  "google_rating": 5,
  "google_review_count": 85,
  "builder_type": "bulk",
  "last_property_sold_address": "Lot 2209 Brabham Precinct, Oran Park",
  "last_property_sold_at": "2026-08-20",
  "avg_delay_weeks": 0,
  "headline": "House & land across South West Sydney",
  "website_url": "https://dhursanconstruction.com.au",
  "anchor_address": "Suite 106, 3 Fordham Way, Oran Park NSW 2570",
  "service_radius_km": 45
}
```

`company_name` must already exist as a builder profile. Create `demo.dhursan@velu.dev` (or the real account) first.

### Past tender (knowledge base)

```json
{
  "kind": "tender",
  "key": "sws-volume-4bed-2026",
  "package_name": "Volume 4-bed single storey",
  "region": "south_west_sydney",
  "builder_type": "bulk",
  "construction_grade": "ground",
  "bedrooms": 4,
  "bathrooms": 2,
  "storeys": 1,
  "living_area_sqm": 186,
  "base_price": 465000,
  "estimated_build_weeks": 28,
  "inclusions": "Stone, ducted AC, double garage",
  "source_name": "past tender"
}
```

## 2. Update

Paste the JSON on `/admin/data` or:

```bash
curl -X POST https://your-host/api/admin/llm-ingest \
  -H "Cookie: <admin session>" \
  -H "Content-Type: application/json" \
  -d @builder.json
```

That writes `builder_profiles` criteria (Google review, licence check, last sale, delays) or upserts `tender_knowledge_base`.

## 3. Compare live tenders

Buyer **Compare → Tender report** ranks current packages against stored tenders. If `OPENAI_API_KEY` is set on Vercel, a short LLM narrative is added; otherwise the deterministic scorer still runs.

## 4. Optional model env

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default `gpt-4o-mini`)

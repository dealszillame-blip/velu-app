<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Velu is a single Next.js 16 (App Router) app backed by Supabase (Auth + Postgres/PostGIS). The Cloud Agent environment runs Supabase locally via the Supabase CLI and Docker — no hosted project or secrets are required for the core flows.

Setup is automated by `.cursor/environment.json`:

- `install` → `scripts/cloud-agent-install.sh`: installs Docker + the Supabase CLI, configures the Docker daemon for nested VMs, runs `npm ci`, and pre-pulls the local Supabase images.
- `start` → `scripts/cloud-agent-start.sh`: starts the Docker daemon, runs `supabase start`, applies the SQL in `migrations/mvp/` (via `scripts/local-db-bootstrap.sh`), and writes `.env.local` (via `scripts/write-local-env.sh`).
- `terminals`: `bash scripts/cloud-agent-start.sh && npm run dev` → http://localhost:3000. The `start` script is re-invoked here (idempotent) so the dev server always has a live backend even if the per-boot `start` step did not run.

To bring the stack up manually, run `bash scripts/cloud-agent-start.sh` then `npm run dev`. Verify with `npm run verify:supabase`. Register a buyer at `/register/buyer` to reach `/buyer/map`.

**Non-obvious gotchas:**

- Nested Docker needs the `fuse-overlayfs` storage driver and the `iptables-legacy` backend (both set by the install script). With the default `nft` backend, containers cannot reach each other and `supabase start` hangs on the Realtime DB migration.
- `analytics` is disabled in `supabase/config.toml` (the Logflare/Vector stack is unnecessary for local dev).
- The app's migrations assume the older Supabase default where `anon`/`authenticated` already hold table privileges. `scripts/local-db-bootstrap.sh` re-grants those; without them every table read fails with `42501 permission denied`. RLS policies still enforce row access.
- Migrations live in `migrations/mvp/`, not `supabase/migrations/`, so `supabase start`/`db reset` does NOT auto-apply them — always run the bootstrap script on a fresh DB. Demo-seed files (`010`, `011`, `012`, `018`) are intentionally skipped (they need user accounts first).
- Email confirmation is disabled for local dev (`enable_confirmations = false`), so signup returns a session immediately.
- `/buyer/map` loads OpenFreeMap tiles + OSM Nominatim geocoding (no API key) and needs outbound internet.
- Domain API listing sync (`npm run sync:domain`) needs `DOMAIN_CLIENT_ID`/`DOMAIN_CLIENT_SECRET`/`DOMAIN_SYNC_SECRET` and is optional — the map just shows no listings without it.
- There is no automated test suite.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Velu is a single Next.js 16 (App Router) app backed by Supabase (Auth + Postgres/PostGIS). There is one service: the Next.js dev server. Standard commands live in `package.json` (`dev`, `lint`, `verify:supabase`, the `seed:*`/`sync:domain` scripts) and setup is in `README.md` / `docs/SUPABASE_SETUP.md`. There is no automated test suite.

The update script only runs `npm install`. Docker, the Supabase CLI, and a committed `supabase/config.toml` persist in the VM snapshot; the steps below bring the backend up each session.

**Bring up the backend + app (run from repo root):**

1. Start the Docker daemon if it isn't running: `sudo dockerd > /tmp/dockerd.log 2>&1 &` then `sudo chmod 666 /var/run/docker.sock` (lets `docker`/`supabase` talk to the daemon without sudo).
2. `supabase start` — boots local Supabase (API on `127.0.0.1:54321`, Postgres on `54322`, Studio on `54323`). The anon/service keys it prints are the well-known local defaults.
3. `bash scripts/local-db-bootstrap.sh` — applies the SQL in `migrations/mvp/` to the freshly started DB and grants data privileges to `anon`/`authenticated`/`service_role`. Run it on a fresh DB (right after `supabase start` or `supabase db reset --no-seed`).
4. Ensure `.env.local` exists with the local Supabase URL + anon key + `SUPABASE_SERVICE_ROLE_KEY` (it is gitignored). `npm run verify:supabase` checks the connection and schema.
5. `npm run dev` → http://localhost:3000. Register a buyer at `/register/buyer` to land on `/buyer/map`.

**Non-obvious gotchas:**

- The app's migrations assume the older Supabase default where `anon`/`authenticated` already hold table privileges. The current local Supabase image does NOT grant those, so without the GRANTs in `scripts/local-db-bootstrap.sh` every table read fails with `42501 permission denied` (e.g. `verify:supabase` fails on `profiles`). RLS policies still enforce row access.
- Email confirmation is disabled for local dev (`enable_confirmations = false` in `supabase/config.toml`), so signup returns a session immediately and onboarding runs without an email step.
- Migrations are NOT in `supabase/migrations/`, so `supabase start`/`db reset` does not auto-apply them — always run the bootstrap script. Demo-seed files (`010`, `011`, `012`, `018`) are intentionally skipped by the script because they require user accounts to exist first.
- The `/buyer/map` page loads OpenFreeMap tiles and uses OSM Nominatim geocoding (no API key); these need outbound internet.
- Domain API listing sync (`sync:domain`) needs `DOMAIN_CLIENT_ID`/`DOMAIN_CLIENT_SECRET`/`DOMAIN_SYNC_SECRET` and is optional — the map simply shows no listings without it.

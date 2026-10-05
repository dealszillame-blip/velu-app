#!/usr/bin/env bash
# Local development DB bootstrap for the Velu app.
#
# Applies the SQL in migrations/mvp/ to a *freshly started* local Supabase
# Postgres, then grants the standard Supabase data privileges to the
# anon/authenticated/service_role roles (the app's migrations assume the older
# Supabase default where these roles already have table access).
#
# Prerequisites: `supabase start` has been run and the local stack is healthy.
# Run from the repo root:  bash scripts/local-db-bootstrap.sh
set -euo pipefail

DB_CONTAINER="$(docker ps --filter name=supabase_db --format '{{.Names}}' | head -n1)"
if [ -z "${DB_CONTAINER}" ]; then
  echo "Could not find a running supabase_db container. Run 'supabase start' first." >&2
  exit 1
fi

psql() { docker exec -i "${DB_CONTAINER}" psql -U postgres -d postgres "$@"; }

echo "Using DB container: ${DB_CONTAINER}"

# Base schema (001-006 combined), then the additive schema migrations in order.
# Demo-seed files (010, 011, 012, 018) are skipped: they require user accounts
# to exist first and are optional for local dev.
MIGRATIONS=(
  000_all_in_one
  007_listing_rpc
  008_domain_sync
  008b_fix_get_listings_for_map
  009_week3_core_loop
  013_fix_domain_upsert
  014_proposal_breakdown_templates
  015_buyer_owned_land
  016_platform_messaging
  017_builder_public_profile
  019_buyer_build_requirements
  020_nearby_builders_for_buyer
  021_builder_prelaunch_and_admin
  022_admin_auth_users
)

for m in "${MIGRATIONS[@]}"; do
  echo "Applying ${m}.sql ..."
  psql -v ON_ERROR_STOP=1 < "migrations/mvp/${m}.sql" >/dev/null
done

echo "Granting Supabase data privileges (RLS still enforced) ..."
psql -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
SQL

echo "Done. Local Velu database is ready."

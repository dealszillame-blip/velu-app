#!/usr/bin/env bash
# Generate .env.local for local development from the running local Supabase stack.
#
# The anon/service_role keys printed by `supabase start` are the well-known
# local development defaults (not secrets). This reads them from
# `supabase status` so the file always matches the running stack.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! supabase status >/dev/null 2>&1; then
  echo "[write-local-env] Local Supabase is not running. Run scripts/cloud-agent-start.sh first." >&2
  exit 1
fi

STATUS_ENV="$(supabase status -o env)"

get() { echo "${STATUS_ENV}" | grep -E "^$1=" | head -n1 | sed -E "s/^$1=\"?([^\"]*)\"?$/\1/"; }

API_URL="$(get API_URL)"
ANON_KEY="$(get ANON_KEY)"
SERVICE_ROLE_KEY="$(get SERVICE_ROLE_KEY)"

if [ -z "${API_URL}" ] || [ -z "${ANON_KEY}" ] || [ -z "${SERVICE_ROLE_KEY}" ]; then
  echo "[write-local-env] Could not parse keys from 'supabase status -o env'." >&2
  echo "${STATUS_ENV}" >&2
  exit 1
fi

cat > .env.local <<EOF
# Auto-generated for local development by scripts/write-local-env.sh
# Local Supabase defaults — safe to commit-ignore; regenerate any time.
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

echo "[write-local-env] Wrote .env.local (NEXT_PUBLIC_SUPABASE_URL=${API_URL})"

#!/usr/bin/env bash
# Per-boot startup for the Velu Cloud Agent environment.
#
# Brings the local backend up so the Next.js app can run end to end:
#   1. Starts the Docker daemon (needed by the Supabase CLI local stack).
#   2. Starts local Supabase (Auth + Postgres/PostGIS + Studio).
#   3. Applies the SQL in migrations/mvp/ on a fresh database.
#   4. Writes .env.local with the local Supabase URL + keys.
#
# Safe to run repeatedly: each step detects work that is already done.
set -euo pipefail

cd "$(dirname "$0")/.."

log() { echo "[cloud-agent-start] $*"; }

# 1. Docker daemon -----------------------------------------------------------
if ! docker info >/dev/null 2>&1; then
  log "Starting Docker daemon..."
  sudo dockerd >/tmp/dockerd.log 2>&1 &
  for _ in $(seq 1 30); do
    if sudo docker info >/dev/null 2>&1; then break; fi
    sleep 1
  done
  sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
fi
if ! docker info >/dev/null 2>&1; then
  log "ERROR: Docker daemon did not become ready. See /tmp/dockerd.log" >&2
  exit 1
fi
log "Docker is ready."

# 2. Local Supabase ----------------------------------------------------------
# `supabase start` is a no-op if the stack is already running.
if supabase status >/dev/null 2>&1; then
  log "Supabase already running."
else
  log "Starting local Supabase (first boot pulls images)..."
  supabase start
fi

# 3. Apply migrations on a fresh DB ------------------------------------------
DB_CONTAINER="$(docker ps --filter name=supabase_db --format '{{.Names}}' | head -n1)"
ALREADY_BOOTSTRAPPED=0
if [ -n "${DB_CONTAINER}" ]; then
  if docker exec -i "${DB_CONTAINER}" psql -U postgres -d postgres -tAc \
      "SELECT to_regclass('public.profiles') IS NOT NULL;" 2>/dev/null | grep -q t; then
    ALREADY_BOOTSTRAPPED=1
  fi
fi
if [ "${ALREADY_BOOTSTRAPPED}" -eq 1 ]; then
  log "Database already bootstrapped (public.profiles exists); skipping migrations."
else
  log "Applying migrations..."
  bash scripts/local-db-bootstrap.sh
fi

# 4. .env.local --------------------------------------------------------------
log "Writing .env.local from local Supabase status..."
bash scripts/write-local-env.sh

log "Backend is ready. Start the app with: npm run dev"

#!/usr/bin/env bash
# Idempotent setup for the Velu Cloud Agent environment.
#
# Installs the system tooling the local backend needs (Docker + the Supabase
# CLI), refreshes Node dependencies, and pre-pulls the local Supabase images so
# the per-boot `start` step is fast. Safe to run repeatedly.
set -euo pipefail

cd "$(dirname "$0")/.."

log() { echo "[cloud-agent-install] $*"; }

# 1. System packages ---------------------------------------------------------
NEED_APT=0
for pkg in docker.io fuse-overlayfs uidmap; do
  dpkg -s "$pkg" >/dev/null 2>&1 || NEED_APT=1
done
if [ "${NEED_APT}" -eq 1 ]; then
  log "Installing system packages (docker.io, fuse-overlayfs, uidmap)..."
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" \
    docker.io fuse-overlayfs uidmap
else
  log "System packages already present."
fi

# 2. Supabase CLI ------------------------------------------------------------
if ! command -v supabase >/dev/null 2>&1; then
  log "Installing Supabase CLI..."
  VER="$(curl -fsSL https://api.github.com/repos/supabase/cli/releases/latest \
    | grep -o '"tag_name": *"[^"]*"' | head -1 | sed 's/.*"v\?\([^"]*\)"/\1/')"
  curl -fsSL -o /tmp/supabase.deb \
    "https://github.com/supabase/cli/releases/latest/download/supabase_${VER}_linux_amd64.deb"
  sudo dpkg -i /tmp/supabase.deb
else
  log "Supabase CLI already present ($(supabase --version))."
fi

# 3. Docker daemon configuration for nested VMs ------------------------------
# Nested Cloud Agent VMs need the fuse-overlayfs storage driver (the default
# overlayfs snapshotter cannot extract image whiteout files here) and the
# legacy iptables backend (the nft backend cannot set up the docker bridge, so
# containers otherwise cannot reach each other).
log "Configuring Docker daemon (fuse-overlayfs) and iptables-legacy..."
sudo mkdir -p /etc/docker
printf '{\n  "storage-driver": "fuse-overlayfs",\n  "features": { "containerd-snapshotter": false }\n}\n' \
  | sudo tee /etc/docker/daemon.json >/dev/null
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy >/dev/null 2>&1 || true
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy >/dev/null 2>&1 || true

# 4. Node dependencies -------------------------------------------------------
if [ -f package-lock.json ]; then
  log "Installing Node dependencies (npm ci)..."
  npm ci
else
  log "Installing Node dependencies (npm install)..."
  npm install
fi

# 5. Pre-pull local Supabase images (best effort) ----------------------------
# Baking the images into the snapshot keeps the per-boot `start` fast. Never
# fail the install if this step cannot run (e.g. no Docker privileges yet).
log "Pre-pulling local Supabase images (best effort)..."
if bash scripts/cloud-agent-start.sh >/tmp/install-prepull.log 2>&1; then
  supabase stop --no-backup >/dev/null 2>&1 || true
  log "Supabase images cached."
else
  log "Skipping image pre-pull (see /tmp/install-prepull.log); start will pull on first boot."
fi

log "Install complete."

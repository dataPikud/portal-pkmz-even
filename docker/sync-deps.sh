#!/bin/sh
# Dev only. Usage: sync-deps.sh <workspace>   (backend or frontend)
# node_modules lives in named volumes that survive restarts, so it can go stale when
# the root package-lock.json changes. Reinstall only when the lockfile's hash differs
# from the one stored in /app/node_modules (the image writes it at build time).
set -eu

cd /app
current=$(md5sum package-lock.json | cut -d' ' -f1)
stored=$(cat node_modules/.lock-hash 2>/dev/null || true)

if [ "$current" != "$stored" ]; then
  echo "package-lock.json changed: running npm ci for $1"
  # A volume mount point can't be removed, so empty the folders and let npm fill them
  find node_modules "$1/node_modules" -mindepth 1 -delete 2>/dev/null || true
  npm ci --workspace "$1"
  echo "$current" > node_modules/.lock-hash
fi

#!/usr/bin/env bash
# Run the full TBP ERP dev stack in the foreground:
# API (4000) + Web (5173) + public Cloudflare tunnel.
# Stays alive as a single process group; Ctrl-C stops everything.
set -m
cd "$(dirname "$0")/.."

(cd apps/api && exec ../../node_modules/.bin/tsx src/server.ts 2>&1 | sed -u 's/^/[api]    /') &
sleep 2
(cd apps/web && exec ./node_modules/.bin/vite --host --port 5173 2>&1 | sed -u 's/^/[web]    /') &
sleep 4
(/tmp/cloudflared tunnel --url http://localhost:5173 --no-autoupdate 2>&1 | sed -u 's/^/[tunnel] /') &

wait

#!/usr/bin/env bash
# One-shot environment setup for the TBP ERP sandbox:
# database service + schema, npm dependencies, Prisma client, seed data.
# Safe to re-run any number of times (idempotent).
set -e
cd "$(dirname "$0")/.."

echo "▶ Starting MariaDB…"
if ! command -v mariadbd >/dev/null 2>&1 && ! sudo -n mysql --version >/dev/null 2>&1; then
  echo "  …installing MariaDB server"
  sudo -n apt-get update -qq >/dev/null 2>&1
  sudo -n DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mariadb-server >/dev/null 2>&1
fi
sudo -n service mariadb start >/dev/null 2>&1 || true
for i in $(seq 1 15); do
  sudo -n mysqladmin ping >/dev/null 2>&1 && break
  sleep 1
done
sudo -n mysql -e "
  CREATE DATABASE IF NOT EXISTS nexus_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS 'erp'@'localhost' IDENTIFIED BY 'erp_password';
  CREATE USER IF NOT EXISTS 'erp'@'%' IDENTIFIED BY 'erp_password';
  GRANT ALL PRIVILEGES ON nexus_erp.* TO 'erp'@'localhost';
  GRANT ALL PRIVILEGES ON nexus_erp.* TO 'erp'@'%';
  GRANT ALL PRIVILEGES ON \`prisma\_migrate\_shadow\_db\_%\`.* TO 'erp'@'localhost';
  GRANT ALL PRIVILEGES ON \`prisma\_migrate\_shadow\_db\_%\`.* TO 'erp'@'%';
  FLUSH PRIVILEGES;"

echo "▶ Installing dependencies…"
if [ ! -d node_modules ]; then
  npx -y pnpm@9.15.9 install --frozen-lockfile --silent
fi

echo "▶ Generating Prisma client…"
npx -y pnpm@9.15.9 exec prisma generate >/dev/null

echo "▶ Applying migrations…"
npx -y pnpm@9.15.9 exec prisma migrate deploy >/dev/null 2>&1 \
  || npx -y pnpm@9.15.9 exec prisma migrate dev --name init >/dev/null

echo "▶ Seeding…"
npx -y pnpm@9.15.9 exec tsx prisma/seed.ts | grep -E "admin@|Seed complete"

echo "✅ PREPARED — start the API (apps/api) and web (apps/web) servers now."

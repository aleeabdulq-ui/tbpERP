-- Allow the app user to create Prisma's per-run shadow databases so
-- `pnpm db:migrate` (prisma migrate dev) works inside docker compose.
GRANT ALL PRIVILEGES ON `prisma\_migrate\_shadow\_db\_%`.* TO 'erp'@'%';
FLUSH PRIVILEGES;

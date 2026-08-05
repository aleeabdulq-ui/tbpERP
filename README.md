# TBP ERP — The Building Practice Limited

Production-oriented ERP foundation with a React 19/Vite dashboard, Express REST API, MySQL/Prisma data layer, rotating JWT sessions, RBAC, and responsive enterprise UI.

## Architecture

- `apps/web` — React 19, TypeScript, Tailwind v4, shadcn-style source components, TanStack Query, React Router, Axios, React Hook Form/Zod, Framer Motion and Recharts.
- `apps/api` — Express 5, TypeScript, Helmet, strict CORS, Morgan, rate limiting, JWT access tokens, rotated hashed refresh tokens, CSRF validation and Zod.
- `prisma` — relational schema with foreign keys, indexes, timestamps and soft-delete fields.

## Setup

1. Copy `.env.example` to `.env` and replace both JWT secrets with independent random strings of at least 32 characters.
2. Run `docker compose up -d mysql`.
3. Run `corepack pnpm install`.
4. Run `corepack pnpm db:generate` and `corepack pnpm db:migrate -- --name init`.
5. Run `corepack pnpm db:seed`.
6. Run `corepack pnpm dev`, then open `http://localhost:5173`.

## Commands

- `npm run dev` — web and API development servers.
- `npm run build` — production builds.
- `npm run typecheck` — strict TypeScript checks.
- `docker compose up --build` — containerized stack.

See [API documentation](docs/API.md). New modules should follow feature folders and introduce permission strings rather than role-name conditionals.

## Security

Passwords use bcrypt cost 12. Refresh tokens are random, hashed at rest, rotated, revocable, HttpOnly, SameSite Strict and CSRF-protected. Access tokens are short lived. Production should use HTTPS, `COOKIE_SECURE=true`, managed secrets, restricted DB credentials, an email provider, object storage plus malware scanning for uploads, audit logs and backups.

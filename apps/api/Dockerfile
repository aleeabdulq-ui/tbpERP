FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile
COPY prisma prisma
COPY apps/api apps/api
RUN pnpm exec prisma generate && pnpm --filter @nexus/api build
CMD ["pnpm","--filter","@nexus/api","start"]

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY apps/web apps/web
RUN pnpm --filter @nexus/web build
FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
RUN printf 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri /index.html; } }' > /etc/nginx/conf.d/default.conf

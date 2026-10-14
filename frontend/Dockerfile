# Build from the repository root (the npm workspaces share the root package-lock.json):
#   docker build -f frontend/Dockerfile --target prod .
# Targets: dev (Vite dev server), prod (static build served by nginx)

FROM node:24.21.0-bookworm-slim AS deps
WORKDIR /app
# npm ci checks the lockfile against every workspace, so the backend's package.json has to be here too.
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci --workspace frontend \
    && md5sum package-lock.json | cut -d' ' -f1 > node_modules/.lock-hash

# ===== dev =====
# The source is bind-mounted over /app/frontend by docker-compose.dev.yml.
FROM deps AS dev
ENV NODE_ENV=development
WORKDIR /app/frontend
EXPOSE 5173
CMD ["sh", "-c", "sh /docker/sync-deps.sh frontend && npm run dev -- --host 0.0.0.0 --port 5173"]

# ===== build =====
FROM deps AS build
WORKDIR /app/frontend
COPY frontend ./
RUN npm run build

# ===== prod =====
FROM nginx:1.30.5-alpine AS prod
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80

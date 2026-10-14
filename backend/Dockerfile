# Build from the repository root (the npm workspaces share the root package-lock.json):
#   docker build -f backend/Dockerfile --target prod .
# Targets: dev (tsx watch), build (compile; also used by the prod migrate service), prod (node dist/server.js)

FROM node:24.21.0-bookworm-slim AS base
WORKDIR /app
# openssl is needed by Prisma's schema engine (prisma migrate)
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# All backend dependencies (dev + prod). npm ci checks the lockfile against every
# workspace, so the frontend's package.json has to be here too.
FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend \
    && md5sum package-lock.json | cut -d' ' -f1 > node_modules/.lock-hash

# ===== dev =====
# The source is bind-mounted over /app/backend by docker-compose.dev.yml. Runs as root
# so the mounted volumes (node_modules, uploads) are writable.
FROM deps AS dev
ENV NODE_ENV=development
WORKDIR /app/backend
CMD ["sh", "-c", "sh /docker/sync-deps.sh backend && mkdir -p uploads/videos uploads/thumbnails && npx prisma generate && npx tsx watch src/server.ts"]

# ===== build =====
FROM deps AS build
WORKDIR /app/backend
COPY backend/prisma.config.ts backend/tsconfig.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src
RUN npx prisma generate && npm run build

# ===== production dependencies only =====
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
# npm hoists most packages to /app/node_modules; backend/node_modules only exists when
# a version conflict forces nesting, so make sure it exists for the COPY below
RUN npm ci --workspace backend --omit=dev \
    && mkdir -p backend/node_modules

# ===== prod =====
FROM base AS prod
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY backend/package.json ./backend/
WORKDIR /app/backend
# Uploads live in a volume. Creating the folders here (owned by "node") lets the
# named volume inherit them, so the non-root user can write.
RUN mkdir -p uploads/videos uploads/thumbnails && chown -R node:node uploads
USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]

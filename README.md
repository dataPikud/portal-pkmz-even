# Organization Portal

Fullstack starter for an internal organization portal. The frontend is a React + Vite + TypeScript app, and the backend is a Node.js + TypeScript + Express API with Prisma and structured logging.

## Structure

```text
frontend/   React Vite TypeScript portal UI
backend/    Express TypeScript API, Prisma schema, logger, routes
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run prisma:migrate
```

## Local Setup

Copy `backend/.env.example` to `backend/.env` and update values as needed. The default database is SQLite at `backend/prisma/dev.db`.

The frontend runs on `http://localhost:5173` and the backend API runs on `http://localhost:4000`.

## Run with Docker

Docker Desktop (or Docker Engine with Compose) is the only requirement.

### Development

```bash
cp .env.dev.example .env.dev
npm run docker:dev:reset
```

Open http://localhost:5173. Editing a file under `frontend/` or `backend/` reloads it inside the containers.

If a port is already taken on your machine, set `DEV_FRONTEND_PORT`, `DEV_BACKEND_PORT` or `DEV_DB_PORT` in `.env.dev` (see the example file). Ports inside Docker never change.

| Script | What it does |
| --- | --- |
| `npm run docker:dev` | Build and start everything (database, backend, frontend) |
| `npm run docker:dev:down` | Stop the containers and keep the data |
| `npm run docker:dev:reset` | Drop the dev database and uploads, start, migrate and run `seed:dev` |

Create a new migration inside the running backend container:
`docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name <name>`

### Production

On the server only:

```bash
cp .env.prod.example .env.prod   # then replace every CHANGE_ME
npm run docker:prod:up           # build and start; the portal is published on port 80 (HTTP_PORT)
npm run docker:prod:migrate      # apply database migrations
npm run docker:prod:seed         # add the main categories (safe to run again)
```

`.env.dev` and `.env.prod` are ignored by git. Never commit them.

The production database runs in its own container and is not reachable from outside Docker. A nightly `pg_dump` (02:00 UTC) goes to the `backups` volume and the last 14 days are kept.

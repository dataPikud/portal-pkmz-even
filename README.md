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

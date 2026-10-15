# Standard project structure

Condensed English version of the team's document `project-structure.pdf` (version 1.0, Hebrew), the companion of [typescript-coding-standards.md](typescript-coding-standards.md). One mandatory structure for the backend and one for the frontend. If this file and the original disagree, the original wins.

The original's examples are about a library app (users, books, loans) and its section 2.3 maps files of that project. The names below are this portal's own.

## 1. The shared principle

Organize by **feature**, not by technical type (standard 9.5).

| Approach | Adding a feature | Removing a feature |
| --- | --- | --- |
| By technical type (`controllers/`, `services/`) | touches about 6 folders | search every folder; leftovers stay |
| By feature (`modules/videos/`) | one folder | delete one folder |

Three folders at the top of `src/`:

| Folder | Holds | Iron rule |
| --- | --- | --- |
| `modules/` (backend) or `features/` (frontend) | all business logic | `shared/` MUST NOT import from it |
| `shared/` | code used across features, with no business knowledge | MUST NOT know any specific feature |
| `config/` or `app/` | wiring and startup | loaded once at startup |

## 2. Backend (Express, Prisma, Zod)

```text
backend/
├── prisma/                  migrations/, schema.prisma, seed.dev.ts, seed.prod.ts
├── src/
│   ├── server.ts            entry point: listen and graceful shutdown only
│   ├── app.ts               builds Express: middlewares and routes; no listen
│   ├── routes.ts            mounts the routers of every module
│   ├── config/
│   │   └── env.ts           Zod validation of process.env (standard 8.5)
│   ├── modules/             all business logic, one folder per feature
│   │   └── <feature>/
│   │       ├── <feature>.route.ts         paths and middlewares
│   │       ├── <feature>.controller.ts    HTTP in, service call, HTTP out
│   │       ├── <feature>.service.ts       business logic; no Request/Response
│   │       ├── <feature>.repository.ts    the only code that calls Prisma
│   │       ├── <feature>.mapper.ts        DB row -> response (standard 8.6)
│   │       ├── <feature>.schema.ts        Zod schemas for request and response
│   │       ├── <feature>.dto.ts           types derived from the schemas (z.infer)
│   │       ├── <feature>.service.test.ts  unit test next to the code
│   │       └── index.ts                   the module's public API only
│   └── shared/              no business knowledge
│       ├── errors/          app-error.ts and the subclasses, index.ts
│       ├── middlewares/     authenticate, authorize, validate, request-id, request-logger, not-found, error
│       ├── db/              prisma.ts (the one PrismaClient), prisma-error-codes.ts
│       ├── http/            response.ts
│       ├── logger/          logger.ts (Pino, redaction)
│       ├── security/        password-hash.ts, token.ts
│       ├── utils/           catch-async.ts, context.ts, clock.ts
│       └── types/           express.d.ts, result.ts, common.dto.ts
├── tests/                   integration and end-to-end only
├── .env.example
├── eslint.config.js
├── tsconfig.json
└── package.json
```

### Modules in this portal

Today: `health`, `users`, `main-categories`, `systems`, `videos`, `uploads`, `visits`, `contact`, `notifications`. From branch 2: `folders`, `analytics`, `search`. From branch 3: `auth`. Later branches add `favorites` and the admin inbox to `contact`.

### Dependency direction

```text
server.ts -> app.ts -> routes.ts -> module route -> controller -> service -> repository -> prisma
```

| Rule | Why |
| --- | --- |
| `shared/` NEVER imports from `modules/` | otherwise a cycle forms and `shared` stops being shared |
| A module imports another module only through its `index.ts` | standard 9.8 |
| A service does not know `Request` or `Response` | standard 2.4 |
| A repository holds no business rules | the DB can change without touching the logic |
| A controller holds no queries | |
| Only `shared/db/prisma.ts` creates `PrismaClient` | one instance, replaceable in tests |

### What goes into a module's `index.ts`

The service, the router and the public types. NOT the mapper, the repository or internal helpers.

```ts
// src/modules/videos/index.ts
export { videoService } from './video.service.js';
export { videoRouter } from './video.route.js';
export type { Video, VideoResponse } from './video.dto.js';
```

## 3. Frontend (React, Vite)

```text
frontend/
├── public/
├── index.html
├── src/
│   ├── main.tsx             entry point: createRoot only
│   ├── App.tsx              shell: providers and router
│   ├── app/                 wiring and startup
│   │   ├── router.tsx       every route
│   │   ├── providers.tsx    every context provider in one place
│   │   ├── error-boundary.tsx
│   │   └── layout/          the app shell: Navbar, Sidebar (decision D9)
│   ├── pages/               route components, thin: they only compose features
│   │   └── <name>.page.tsx
│   ├── features/            all business logic
│   │   └── <feature>/
│   │       ├── components/
│   │       ├── hooks/             use-<name>.ts
│   │       ├── api/               <feature>.api.ts, network calls of this feature only
│   │       ├── <feature>.schema.ts  Zod validation of API responses (standard 8.1)
│   │       ├── <feature>.types.ts
│   │       ├── <feature>.store.ts   only when the feature has its own state
│   │       └── index.ts             the feature's public API
│   ├── shared/              no business knowledge
│   │   ├── ui/              design-system primitives: Button/, Input/, Modal/, Spinner/
│   │   ├── hooks/           use-debounce.ts, use-media-query.ts, use-smart-loader.ts
│   │   ├── lib/             http-client.ts (fetch plus AbortSignal), format.ts, storage.ts
│   │   ├── config/          env.ts (Zod validation of import.meta.env)
│   │   └── types/           api.types.ts
│   ├── assets/
│   └── styles/              reset.css, tokens.css (colors, spacing, typography)
├── tests/                   setup.ts, e2e/
├── .env.example
├── eslint.config.js
├── vite.config.ts
├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
└── package.json
```

### Features in this portal

`auth`, `theme`, `contact`, `notifications`, `videos`, `systems`, `categories`, `folders`, `search`, `admin`, `favorites`. A feature appears when its code is moved or created; an empty folder is not created in advance.

### Dependency direction

```text
main.tsx -> App.tsx -> app/router -> pages/ -> features/ -> shared/
```

| Rule | Why |
| --- | --- |
| `pages/` composes `features/`; a feature MUST NOT import from `pages/` | no cycle; a feature can be reused on several pages |
| `shared/ui` knows no business entity | `Button` does not know what a video is; `VideoCard` belongs to `features/videos` |
| A feature imports another feature only through its `index.ts` | standard 9.8 |
| Every network call goes through `shared/lib/http-client` | one place for the session, errors and `AbortSignal` |
| An API response is validated with Zod before use | the server is not a safe source of truth for the client (standard 8.1) |

### Thin page, rich feature

A page only composes. It MUST NOT hold network calls, filtering logic or complex state; those belong in the feature's hooks.

```tsx
export const VideosPage = (): React.JSX.Element => (
  <PageLayout title="חומרי הטמעה">
    <VideoFilters />
    <VideoList />
  </PageLayout>
);
```

### Where future libraries go

| Library | Location |
| --- | --- |
| React Router | `app/router.tsx` |
| TanStack Query | `app/providers.tsx` and `app/query-client.ts` |
| Zustand or Redux | `features/<name>/<name>.store.ts` for a feature; `app/store.ts` only for truly global state |
| React Hook Form with Zod | `features/<name>/components/`, next to that feature's schema |
| Vitest with Testing Library | tests next to the code, plus `tests/setup.ts` |

## 4. Shared conventions

### File names

| Kind | Pattern | Example |
| --- | --- | --- |
| Folder | kebab-case | `main-categories/` |
| Code file | kebab-case plus role | `video.service.ts`, `validate.middleware.ts` |
| React component | PascalCase | `VideoCard.tsx` |
| Hook | `use-` plus kebab-case | `use-videos.ts` |
| Page | kebab-case plus `.page.tsx` | `home.page.tsx` |
| Store | kebab-case plus `.store.ts` | `auth.store.ts` |
| Test | name of the tested file plus `.test.ts` | `video.service.test.ts` |
| Types | `.dto.ts` or `.types.ts` | `auth.types.ts` |
| Validation schema | `.schema.ts` | `video.schema.ts` |

PascalCase is only for React components. An `index.ts` MUST NOT hold logic: it is an export file only. CSS modules stay next to their component (`Button/Button.module.css`).

### Import paths

- **Backend:** relative imports, at most two `../`, no alias (project decision D9: `tsc` does not rewrite `@/` paths for `node dist/server.js`). Relative imports include the `.js` extension.
- **Frontend:** relative imports inside one feature; the alias `@/*` -> `src/*` when crossing a boundary. Declare it in `tsconfig.app.json` and in `vite.config.ts`, or the code compiles and then fails to run.

### Where does new code go?

| Question | Answer |
| --- | --- |
| Does it mention a business entity (video, system, folder, message, user)? | `modules/` or `features/` |
| Do two or more features really use it today? | `shared/` |
| Does only one feature use it right now? | inside that feature; move to `shared/` when a second one needs it |
| Does it run once at startup? | `config/` or `app/` |
| Is it a visual component with no business knowledge? | `shared/ui/` |
| Does it talk to the DB? | `<module>/<name>.repository.ts` |
| Does it talk to the API (frontend)? | `<feature>/api/<name>.api.ts` |

MUST NOT move code to `shared/` "because it might be needed". Move it when the second use appears, not before.

### Automatic enforcement

Boundary rules are enforced in ESLint as `error`, never `warn`:

```js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['**/modules/*/*', '**/features/*/*'], message: 'Import from another feature only through its index.ts.' },
        { group: ['../../../*'], message: 'More than two levels up: restructure, or use the @/ alias (frontend).' },
      ],
    }],
    'import/no-cycle': 'error',
  },
}
```

Tune the patterns to the real paths when branch 12 sets them up (the original sketch used `@/modules/*/*`; the backend has no alias).

## 5. Moving an existing module

Migrate one module at a time, in its own pull request or commit, with **no logic change**, so the diff stays readable. First move the files, then split the layers. Keep every URL, status code and JSON shape as it is.

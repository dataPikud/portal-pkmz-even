# Pakmaz portal: instructions for every session

The Pakmaz organization portal. Frontend: React 19 + Vite 8 in `frontend/`. Backend: Express 5 + Prisma 7 + PostgreSQL in `backend/`. npm workspaces with one root `package-lock.json`. The UI is in Hebrew, right-to-left, in dark and light themes.

The plan (private page, read it with the Artifact tool, not a web fetch): https://claude.ai/artifact/SJURmWiSwWdLjiwVJfQtpD. `branches.html` has one card per branch; the card's issue is the spec for a session. Decisions D1 to D9 are final; D8 (HTTPS) is open. Do not reopen a decision. If the code makes one impossible, stop and tell the user.

## Coding standards (mandatory for all code)

The full rules are imported below and apply to every file you write or change, in `backend/` and `frontend/`:

@docs/standards/typescript-coding-standards.md
@docs/standards/project-structure.md

The rules most often missed. Check each one before you finish a file:

1. No `any`: use `unknown` and narrow. No `!`. No `as` to silence the compiler, and never `as` on external data.
2. Validate every external value once, at the boundary, with a Zod schema, and derive the type with `z.infer`: request body, query and params, API responses, environment variables, raw query results, `localStorage`. Never `req.body as X` or `res.json() as X`.
3. Read `process.env` only in `config/env.ts` (the validated config module). Never log the config object.
4. Backend layers: controller, then service, then repository. A service never sees `Request` or `Response`. Only a repository calls Prisma. A route never returns a database row: a mapper builds the response.
5. Frontend layers: pages, then features, then shared. A page only composes. Every network call goes through `shared/lib/http-client` and its response is validated with Zod.
6. One folder per feature (`modules/<feature>/` or `features/<feature>/`). `shared/` never imports from a feature. Import another feature only through its `index.ts`. No import cycles.
7. Backend imports are relative with at most two `../` and include `.js`. Frontend uses the `@/` alias for `src/`.
8. Named exports. Default export only where a framework requires it. `import type` for type-only imports. No `export let`.
9. Exported functions have an explicit return type. At most three parameters, otherwise one typed object. Arrow functions by default.
10. `type` for data, `interface` only for a contract a class implements. `readonly` on model and DTO fields. No `enum`: use an `as const` object or a union. Discriminated unions with `assertNever`.
11. `===` always (`== null` only with a comment). `??` not `||` for defaults. No truthiness checks on strings or numbers. `undefined` means "no value"; convert `null` from the database at the boundary.
12. Errors: throw only `Error` subclasses (`AppError` and its children), type `catch` as `unknown`, never an empty `catch`. Business failures may return a `Result`; infrastructure faults throw. The client gets a generic message and a code, never a stack trace or SQL.
13. `async`/`await` only, no `.then()` mixed in. No floating promises. No `forEach(async ...)`. Independent work uses `Promise.all`. Pass an `AbortSignal` through long requests and cancel stale ones.
14. No `console.log` in production code: use the logger. No `@ts-ignore` (`@ts-expect-error` with a reason). No file-wide `eslint-disable`. No commented-out code.
15. Do not mutate: copy before `sort` or `reverse`, spread instead of `Object.assign`, build a `Map` instead of a nested `find`.
16. Security: check permission on the server per request and per resource, deny by default, never trust the UI. No secret in source and no default secret value. Hash passwords with bcrypt. Never log passwords, tokens or personal data.
17. Names: kebab-case files with a role (`video.service.ts`), PascalCase component files, `use-*.ts` hooks, `*.page.tsx` pages, `*.store.ts` stores, UPPER_SNAKE_CASE only for real primitive module constants, no `I` prefix, no generic names (`data`, `utils`, `helper`), units in names (`timeoutMs`).
18. Comments say why, not what. Document every lint suppression and every exception to these rules.
19. Formatting is Prettier's job: single quotes, semicolons, trailing commas, 100 columns, `arrowParens: always`.

Project decisions (D9) are at the end of the standards file and override the original where they differ. The original documents are Hebrew PDFs (`typescript-coding-standards.pdf`, `project-structure.pdf`); if the PDFs are in `docs/standards/` and disagree with the Markdown, the PDF wins.

**Where the code stands.** Branch 12 (`chore/code-standards-and-project-structure`) moves the existing code into this structure and adds the checks. Until it is merged, the code is still the old flat layout (`routes/`, `middleware/`, `lib/`, `components/`, `pages/`, `lib/api.ts`). Write every new file to the standards and in the new structure. Do not copy the old layout or old habits (an `as` cast on `req.body`, Prisma calls inside a route) into new code, and do not rewrite old code outside the task. If the structure for the code you are adding is unclear, ask.

## How to work in a session

Before you change anything:
1. Read this branch's card and issue on `branches.html`, and the plan sections it refers to.
2. Run `git status` and `git branch --show-current`. The branch must match the card's branch and be up to date with `main`. If not, stop and tell the user. The user creates and switches branches, never you.
3. Read the code the tasks touch and compare the issue's "Today" section with it. Say where it no longer matches.
4. Give a short plan: files to add or change, any Prisma migration by name, any new dependency and why, anything in the issue that looks wrong or missing. Wait for the user's OK before editing.

While working:
- Scope is this issue only. Write down anything else you notice as a follow-up; do not fix it.
- Match the existing code: naming, file layout, CSS modules, comment density. UI text is Hebrew. The layout is RTL in dark and light themes.
- Database: create migrations in the dev container with `docker compose --env-file .env.dev -f docker-compose.dev.yml exec backend npx prisma migrate dev --name <descriptive_name>`. Never edit a migration that is already merged. After a schema change, update `seed.dev.ts`, and `seed.prod.ts` if production needs it.
- **Dev only until the end.** Work, test and QA in the dev containers only. Do not start, migrate, seed or test the prod compose (`docker:prod:*`) in a branch session. Production is checked once, at the end of the whole plan. A "Done when" item about prod is skipped, reported as "deferred to the production pass", and listed in the follow-ups. Code and config meant for prod (for example `seed.prod.ts`) may still be edited, but not run.
- Run and test everything in the dev Docker containers: `npm run docker:dev`, `npm run docker:dev:reset`. Dev test accounts (from branch 3): `1000001` (admin), `1000002` (user).
- New environment variables go in `.env.dev.example`, `.env.prod.example` and `config/env.ts`. Never create, read or commit a real `.env.dev`, `.env.prod`, `backend/.env` or any secret. The user creates those files.
- Ask before adding a dependency that is not in the plan, and before anything destructive (deleting files, dropping data, resetting a database other than dev).
- Git: commit in small, logical steps with clear messages, but only after the user approves. The user usually approves all commits after the whole branch is done, with a summary and a QA checklist. Never push, merge, rebase `main` or open a pull request.

Before you finish:
1. Run `npm run build` and `npm run lint` in `backend/` and `frontend/` (and `typecheck`, `format:check` and the tests once they exist). Fix what fails.
2. Go through the issue's "Done when" list item by item. For each, say whether it passes and how you checked it (a command and its output, a request and its response, or what the screen shows).
3. If the card has the `smoke pass` label, give a short click-through script for `1000001` and for `1000002`, with what to expect at each step.
4. End with: what changed, grouped by area; any "Done when" item that failed or was skipped, and why; follow-ups for the board; a pull request title and a description ending with `Closes #<issue>`.

## Things that already caused trouble

- **Lockfile.** Keep the root `package-lock.json` listing the Linux native packages (`@rolldown/binding-linux-x64-gnu`, oxlint and esbuild bindings). npm on Windows can drop them, and the frontend then fails to build in Docker. Check after any dependency change. The per-package lockfiles in `backend/` and `frontend/` are stale and unused.
- **Docker.** Images build from the repo root (`docker build -f backend/Dockerfile .`). Compose pins the ports and `DATABASE_URL` inside the containers; change only the host ports (`DEV_DB_PORT`, `DEV_BACKEND_PORT`, `DEV_FRONTEND_PORT`, `HTTP_PORT`) in the env files. The root scripts read `.env.dev` and `.env.prod` through `--env-file`.
- **Dev machine is Windows.** Bind mounts do not pass file events into containers, so watching is by polling. In Git Bash, set `MSYS_NO_PATHCONV=1` before `docker exec` commands with `/paths`.
- **`seed.dev.ts` wipes data** and refuses to run when `NODE_ENV=production`. `seed.prod.ts` only adds what is missing.
- Database id sequences: the seeds insert category ids by hand. After seeding with explicit ids, move the sequence past them.

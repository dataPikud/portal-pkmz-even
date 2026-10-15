# Pakmaz portal plan

This file is the Markdown copy of the plan webpage, https://claude.ai/artifact/SJURmWiSwWdLjiwVJfQtpD (`index.html` and `branches.html`). Copied from webpage version `1791978362-9eb0` on 15 October 2026.

**Who updates what.** A Claude Code session updates only this file, and only after the user says CI passed on the branch's pull request (see the session prompt): the branch's status, the ticked tasks and "Done when" items in its issue, agreed changes, follow-ups, later issues it affects, and the "Status" summary. The user updates the webpage from this file. Keep the structure and headings as they are, so the two stay easy to compare.

## The plan

Final plan · updated 14 October 2026, after branch 1

12 branches take the portal from where it is today to the 9 requirements. Docker comes first, development features next, SSO and the production release last. Every branch has a ready-to-paste issue on the Branches & issues page.

> **Status, 14 October.** Branch 1 (Docker for development and production) is finished on its branch and was tested in the dev and prod containers. It is waiting for its pull request. Branch 2 is next. Branch 12 (code standards and project structure) was added on 14 October; it runs after branch 2 and before branch 3. The board setup is on the Branches & issues page.
>
> **Decided:**
>
> - **Docker:** separate Docker setups for development and production.
> - **Login (D1):** development uses a 7-digit employee ID with a password, and later SSO. Production uses SSO only.
> - **Roles (D2):** the content-admin role is dropped.
> - **Databases (D3):** the dev database is reset and reseeded, and production gets its own seed.
> - **Folder delete (D4):** deleting a folder lists what goes with it and asks twice.
> - **Inbox (D5):** the inbox starts read-only.
> - **Production database (D6):** production runs its own Postgres container.
> - **SSO (D7):** configured after development is finished. Until then, the login code leaves room for it.
>
> **Still open:** who handles HTTPS in production (D8). It's needed only before branch 11.
>
> **Code state.** `main` is at `bf2046e`. Branch 1 adds 9 commits on top of it (the last is `13b4a84`) and is not merged yet. The screens in your screenshots come from the unmerged `feature/nested-categories-and-tags` (`e2f2cf6`, 38 files), which is branch 2. Login is still a stub that makes every visitor `admin001`. `backend/.env.example` is committed in branch 1 and marked as the example for running without Docker.

### The 9 requirements and where they stand

"Today" means `main` plus the unmerged feature branch, because that's what the screenshots show.

| # | Requirement | Today | What's missing | Branch |
| --- | --- | --- | --- | --- |
| 1 | Login for admins and regular users | [Stub only] | There's no password, no SSO and no session. The browser sends `X-Employee-Id`, the server believes it and creates the user if it's new, and the frontend makes everyone `admin001`. | 3, 10 |
| 2 | Only admins see the management panel tab | [Partial] | The sidebar and user menu hide the link from non-admins, but the `/admin` route itself has no guard. The מצב עריכה button also shows for content admins. | 4 |
| 3 | Only admins add a new app (הוספת מערכת) | [Mostly built] | The modal (with tags, image and folder picker) and the admin-only API exist. URL validation is missing (the server only checks the field isn't empty), and errors use `alert()`. | 4, 5 |
| 4 | Only admins post a portal message | [Mostly built] | Create and delete work. Editing a message and length limits are missing, and errors come back as `{ error }` where every other route uses `{ message }`. | 4, 6 |
| 5 | Only admins upload a video | [Partial] | Upload works, but content admins can upload too (`requireContentOrAdmin`). If saving the video's details fails, the uploaded file stays on disk. | 4, 5 |
| 6 | Only admins edit, add and delete folders | [Built, unmerged] | Nested folder CRUD exists on the feature branch. Deleting a folder silently deletes its sub-folders, and their apps and videos drop out of the tree. D4 replaces this. | 2, 4, 5 |
| 7 | Favorite on every app, share on every video | [Partial] | Favorites live in the browser's `localStorage`, so they're lost on another computer. Video cards copy a link, but the player uses `alert()`. | 7 |
| 8 | Admin's bottom-left button opens an inbox of user messages | [API only] | `GET /api/contact` exists and is admin-only, but there's no screen. Admins currently get the user's send form. | 9 |
| 9 | User's bottom-left button sends a message to the admin (פנייה למנהל המערכת) | [Mostly built] | The form works, but anonymous senders are accepted and the מזהה ארגוני field is editable, so a message can claim any employee ID. | 8 |

### Development and production

Both run in Docker, from two compose files at the repository root (branch 1). The same code runs in both, and environment variables decide how it behaves.

|  | Development | Production |
| --- | --- | --- |
| Compose file | `docker-compose.dev.yml` | `docker-compose.prod.yml` |
| Start | `npm run docker:dev` | `npm run docker:prod:up` |
| Images | Built from the repository root, so both use the root `package-lock.json`. Node 24.21.0, nginx 1.30.5 and Postgres 16.15, pinned to exact tags. | Same as development |
| Frontend | Vite dev server with hot reload, port 5173 (`DEV_FRONTEND_PORT` changes it on your machine) | Built once and served by nginx, which also forwards `/api` and `/uploads` to the backend. Published on port 80 (`HTTP_PORT` changes it). |
| Backend | `tsx watch` on the mounted source, port 4000 (`DEV_BACKEND_PORT`) | Compiled (`node dist/server.js`), runs as a non-root user, reachable only inside Docker |
| Database | Postgres container, volume `pgdata-dev`, port 5432 (`DEV_DB_PORT`) | The portal's own Postgres container (D6), volume `pgdata-prod`, reachable only inside Docker |
| Backups | None. Reset at will. | Nightly `pg_dump` at 02:00 UTC into a `backups` volume, keeping 14 days. A backup of the uploads volume is added in branch 11. |
| Migrations | `prisma migrate dev`: creates and applies migrations | `prisma migrate deploy`: only applies them, from a one-off `migrate` service |
| Seed | `seed.dev.ts`: wipes the data and fills in demo content and test accounts | `seed.prod.ts`: creates the 3 main categories and, from branch 3, the first admins. It can safely run again and never deletes. |
| Reset | `npm run docker:dev:reset`: drops the volume, migrates, seeds | None. Production data is never reset. |
| Login | 7-digit employee ID + password. SSO through a local Keycloak (port 8080) is added in branch 10. | SSO only, through the organization's identity provider (branch 10) |
| Environment file | `.env.dev`, copied from `.env.dev.example` | `.env.prod`, copied from `.env.prod.example`; it lives only on the server and is never committed |
| Uploaded videos | Volume `uploads-dev` | Volume `uploads-prod` |
| Logs | Readable (`pino-pretty`), level `debug` | JSON, level `info` |

> **Guards between the two.**
>
> - The dev seed refuses to run when `NODE_ENV=production`.
> - The prod seed only adds what's missing.
> - `.gitignore` ignores every `.env*` file except the two `*.example` files.
> - Password login answers 404 in production, because `AUTH_MODES=sso` there.
> - Inside Docker, the compose files fix `PORT` and `VITE_PROXY_TARGET` and build `DATABASE_URL` from `POSTGRES_*`, so a wrong value in an env file can't break the stack. Only the ports on your machine are configurable (`DEV_*_PORT`, `HTTP_PORT`).

On Windows, file-change events don't reach containers through bind mounts, so the dev containers watch files by polling.

### Order of work

Each branch is cut from `main` and merges back into `main` through a pull request.

- **Docker comes first,** so every later branch is built and tested the same way.
- **Login comes before the permission work,** because "admins only" means nothing while anyone can claim to be an admin.
- **SSO comes after the development features,** as you decided.

- **M1 Foundation:** 1 Docker dev & prod → 2 folders & tags → 12 code standards & structure → 3 password login & roles → 4 admin-only access
- **M2 Admin tools:** 5 apps, videos, folders · 6 portal messages
- **M3 Users & inbox:** 7 favorites & share · 8 user contact form → 9 admin inbox
- **M4 SSO & release:** 10 SSO login → 11 docs, acceptance, prod release

- **Branches 1, 2, 12, 3 and 4 go strictly in this order.** Branch 2 needs the dev database reset from branch 1. Branch 12 comes right after branch 2 has merged, because moving and formatting files while branch 2's 38 files are still open would conflict with them. It comes before branch 3 so that login, permissions and everything after are written in the new structure. It is numbered 12 so the other branch numbers stay the same. Branch 3 changes the `User` table and how every request is identified, and branch 4 builds its checks on the new role.
- **Branches 5 to 9 can go in any order after 4.** The only tie is 8 before 9: both use the same bottom-left button, and the inbox is easier to test with real messages in it. When 9 is merged, development is finished.
- **Branch 10 adds SSO** into the room branch 3 left for it. It's tested against Keycloak in development and configured with IT's details for production (D7).
- **Branch 11 is last.** It runs every requirement as an admin and as a user, then deploys to production.

| # | Branch | Covers | Size |
| --- | --- | --- | --- |
| 1 | `chore/docker-dev-and-prod-environments` [done] | Dev and prod environments, the split seeds, the prod database and backups (D3, D6) | M |
| 2 | `feature/nested-categories-and-tags` [exists] | Requirement 6 (base for 3 and 5) | M |
| 12 | `chore/code-standards-and-project-structure` | The TypeScript standards and the standard folder structure, with checks that enforce them. Runs after 2, before 3 (D9) | L |
| 3 | `feature/login-and-user-roles` | Requirement 1: password login, session, roles, room for SSO (D1, D2, D7) | L |
| 4 | `feature/admin-only-access-control` | Requirement 2, and the "only admins" part of 3–6 | M |
| 5 | `feature/admin-content-management` | Requirements 3, 5, 6, and the folder delete flow (D4) | L |
| 6 | `feature/admin-portal-messages` | Requirement 4 | S |
| 7 | `feature/server-favorites-and-video-share` | Requirement 7 | M |
| 8 | `feature/user-contact-form` | Requirement 9 | S |
| 9 | `feature/admin-inbox` | Requirement 8 (D5) | M |
| 10 | `feature/sso-login` | Requirement 1: SSO in dev and prod (D1, D7) | L |
| 11 | `chore/docs-acceptance-and-prod-release` | All, plus the first production deploy (D6, D8) | M |

Sizes, for one developer: S is up to a day, M is 1–3 days, L is 3–5 days.

### Decisions

#### D1 · How people log in [Decided 13 Oct]

- **Development:** a 7-digit employee ID (digits only) with a password, and SSO through a Keycloak container that stands in for the organization's identity provider, so both can be tested.
- **Production:** SSO only.

One setting, `AUTH_MODES`, switches each way on or off. Both ways end in the same session cookie, so nothing after login cares how the user got in.

#### D2 · One admin role [Decided 13 Oct]

The content-admin role (`isContentAdmin`) is dropped. Each user has one `role`: `ADMIN` or `USER`.

#### D3 · Databases and seeds [Decided 13 Oct]

- The dev database is reset and reseeded with `npm run docker:dev:reset`. That happens first in branch 1, again when branch 2 adds the folder migration, and whenever needed after that.
- **The seed splits in two.** `seed.dev.ts` is today's seed: it wipes and adds demo content. `seed.prod.ts` creates only what production needs and can safely run again. Today that is the 3 main categories the sidebar links to (חומרי הטמעה is the videos section, not a category). The first admins arrive in branch 3.
- Production connects to its own database (D6).

#### D4 · Deleting a folder [Decided 13 Oct]

1. The admin clicks delete on a folder.
2. A warning dialog lists everything that will be deleted with it: every sub-folder at every level, every video and every app, with counts at the top.
3. The admin clicks המשך למחיקה (continue to delete).
4. A second, smaller dialog opens on top of the warning and asks האם אתה בטוח? לא ניתן לבטל פעולה זו (are you sure? this can't be undone). ביטול (cancel) closes only the small dialog.
5. On כן, מחק (yes, delete), the server deletes the folder tree and its contents in one transaction, then removes the video and thumbnail files from disk.

Apps in those folders are deleted with them, because otherwise they'd be left with no folder and disappear from every screen. If you'd rather keep them, branch 5 can move them up to the parent folder instead.

#### D5 · What admins do with messages [Approved 13 Oct]

Branch 9 ships the inbox read-only, with "mark as read". Replies, assigning and closing are decided later. The existing `status` column stays in the database, unused by the screen for now.

#### D6 · The production database [Decided 14 Oct]

Production runs its own Postgres 16 container next to the portal (branch 1):

- volume `pgdata-prod`, reachable only inside Docker
- a nightly `pg_dump` into a `backups` volume, keeping 14 days

Built in branch 1. The backup was tested with a manual run and the 14-day clean-up. Branch 11 checks that a backup actually restores, and adds a backup of the uploads volume.

#### D7 · SSO [Decided 14 Oct · configured later]

SSO is configured after development is finished, in branch 10, with the organization's details from IT:

- the protocol
- the issuer
- the client ID and secret
- the employee ID claim

Until then, branch 3 leaves room for it:

- One function creates the session, and SSO will reuse it.
- Each login method is its own module.
- `passwordHash` is optional.
- The login page keeps a place for the SSO button.
- `.env.prod.example` lists the OIDC variables as placeholders.

#### D8 · HTTPS in production [Open · before branch 11]

Someone has to terminate HTTPS in front of the portal's nginx. **Recommended:** the organization's reverse proxy, if there is one. Otherwise nginx can hold the certificate itself. Nothing before branch 11 depends on this.

#### D9 · Tooling for the code standards [Decided 14 Oct · as recommended]

The two standards documents require tools that are not in the project yet. Each is a new dependency, so each needed an OK. Approved on 14 October, as recommended:

1. **Zod** for runtime validation of requests, API responses and environment variables (standard 8). Yes.
2. **Prettier** with `eslint-config-prettier` (standard 17.4). Yes. It reformats 48 of the 53 source files in one mechanical commit.
3. **ESLint with typescript-eslint in the frontend**, replacing oxlint, because standard 17.3 asks for type-aware ESLint. Yes, with `eslint-plugin-react-hooks` to keep the hook checks that oxlint gives today. Linting gets slower.
4. **`eslint-plugin-import-x`** for `import/no-cycle` (structure document 4.4). Yes.
5. **Backend imports stay relative**, with at most two `../`. Only the frontend gets the `@/` alias. The backend runs as compiled `node dist/server.js`, and `tsc` does not rewrite `@/` paths, so an alias there would break production (standard 9.9 warns about this).
6. **`no-confusing-void-expression` with `ignoreArrowShorthand`.** This deviates from the documents' config. It removes 126 of the 249 frontend findings, all of the form `onClick={() => setOpen(true)}`.
7. **Where the app shell goes.** The structure document has no place for Navbar and Sidebar, which know about the logged-in user. Recommended: `app/layout/`.
8. **Not in branch 12:** Vitest, a CI workflow and pre-commit hooks. The documents require them; branch 12 adds the scripts they will call.

The PDF of the standards stops after section 18. Sections 19 (review checklist) and 20, and appendices A and B, are listed in its table of contents but are missing. Until they arrive, the 8 rules in section 17.3 are the critical set.

### Code standards and project structure

Two documents set how code is written here: the **TypeScript Coding Standards** and the **Standard Project Structure**. Branch 12 applies them and adds the checks. They live in `docs/standards/` as Markdown, and `CLAUDE.md` at the repository root imports both, so every Claude Code session starts with the rules.

- They apply to new code and to code that is refactored. Generated code is excluded.
- Backend layers: controller, then service, then repository. Frontend layers: pages, then features, then shared. A feature is one folder.
- Every branch after 12 must pass `typecheck`, `lint` with 0 warnings, `format:check` and `build`.

|  | Backend | Frontend |
| --- | --- | --- |
| One folder per feature | `src/modules/<feature>/` | `src/features/<feature>/` |
| Shared code, no business knowledge | `src/shared/` | `src/shared/` |
| Startup and wiring | `src/config/`, `app.ts`, `routes.ts` | `src/app/` |
| Entry points | `server.ts` | `main.tsx`, thin `pages/` |
| Imports | relative, at most two `../` | `@/` alias for `src/` |

### How login and roles will work

1. The user opens the portal. Without a valid session cookie, they're sent to `/login`, and the page they asked for is remembered.
2. The login page asks `GET /api/auth/config` which ways are on. Until branch 10, development shows the password form. After it, development shows the form and a כניסה עם SSO button, and production shows only the button.
3. **Password (branch 3):** the מזהה ארגוני must be exactly 7 digits, which the form, the server and the database all check. The password is checked against a bcrypt hash.
4. **SSO (branch 10):**
   - The portal sends the user to the identity provider (Keycloak in development, the organization's in production) with the authorization-code flow and PKCE.
   - On return, it reads the employee ID claim and rejects anything that isn't 7 digits.
   - It finds the user, or creates them as `USER` on their first login.
5. Either way, the server sets the same `httpOnly`, `SameSite=Lax` cookie with a signed token (8 hours by default). JavaScript can't read it, and headers like `X-Employee-Id` are ignored.
6. `requireAdmin` lets a request through only when the user's `role` is `ADMIN`. In production, the first admins come from the prod seed (`PROD_ADMIN_EMPLOYEE_IDS`). Roles are kept in the portal's own database, not taken from the identity provider.

Dev test accounts, from `seed.dev.ts` and, from branch 10, the Keycloak realm:

- `1000001`: admin
- `1000002`: user
- `1000003`: exists only in Keycloak, to test a first SSO login

| Screen or action | Admin | User |
| --- | --- | --- |
| Home, categories, folders, apps, videos, tag search | Yes | Yes |
| Favorite an app or video, share a video | Yes | Yes |
| Bell with portal messages | Yes | Yes |
| פאנל ניהול tab and `/admin` | Yes | No: hidden, and the address redirects home |
| מצב עריכה and the add, edit and delete buttons | Yes | No |
| Add an app, upload a video, manage folders, post a message | Yes | No: the API answers 403 |
| Bottom-left button | Opens the inbox | Opens פנייה למנהל המערכת |

### Database and environment changes

Each schema change is its own Prisma migration, created in the branch that needs it.

| Branch | Database change |
| --- | --- |
| 1 | No schema change. The 3 existing migrations were compared with `schema.prisma` on an empty database: no difference. |
| 2 | Drop `SubCategory`. Add `CategoryFolder`; folders nest through `parentId`. Add `tags String[]` and `folderId` to `System` and `Video`. Add `videoId` to `UserVisit`, and make its `systemId` optional. The schema is already written; only the migration file is missing. |
| 12 | No schema change. |
| 3 | Add `role` to `User`: enum `ADMIN \| USER`, default `USER`. Add `passwordHash String?`, left empty for SSO users. Remove `isAdmin` and `isContentAdmin`. Add a database check that `employeeId` is exactly 7 digits. |
| 5 | The folder links on `System` and `Video` change to cascade, so deleting a folder can't leave orphans (D4). |
| 7 | New `Favorite` table: `userId` plus either `systemId` or `videoId`, unique per user and item, and deleted with the user or the item. |
| 9 | `ContactRequest` gets `readAt DateTime?` for the unread badge. |

| Branch | Environment variables | Dev | Prod |
| --- | --- | --- | --- |
| 1 | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `NODE_ENV`, `CORS_ORIGIN`, `LOG_LEVEL`. `DATABASE_URL` and `PORT` are in the files too, but inside Docker compose sets them, so the values are for tools you run yourself. | example values | set on the server; strong database password |
| 1 | `VITE_PROXY_TARGET`, `CHOKIDAR_USEPOLLING`: where Vite forwards `/api` and `/uploads`, and file watching by polling | yes | not used |
| 1 | `DEV_DB_PORT`, `DEV_BACKEND_PORT`, `DEV_FRONTEND_PORT` (dev) and `HTTP_PORT` (prod): ports on your machine, set only when the default is taken | optional | optional |
| 3 | `JWT_SECRET` (required, at least 32 characters), `SESSION_TTL_HOURS` (default 8) | example values | new secret on the server |
| 3 | `AUTH_MODES` | `password`; `password,sso` from branch 10 | `sso` |
| 3 | `SEED_DEV_PASSWORD`: the password of the dev test accounts | yes | not used |
| 3 | `PROD_ADMIN_EMPLOYEE_IDS`: comma-separated 7-digit IDs that the prod seed makes admins | not used | yes |
| 3 → 10 | `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI`, `OIDC_EMPLOYEE_ID_CLAIM`, `OIDC_POST_LOGOUT_REDIRECT_URI`. Placeholders in branch 3; used from branch 10. | local Keycloak | from IT (D7) |

### Working with the board

1. Create the labels and the four milestones once. Both are listed on the Branches page.
2. Create the epic issue, then the 12 issues, and link each issue to the epic.
3. Branch 2 already exists. For the others, create the branch from an up-to-date `main` when you start its issue.
4. Open a pull request into `main` with `Closes #<issue>` in the description.
5. Before merging, tick the issue's "Done when" list. Branches labelled `smoke pass` get a click-through in the dev containers as `1000001` and as `1000002`.

### After this plan

Out of scope here, but worth their own issues later:

- What admins can do with messages: reply, assign, close (D5).
- A CI workflow that builds both Docker images and runs lint and the tests on every pull request. There's no `.github/` folder yet.
- Taking admin roles from identity-provider groups instead of the portal's database.
- The dev seed inserts category ids by hand, so the first category an admin adds in a seeded dev database can collide with an existing id. The prod seed already fixes this for itself.
- A fresh clone run without Docker has no `backend/uploads` folder, so uploads fail there. Docker creates it.

## Branches & issues

One epic and 12 work branches. Each branch card has the branch name, what it does, and its issue: title, labels, milestone and a Markdown description. Every part has its own copy button.

### Set up the board

1. Create the labels below once, under Issues → Labels. The colors are suggestions.
2. Create the four milestones.
3. Give the board these columns: Backlog, Ready, In progress, In review, Done.
4. Create the epic issue first, then the 12 issues in order, and link each one to the epic.
5. Move an issue to In progress when you create its branch, and to In review when its pull request opens. It closes on merge if the pull request says `Closes #<issue>`.

### Labels

| Label | Color | Meaning |
| --- | --- | --- |
| epic | #3e4b9e | Groups the 12 issues |
| type: feature | #0e8a16 | Something admins or users can see or do |
| type: chore | #5319e7 | Setup, cleanup, checks, releases |
| type: docs | #0075ca | Documentation |
| area: devops | #c5def5 | Docker, compose files, environments, deployment |
| area: backend | #d4c5f9 | `backend/`: Express routes and middleware |
| area: frontend | #fef2c0 | `frontend/`: React pages and components |
| area: database | #bfd4f2 | Prisma schema, migrations or seeds |
| role: admin | #1d76db | Used by admins |
| role: user | #bfdadc | Used by regular users |
| security-sensitive | #b60205 | Login, permissions or production secrets: review line by line |
| needs: decision | #fbca04 | Waits for an open item: SSO details from IT (D7) or HTTPS (D8) |
| smoke pass | #f29513 | Click through in the dev containers as `1000001` and `1000002` before merging |

### Milestones

| Milestone | Branches | Finished when |
| --- | --- | --- |
| **M1 Foundation** | 1–4, 12 | Dev and prod run in Docker, folders and tags are merged, the code follows the standards with checks that enforce them, people log in with a password, and only admins can change content |
| **M2 Admin tools** | 5–6 | Admins add apps, upload videos, manage folders and post messages |
| **M3 Users & inbox** | 7–9 | Favorites and sharing work, users send messages, admins read them. Development is finished. |
| **M4 SSO & release** | 10–11 | SSO works with the organization's identity provider, every requirement passed the acceptance check, and production is live |

### Epic issue

#### Epic · `main`

_No branch of its own · every branch merges into main_

The epic tracks the 12 issues and maps each requirement to its branches.

**Issue title:** Finish the Pakmaz portal: Docker environments, login, admin tools, favorites and messages

**Labels:** `epic`

**Milestone:** none (spans M1–M4)

**Type:** epic. Link the 12 issues below to it.

##### Goal
Take the portal from today (`main` plus the unmerged folders-and-tags branch) to the 9 requirements, running in Docker with separate development and production environments.

##### Issues
- [x] Branch 1 · Set up Docker environments for development and production
- [ ] Branch 2 · Finish and merge nested folders, tags, analytics and edit mode
- [ ] Branch 12 · Apply the TypeScript coding standards and the standard project structure (runs after branch 2, before branch 3)
- [ ] Branch 3 · Add password login and user roles
- [ ] Branch 4 · Restrict the management panel and all content changes to admins
- [ ] Branch 5 · Complete the admin tools for apps, videos and folders
- [ ] Branch 6 · Let admins post, edit and delete portal messages
- [ ] Branch 7 · Save favorites per user and add sharing to every video
- [ ] Branch 8 · Let users send a message to the admin from the floating button
- [ ] Branch 9 · Show admins an inbox of user messages
- [ ] Branch 10 · Add SSO login, with Keycloak in development
- [ ] Branch 11 · Update the docs, run the acceptance check and release to production

##### Requirements and branches
1. Login for admins and regular users → branches 3 (password, dev only), 10 (SSO)
2. Only admins see the management panel tab → branch 4
3. Only admins add an app (הוספת מערכת) → branches 4, 5
4. Only admins post a portal message → branches 4, 6
5. Only admins upload a video → branches 4, 5
6. Only admins add, edit and delete folders → branches 2, 4, 5
7. Favorite on every app, share on every video → branch 7
8. Admin's bottom-left button opens an inbox of user messages → branch 9
9. User's bottom-left button sends a message to the admin (פנייה למנהל המערכת) → branch 8

##### Decisions
- D1 Dev: 7-digit employee ID + password, and SSO. Prod: SSO only.
- D2 One admin role; the content-admin role is dropped.
- D3 Dev database reset and reseeded; a separate prod seed and prod database connection.
- D4 Deleting a folder lists everything it takes with it, then asks a second time.
- D5 The inbox starts read-only.
- D6 Production runs its own Postgres container, with a nightly backup.
- D7 SSO: room is left for it in branch 3; it's configured in branch 10, after development is finished.
- D8 (open) Who handles HTTPS in production. Needed before branch 11.
- D9 Tooling for the code standards: approved 14 October, as recommended.

##### Done when
- [ ] All 12 issues are closed
- [ ] The acceptance check in branch 11 passes in development and production

### The 12 work branches

Each branch is cut from `main` and merges back into `main`. Branch 2 already exists on GitHub.

#### Branch 1 · `chore/docker-dev-and-prod-environments`

_M1 Foundation · Size M · Done · ready for PR_

The whole portal runs in Docker: one compose file for development, with hot reload and a disposable database, and one for production, with built images, nginx and its own database connection. The seed splits into a dev seed and a prod seed.

Decisions: D3, D6 · Depends on: nothing

**Status, 14 October:** finished in 9 commits and tested in the dev and prod containers. Every "Done when" item passed. The issue below is the final version, including what changed along the way.

**Issue title:** Set up Docker environments for development and production

**Labels:** `type: chore`, `area: devops`, `area: database`, `security-sensitive`

**Milestone:** M1 Foundation

**Branch:** `chore/docker-dev-and-prod-environments`
**Decisions:** D3 (reset and reseed dev; separate prod seed and prod database connection), D6 (production runs its own Postgres container)
**Depends on:** nothing
**Status:** done, 14 October

##### Goal
Anyone can start the portal with one command in development, and production runs from built images with its own database and settings.

##### Today (before this branch)
- No Docker files. Development ran on the host with `npm run dev` against a Postgres you install yourself.
- One seed (`prisma/seed.ts`) that deletes everything before inserting demo data. It must never reach production.
- One uncommitted `backend/.env.example`.

##### Tasks
###### Images
- [x] `backend/Dockerfile`, multi-stage: `dev` (`tsx watch`), `build` (`prisma generate` + `tsc`), `prod` (`node dist/server.js`, production dependencies only, non-root user). The one-off `migrate` service uses the `build` stage, because the `prod` image has no `prisma` or `tsx`.
- [x] `frontend/Dockerfile`: `dev` (Vite on `0.0.0.0:5173`) and `prod` (`vite build`, served by nginx)
- [x] `frontend/nginx.conf`: SPA fallback; `/api` and `/uploads` forwarded to `backend:4000`; `client_max_body_size 2g` with request buffering off; gzip; hashed assets cached for a year
- [x] `backend/Dockerfile.dockerignore` and `frontend/Dockerfile.dockerignore`. Both images build from the repository root so they share the root `package-lock.json`, which is why the ignore files carry the Dockerfile's name. Every `.env*` file is excluded.
- [x] Node 24.21.0 (bookworm-slim), nginx 1.30.5-alpine and Postgres 16.15, pinned to exact tags

###### Lockfile (found during the work)
- [x] The root `package-lock.json` listed only Windows native packages (rolldown, oxlint), so the frontend could not build in any Linux container. It was regenerated; `package.json` is unchanged and 32 packages moved within their semver ranges. Run `npm ci` after pulling.
- [ ] Follow-up (branch 11): `backend/package-lock.json` and `frontend/package-lock.json` are stale and unused

###### Development: `docker-compose.dev.yml`
- [x] `db`: Postgres 16 with a health check and volume `pgdata-dev`
- [x] `backend`: source mounted, its own `node_modules` volumes, starts after `db` is healthy, runs `prisma generate` on start
- [x] `frontend`: source mounted; Vite's proxy target comes from `VITE_PROXY_TARGET`, and Vite now proxies `/uploads` as well as `/api`
- [x] File watching by polling (`CHOKIDAR_USEPOLLING`), checked for both services
- [x] Volume `uploads-dev`
- [x] Host ports can be changed with `DEV_DB_PORT`, `DEV_BACKEND_PORT` and `DEV_FRONTEND_PORT`. Inside Docker, compose fixes `PORT` and `VITE_PROXY_TARGET` and builds `DATABASE_URL` from `POSTGRES_*`.

###### Production: `docker-compose.prod.yml`
- [x] `frontend` (nginx) is the only published service, on port 80 (`HTTP_PORT` changes it)
- [x] `backend` with volume `uploads-prod`, restart policy and a health check on `/health`
- [x] `migrate`: a one-off service (`docker:prod:migrate`, and `docker:prod:seed` for `seed:prod`)
- [x] `db`: the portal's own Postgres 16 container (D6), volume `pgdata-prod`, not published
- [x] `backup`: a nightly `pg_dump` at 02:00 UTC into a `backups` volume, keeping 14 days. Checked with a manual run and the clean-up. Backing up the uploads volume is in branch 11.

###### Seeds (D3)
- [x] `prisma/seed.ts` renamed to `prisma/seed.dev.ts`. It refuses to run when `NODE_ENV=production`.
- [x] New `prisma/seed.prod.ts`: creates the 3 main categories the sidebar links to (`/category/1` to `/3`, the same ids as the dev seed) only when they are missing; never updates or deletes; moves the id sequence past the seeded ids. חומרי הטמעה is the videos section, not a category.
- [x] Scripts `seed:dev` and `seed:prod` in `backend/package.json`

###### Environment files and scripts
- [x] `.env.dev.example` and `.env.prod.example` at the root. `backend/.env.example` stays, marked as the example for running without Docker.
- [x] `.gitignore`: ignore every `.env*` file except `!.env*.example`
- [x] Root scripts: `docker:dev`, `docker:dev:down`, `docker:dev:reset` (drops `pgdata-dev` and `uploads-dev`, starts, migrates, `seed:dev`), `docker:prod:up`, `docker:prod:migrate`, `docker:prod:seed`. They read `.env.dev` and `.env.prod`.
- [x] A short "Run with Docker" section in the README (the full rewrite is in branch 11)
- [x] Fixed the existing backend lint error in `app.ts`

##### Done when
- [x] From a fresh clone: copy `.env.dev.example` to `.env.dev`, run `npm run docker:dev:reset`, and the portal opens with the seed data (tested on port 5175 because 5173 was taken)
- [x] Editing a frontend or backend file reloads it inside the containers
- [x] The prod compose builds and runs locally with `docker:prod:migrate` and `docker:prod:seed`, and the portal opens (on port 8080 because 80 was taken)
- [x] Running `seed:prod` twice changes nothing the second time
- [x] `seed:dev` with `NODE_ENV=production` stops with an error and touches nothing
- [x] `git status` shows no `.env.dev` or `.env.prod`

#### Branch 2 · `feature/nested-categories-and-tags`

_M1 Foundation · Size M · Exists · e2f2cf6_

The screens in your screenshots: nested folders, tags and tag search, the analytics tab, edit mode and the new admin panel. One commit, already on GitHub. It needs a rebase onto branch 1, a migration and some cleanup before it merges.

Requirement: 6 (and the base for 3 and 5) · Depends on: branch 1 · Decision: D3

**Issue title:** Finish and merge nested folders, tags, analytics and edit mode

**Labels:** `type: feature`, `area: backend`, `area: frontend`, `area: database`, `smoke pass`

**Milestone:** M1 Foundation

**Branch:** `feature/nested-categories-and-tags` (already exists, commit `e2f2cf6`)
**Requirement:** 6, and the base for 3 and 5
**Depends on:** branch 1
**Decision:** D3 (the dev database is reset and reseeded)

##### Goal
Merge the work already on this branch: nested folders (`CategoryFolder`), tags on apps and videos, tag search, the analytics tab (מדדים ואנליטיקה), edit mode (מצב עריכה) and the reorganized admin panel (סייר ניהול ותיקיות).

##### Today
- The schema changes have no migration file, so `prisma migrate` on a fresh database still builds the old tables.
- `/api/sub-categories` still exists next to `/api/folders`, and nothing in the frontend calls it.
- `dev-server.err`, a log file, is tracked in git.

##### Tasks
- [ ] Rebase onto `main` after branch 1. Branch 1 renamed `seed.ts` to `seed.dev.ts`, so move this branch's seed changes into `seed.dev.ts`.
- [ ] Create the migration inside the dev containers: `docker compose --env-file .env.dev -f docker-compose.dev.yml exec backend npx prisma migrate dev --name nested_folders_and_tags` (`docker:dev:reset` itself uses `migrate deploy`)
- [ ] Branch 1 regenerated the root `package-lock.json` with Linux packages. Keep main's lockfile when rebasing. If this branch adds dependencies, run `npm install`, then check that the lockfile still lists `@rolldown/binding-linux-x64-gnu` before committing.
- [ ] `npm run docker:dev:reset`, then check the seed builds the folder tree and tags from the screenshots
- [ ] `seed.prod.ts` still runs against the new schema (main categories only; admins build the folders)
- [ ] Remove `backend/src/routes/subCategories.routes.ts`, its mount in `app.ts`, and `api.subCategories` in `frontend/src/lib/api.ts`
- [ ] Remove `dev-server.err` from git and add `*.err` to `.gitignore`
- [ ] `npm run build` and `npm run lint` pass in `backend/` and `frontend/`

##### Done when
- [ ] `npm run docker:dev:reset` reaches the new schema with seed data
- [ ] The prod `migrate` service applies the new migration to an empty prod database
- [ ] Smoke pass: home, each category, nested folders, tag search, playing a video, the three admin tabs
- [ ] Build and lint pass

##### Out of scope
- Who can see or use the admin screens: branch 4
- The folder delete flow (D4): branch 5
- Moving files into the standard folder structure and formatting them: branch 12

#### Branch 12 · `chore/code-standards-and-project-structure`

_M1 Foundation · Size L · runs after 2, before 3_

Applies the two standards documents to the whole code base. It sets up one TypeScript configuration, type-aware ESLint and Prettier, moves every file into one folder per feature (`modules/` on the backend, `features/` on the frontend), splits the backend into controller, service and repository, and validates data at the boundaries with Zod. It runs after branch 2 and before branch 3, so every later branch is written in the new structure. If you want smaller pull requests, split it after the "Lint and format" tasks.

Requirement: none, it sets how every later branch is written · Depends on: branch 2 · Decision: D9 (approved)

**Issue title:** Apply the TypeScript coding standards and the standard project structure

**Labels:** `type: chore`, `area: backend`, `area: frontend`, `area: devops`, `smoke pass`

**Milestone:** M1 Foundation

**Branch:** `chore/code-standards-and-project-structure`
**Requirement:** none. It sets how every later branch is written.
**Depends on:** branch 2 (merged). Branch 3 and everything after it depend on this branch.
**Decision:** D9 (tooling choices), approved as recommended

##### Goal
`backend/` and `frontend/` follow the two standards documents (TypeScript Coding Standards and Standard Project Structure), and checks fail when new code doesn't. From branch 3 on, every file is written in the new structure.

##### Today (measured on `main`, 14 October)
- Compiler: the backend has `strict`. The frontend `tsconfig.app.json` has no `strict`, though the code already compiles with it. Neither package has `noUncheckedIndexedAccess` or `exactOptionalPropertyTypes`; with them on, the backend reports 10 errors and the frontend 12 (4 and 8).
- Lint and format: the backend uses ESLint `recommended`; the frontend uses oxlint with two rules. There is no Prettier, no `typecheck` or `format` script, no tests and no CI. TypeScript is not pinned (`^6.0.3` and `~6.0.2`).
- The standard's rule set (`strictTypeChecked` plus the 8 rules in section 17.3) finds 58 problems in 14 of 21 backend files (25 are `process.env["X"]` instead of dot notation) and 249 in 18 of 20 frontend files (126 `no-confusing-void-expression`, 42 exported functions without a return type, 34 non-string values in template literals).
- Style differs by package: the backend uses double quotes, the frontend single quotes. Prettier with the standard settings would change 48 of 53 source files.
- Code: 38 `as` type assertions, 13 `req.body as ...` casts with no runtime validation, 6 `process.env` reads outside `config/env.ts`, 8 `.then()` chains, 28 `interface` declarations used for plain data, 7 `alert()` or `confirm()` calls.
- The backend is flat by technical type (`routes/`, `middleware/`, `lib/`). Route handlers call Prisma directly (3 to 9 calls per file): there is no service or repository layer and no DTO or mapper.
- The frontend is flat too (`components/`, `pages/`, `hooks/`, `store/`, `lib/`, `types/`). One `lib/api.ts` serves every feature. `AdminPage.tsx` is 1342 lines (612 after branch 2), `HomePage.tsx` 494 and `VideoModal.tsx` 318. `getSystemFallbackIcon` exists twice.
- The PDFs: section 2.3 of the structure document maps a different project (users, addresses, books, loans), so the real mapping is below. Sections 19 and 20 and the appendices listed in the standards' table of contents are not in the PDF.

##### How the standards apply
- To new code, and to code that is refactored, within the change (standard 1.3). Generated code (`src/generated/`) is excluded.
- This branch moves every file into the new tree, formats it, and fixes what the checks report. It does not rewrite logic and does not change any API response.
- Recommended rules (for example arrow functions instead of `function` declarations) apply to new code and are not mass-converted.

##### Tasks
###### Documents
- [x] `CLAUDE.md` at the repository root and the two Markdown rule files in `docs/standards/` are already written, so every session follows the standards. Commit them first.
- [ ] Add the two original PDFs next to them and link `docs/standards/` from the README
- [ ] README: one paragraph on what applies and on the commands `typecheck`, `lint` and `format:check`

###### TypeScript configuration (standard section 4)
- [ ] `tsconfig.base.json` at the root with `strict`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `forceConsistentCasingInFileNames`, `isolatedModules` and `verbatimModuleSyntax`. Each package extends it and adds only module, lib and jsx.
- [ ] Fix what the new flags report: backend 10, frontend 12
- [ ] Pin TypeScript to one exact version in both packages (standard 18.2)
- [ ] Scripts in both packages and at the root: `typecheck` (`tsc --noEmit`), `format`, `format:check`
- [ ] After any `package.json` change, check that `package-lock.json` still lists the Linux native packages (`@rolldown/binding-linux-x64-gnu`); npm on Windows can drop them

###### Lint and format (standard sections 10.4 and 17)
- [ ] ESLint with `typescript-eslint` `strictTypeChecked` and `stylisticTypeChecked` plus the 8 rules from section 17.3, all set to `error`, run with `--max-warnings=0`, in both packages (D9 decides the frontend linter)
- [ ] `ban-ts-comment`: `@ts-ignore` is not allowed, `@ts-expect-error` needs a reason, and there is no blanket `eslint-disable`
- [ ] Fix the findings: backend 58 and frontend 249 (126 of those go away with the `ignoreArrowShorthand` option in D9)
- [ ] Boundary rules from structure document 4.4: `no-restricted-imports` (other features' internals, `../../..`) and `import/no-cycle`, both `error`
- [ ] One `.prettierrc` at the root with the standard settings, and `eslint-config-prettier`
- [ ] One mechanical commit, "style: format with Prettier", with nothing else in it. Add its hash to `.git-blame-ignore-revs`.

###### Backend structure (structure document section 2)
| Today | Target |
| --- | --- |
| `src/server.ts`, `src/app.ts` | stay; a new `src/routes.ts` mounts the module routers |
| `config/env.ts` | validates every variable with Zod and stops the server on startup if one is wrong (standard 8.5). It is the only place that reads `process.env`; `prisma.config.ts` and the seed scripts are exempt. |
| `lib/logger.ts`, `lib/prisma.ts` | `shared/logger/logger.ts`, `shared/db/prisma.ts` |
| `lib/upload.ts` | `modules/uploads/` |
| `middleware/auth.ts`, `middleware/errorHandler.ts` | `shared/middlewares/authenticate.middleware.ts`, `authorize.middleware.ts`, `error.middleware.ts` |
| new | `shared/errors/` (`AppError`, `NotFoundError`, `ValidationError`, ...) and a central error handler: an `AppError` becomes its own status, anything else becomes 500 with a generic message |
| `routes/*.routes.ts` | one folder per feature in `modules/`: `health`, `users`, `main-categories`, `systems`, `videos`, `uploads`, `visits`, `contact`, `notifications`, and `folders`, `analytics`, `search` from branch 2. Each has `*.route.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.schema.ts` (Zod), `*.dto.ts`, `*.mapper.ts` and `index.ts`. |
| `types/express.d.ts` | `shared/types/express.d.ts` |
- [ ] Move first, one commit per module, with no logic change; then split each module into controller, service and repository
- [ ] Controllers validate the request with Zod and answer. Services hold the logic and never see `Request` or `Response`. Repositories are the only code that calls Prisma. Routes never return a database row: a mapper builds the response (standard 8.6).
- [ ] Replace the 13 `req.body as ...` casts with Zod schemas
- [ ] Imports inside the backend stay relative, with at most two `../` (no alias; see D9)
- [ ] Keep every URL, status code and JSON shape as it is today

###### Frontend structure (structure document section 3)
| Today | Target |
| --- | --- |
| `main.tsx`, `App.tsx` | stay thin; new `app/router.tsx`, `app/providers.tsx`, `app/error-boundary.tsx` |
| `pages/HomePage.tsx`, `CategoryPage`, `ContentPage`, `AdminPage` | `pages/home.page.tsx`, `category.page.tsx`, `content.page.tsx`, `admin.page.tsx`: thin, they only compose features |
| `components/Navbar`, `Sidebar`, `PageLoader`, `NeuralNetworkBackground` | `app/layout/` for the shell (Navbar, Sidebar) and `shared/ui/` for pieces with no business knowledge (D9 confirms the layout folder) |
| `components/ThemeToggle`, `store/useThemeStore` | `features/theme/` |
| `components/ContactForm` | `features/contact/` |
| `components/NotificationsDropdown` | `features/notifications/` |
| `components/VideoModal` | `features/videos/` |
| `components/admin/*`, `useEditModeStore`, `FolderTreeSelect`, `TagSearchModal` (from branch 2) | `features/admin/`, `features/folders/`, `features/search/`; `TagInput` goes to `shared/ui/` |
| `store/useAuthStore`, `store/useFavoritesStore` | `features/auth/auth.store.ts`, `features/favorites/favorites.store.ts` |
| `lib/api.ts` | `shared/lib/http-client.ts` (fetch, errors, `AbortSignal`) plus `features/*/api/*.api.ts` |
| `types/index.ts` | `*.types.ts` per feature, derived from Zod schemas |
| `hooks/useSmartLoader.ts` | `shared/hooks/use-smart-loader.ts` |
- [ ] Every API response is validated with a Zod schema before it is used (standard 8.1). One `getSystemFallbackIcon`, in `features/systems/`.
- [ ] The alias `@/` for `src/`, set in `tsconfig.app.json` and `vite.config.ts`
- [ ] File names: kebab-case for hooks (`use-*.ts`), pages (`*.page.tsx`) and stores (`*.store.ts`); PascalCase for components. CSS modules move with their component.
- [ ] Types for plain data use `type`, not `interface` (standard 3.2)
- [ ] No visual change: dark and light themes, the RTL layout and the Hebrew text stay as they are

###### Rules for every later branch (checked by lint)
- [ ] Named exports (default exports only where a framework needs one); `unknown` instead of `any`; no `!`; no `as` on external data; explicit return types on exported functions; at most 3 parameters; no `console` in server code
- [ ] Add to the "Done when" of every later branch: `typecheck`, `lint` (0 warnings), `format:check` and `build` pass
- [ ] When branch 12 changes a rule (a path, a tool, an exception), update `CLAUDE.md` and `docs/standards/` in the same pull request

##### Done when
- [ ] `npm run typecheck`, `npm run lint` (0 warnings), `npm run format:check` and `npm run build` pass in `backend/` and `frontend/` from a clean `npm ci`
- [ ] `npm run docker:dev:reset` works, and the prod images build and start (`node dist/server.js` resolves every import)
- [ ] Every endpoint answers with the same status and JSON as before the branch (compare the responses before and after)
- [ ] Smoke pass: home, each category, nested folders, tag search, playing a video, the three admin tabs, uploading a video, sending a contact message
- [ ] No page imports another feature's internals, and there are no import cycles
- [ ] The formatting commit is listed in `.git-blame-ignore-revs`
- [ ] `package-lock.json` still lists the Linux native packages

##### Out of scope
- Login, roles and permissions: branches 3 and 4
- The error body shape (`{ error }` or `{ message }`): branch 6
- Tests, a CI workflow and pre-commit hooks. The standard asks for them; the scripts added here are what they will call. Track them as follow-ups.
- Recommended but optional rules: the `Result` type, an injectable clock, branded ids, and converting `function` declarations to arrows
- Splitting `AdminPage.tsx`, `HomePage.tsx` and `VideoModal.tsx` further than the move requires

#### Branch 3 · `feature/login-and-user-roles`

_M1 Foundation · Size L_

Login with a 7-digit employee ID and a password, a session cookie, and one role (`ADMIN` or `USER`) on each user. `AUTH_MODES` controls which login methods are on, so production can switch password login off. The code leaves room for SSO, which comes in branch 10. After this branch, nobody becomes admin by sending a header.

Requirement: 1 (password half) · Depends on: branches 2 and 12 · Decisions: D1, D2, D7

**Issue title:** Add password login and user roles

**Labels:** `type: feature`, `area: backend`, `area: frontend`, `area: database`, `security-sensitive`

**Milestone:** M1 Foundation

**Branch:** `feature/login-and-user-roles`
**Requirement:** 1 (the password half; SSO is branch 10)
**Depends on:** branches 2 and 12
**Decisions:** D1 (dev: password and SSO; prod: SSO only), D2 (one admin role), D7 (leave room for SSO now)

##### Goal
In development, admins and users log in with their מזהה ארגוני (exactly 7 digits) and a password. The server knows who is calling from a session cookie, not from a header the browser can set. Production can switch password login off.

##### Today
- `requireAuth` trusts the `X-Employee-Id` header and creates a user for any new ID.
- `App.tsx` writes `admin001` into `sessionStorage`, so every visitor is the admin.
- `User` has two flags, `isAdmin` and `isContentAdmin`.

##### Tasks
###### Database
- [ ] `User.role`: enum `ADMIN | USER`, default `USER`
- [ ] `User.passwordHash String?` (empty for users who only use SSO)
- [ ] Drop `isAdmin` and `isContentAdmin`
- [ ] A check constraint in the migration's SQL: `employeeId` matches `^[0-9]{7}$`
- [ ] Dev seed: `1000001` (ADMIN) and `1000002` (USER), password from `SEED_DEV_PASSWORD`; then `npm run docker:dev:reset`
- [ ] Prod seed: upsert every ID in `PROD_ADMIN_EMPLOYEE_IDS` as ADMIN, with no password

###### Backend
- [ ] Write the new code in the structure and to the standards from branch 12: module folders, the Zod-validated `config/env.ts`, the standard error classes
- [ ] Add `bcryptjs`, `jsonwebtoken`, `cookie-parser` and `express-rate-limit`
- [ ] `AUTH_MODES` in `config/env.ts`: a list that accepts `password` and `sso`. Dev is `password` until branch 10 adds SSO.
- [ ] `GET /api/auth/config` returns the modes that are on
- [ ] `POST /api/auth/login` `{ employeeId, password }`: answers 404 when `password` mode is off; checks 7 digits and the hash; sets an `httpOnly`, `SameSite=Lax` cookie with a signed JWT (`secure` in production)
- [ ] `POST /api/auth/logout` clears the cookie
- [ ] `GET /api/auth/me` returns the user without `passwordHash` (replaces `GET /api/users/me`)
- [ ] `requireAuth` and `optionalAuth` read the cookie. Remove the header login and the automatic user creation.
- [ ] `requireAdmin` checks `role === 'ADMIN'`
- [ ] Limit login to 10 attempts per minute per IP. Set `app.set('trust proxy', 1)` so the limit sees the real client address behind nginx, and check it with a request through nginx in the prod compose.
- [ ] `JWT_SECRET` (required, at least 32 characters; the server won't start without it) and `SESSION_TTL_HOURS` (default 8)
- [ ] `PATCH /api/users/:id/roles` takes `{ role }`
- [ ] New variables in `.env.dev.example` and `.env.prod.example`

###### Room for SSO (D7: configured after development is finished)
- [ ] One function creates the session cookie for a user; password login uses it now and SSO will reuse it
- [ ] Each login method is its own file in `src/modules/auth/` (`password.method.ts` now, `sso.method.ts` in branch 10)
- [ ] `passwordHash` stays optional, so SSO-only users need no later migration
- [ ] The login page keeps a place for the SSO button, shown only when `GET /api/auth/config` includes `sso`
- [ ] `.env.prod.example` lists the OIDC variables as commented placeholders

###### Frontend
- [ ] `/login` page in the portal's style (RTL, dark and light): מזהה ארגוני (7 digits, numeric keyboard), password, error message. It shows only the methods `GET /api/auth/config` returns; the SSO button arrives in branch 10.
- [ ] No session → redirect to `/login`, then back to the page that was asked for
- [ ] Remove the `sessionStorage` identity in `App.tsx` and the identity headers in `lib/api.ts`; send `credentials: 'include'`
- [ ] Any 401 clears the user and goes to `/login`
- [ ] Logout in the user menu (שלום, …)
- [ ] The `User` type gets `role: 'ADMIN' | 'USER'`; every `isAdmin` / `isContentAdmin` check uses one `isAdmin(user)` helper

##### Done when
- [ ] `1000001` and `1000002` can each log in and out in the dev containers
- [ ] A wrong password, or an ID that isn't 7 digits, shows an error and sets no cookie
- [ ] A request with `X-Employee-Id: 1000001` and no cookie gets 401
- [ ] With `AUTH_MODES=sso`, `POST /api/auth/login` answers 404
- [ ] The server refuses to start without `JWT_SECRET`
- [ ] Build and lint pass

##### Out of scope
- SSO: branch 10
- Hiding admin screens from users: branch 4

#### Branch 4 · `feature/admin-only-access-control`

_M1 Foundation · Size M_

Every change to content goes through one admin check on the server. The management panel and edit controls disappear for users, and a test proves each rule.

Requirements: 2, and the "only admins" part of 3–6 · Depends on: branch 3

**Issue title:** Restrict the management panel and all content changes to admins

**Labels:** `type: feature`, `area: backend`, `area: frontend`, `role: admin`, `security-sensitive`, `smoke pass`

**Milestone:** M1 Foundation

**Branch:** `feature/admin-only-access-control`
**Requirements:** 2, and the "only admins" part of 3, 4, 5 and 6
**Depends on:** branch 3

##### Goal
Only admins see the management panel and change content. The server enforces this; the screen only stops offering what a user can't do.

##### Today
- `/admin` has no route guard. A user who types the address sees the explorer with its add and delete buttons.
- Videos and uploads use `requireContentOrAdmin`, so the content-admin role can upload.
- The מצב עריכה button shows for content admins too.

##### Tasks
###### Backend
- [ ] `requireAuth, requireAdmin` on every write route: systems, folders, main-categories, videos, uploads, notifications, analytics, users, and contact (GET and PUT)
- [ ] Delete `requireContentAdmin` and `requireContentOrAdmin`
- [ ] Add Vitest and Supertest. One test file calls every write route as nobody (401), as a user (403) and as an admin (2xx). It runs inside the dev backend container against a test database.

###### Frontend
- [ ] A `<RequireAdmin>` wrapper around the `/admin` route sends users to `/`
- [ ] Show only to admins: פאנל ניהול in the sidebar and the mobile menu, the admin link in the user menu, the מצב עריכה button, and the add, edit and delete buttons on category, folder and content pages
- [ ] Switch edit mode off on logout
- [ ] A 403 from the API shows "אין הרשאה" instead of failing silently

##### Done when
- [ ] As `1000002`: no panel tab, no edit button, `/admin` redirects home, and every write call returns 403
- [ ] As `1000001`: everything works as before
- [ ] The authorization test passes
- [ ] Build and lint pass

#### Branch 5 · `feature/admin-content-management`

_M2 Admin tools · Size L_

Finishes the three admin tools from the screenshots: הוספת מערכת, video upload and the folder tree. Adds validation, the two-step folder delete from D4, and in-page messages in place of browser alerts.

Requirements: 3, 5, 6 · Depends on: branch 4 · Decision: D4

**Issue title:** Complete the admin tools for apps, videos and folders

**Labels:** `type: feature`, `area: backend`, `area: frontend`, `area: database`, `role: admin`, `smoke pass`

**Milestone:** M2 Admin tools

**Branch:** `feature/admin-content-management`
**Requirements:** 3, 5, 6
**Depends on:** branch 4
**Decision:** D4 (deleting a folder: list everything, then confirm twice)

##### Goal
An admin adds an app, uploads a video and manages the folder tree, from the panel or in edit mode. Deleting a folder shows exactly what goes with it and asks twice.

##### Today
- The הוספת מערכת modal has name, description, URL, tags, image, folder and sort order. The server only checks that name and URL aren't empty.
- If a video uploads but saving its details fails, the file stays on disk.
- Deleting a folder deletes its sub-folders, and their apps and videos drop out of every screen without warning.
- About 20 `alert()` calls in the admin modals and pages.

##### Tasks
###### Add an app (הוספת מערכת)
- [ ] Validate the URL on both sides: `http://` or `https://` only
- [ ] A new app always lands in a folder (the picker already defaults to the current one)
- [ ] Image: upload or paste a URL, with a preview

###### Upload a video (העלה סרטון)
- [ ] Choose folder, title, description, tags and thumbnail
- [ ] Read the duration from the file in the browser
- [ ] If saving fails after the upload, delete the file (`DELETE /api/uploads/video/:fileName`)
- [ ] Show the 2 GB limit and the allowed formats before the upload starts

###### Delete a folder (D4)
- [ ] `GET /api/folders/:id/delete-preview` (admin only) returns every sub-folder at every level (with its path), every video and every app that would be deleted
- [ ] Warning dialog: counts at the top, then the lists of sub-folders, videos and apps; buttons המשך למחיקה and ביטול
- [ ] המשך למחיקה opens a second, smaller dialog on top: "האם אתה בטוח? לא ניתן לבטל פעולה זו", with כן, מחק and ביטול. ביטול and Esc close only the small dialog.
- [ ] `DELETE /api/folders/:id` deletes the folder tree, its videos and its apps in one transaction, then removes the video and thumbnail files from disk; it returns what was deleted
- [ ] Schema: the folder links on `System` and `Video` change to cascade (migration)
- [ ] A toast afterwards: "נמחקו X תיקיות, Y סרטונים ו-Z מערכות"

###### Other folder actions (עץ קטגוריות ותיקיות)
- [ ] Add a root folder or a sub-folder, rename, reorder
- [ ] Deleting a single app or video asks once, in the page

###### Everywhere
- [ ] Replace `alert()` with a toast component and a confirmation dialog

##### Done when
- [ ] An admin adds an app with tags into a nested folder, and it shows there and in tag search
- [ ] An admin uploads a video into a folder, and it plays
- [ ] Deleting a folder with sub-folders and videos lists them all, asks twice, deletes them, and their files are gone from the `uploads` volume
- [ ] Cancelling at either step deletes nothing
- [ ] No `alert()` is left in `frontend/src`
- [ ] Build, lint and tests pass

#### Branch 6 · `feature/admin-portal-messages`

_M2 Admin tools · Size S_

Admins post, edit and delete the messages everyone sees under the bell.

Requirement: 4 · Depends on: branch 4

**Issue title:** Let admins post, edit and delete portal messages

**Labels:** `type: feature`, `area: backend`, `area: frontend`, `role: admin`

**Milestone:** M2 Admin tools

**Branch:** `feature/admin-portal-messages`
**Requirement:** 4
**Depends on:** branch 4

##### Goal
Admins publish messages to the whole portal from הודעות מערכת, and everyone sees them under the bell.

##### Today
- Create (`POST /api/notifications`) and delete work, admin only.
- A message can't be edited.
- This route answers errors as `{ error }`; every other route answers `{ message }`.
- Read and unread state lives in each browser's `localStorage`.

##### Tasks
- [ ] `PUT /api/notifications/:id` (admin only), and an edit button in the הודעות מערכת table
- [ ] Limits: title up to 120 characters, message up to 2,000, both required
- [ ] Error responses use `{ message }`
- [ ] The bell refreshes when it opens, so new messages show without a page reload
- [ ] A toast after publishing, a confirmation before deleting

##### Done when
- [ ] An admin posts, edits and deletes a message, and `1000002` sees each change under the bell
- [ ] A user calling the write routes gets 403
- [ ] Build, lint and tests pass

##### Out of scope
- Read state per user on the server. It stays in `localStorage` unless we decide otherwise.

#### Branch 7 · `feature/server-favorites-and-video-share`

_M3 Users & inbox · Size M_

Favorites move from the browser to the database, so they follow the user to any computer. Every video card and the player get a share button that copies a link to that video.

Requirement: 7 · Depends on: branch 4

**Issue title:** Save favorites per user and add sharing to every video

**Labels:** `type: feature`, `area: backend`, `area: frontend`, `area: database`, `role: user`, `smoke pass`

**Milestone:** M3 Users & inbox

**Branch:** `feature/server-favorites-and-video-share`
**Requirement:** 7
**Depends on:** branch 4

##### Goal
Every app has a star. Every video has a star and a share button. Favorites are stored per user on the server and show under מועדפים on the home page.

##### Today
- `useFavoritesStore` keeps favorites in `localStorage` (`portal-favorites-<id>` and `portal-video-favorites-<id>`), so they're lost on another computer or browser.
- Video cards copy `/content?video=<id>`, and the content page opens that video. The player's share button uses `alert('הקישור הועתק ללוח')`.

##### Tasks
###### Database and backend
- [ ] `Favorite` table: `userId`, `systemId?`, `videoId?`, `createdAt`; unique per user and item; deleted along with the user or the item
- [ ] `GET /api/favorites` returns `{ systems, videos }`
- [ ] `PUT` and `DELETE` on `/api/favorites/systems/:id` and `/api/favorites/videos/:id`

###### Frontend
- [ ] The store loads favorites after login and toggles optimistically, rolling back if the call fails
- [ ] One-time import: send the existing `localStorage` favorites to the server, then delete the keys
- [ ] A star on every app card: category and folder pages, home favorites, recently visited, tag search
- [ ] A star and a share button on every video card and in the player
- [ ] Share uses `navigator.share` where the browser has it; otherwise it copies the link and shows a toast
- [ ] A shared link opened without a session goes through `/login` (password or SSO) and then opens the video

##### Done when
- [ ] Favorites set in one browser show in another after logging in as the same user
- [ ] Each user's favorites are separate
- [ ] A copied video link opens the same video for another user
- [ ] Build, lint and tests pass

#### Branch 8 · `feature/user-contact-form`

_M3 Users & inbox · Size S_

For regular users, the bottom-left button opens פנייה למנהל המערכת. The sender comes from the session, not from a field anyone can edit.

Requirement: 9 · Depends on: branch 4

**Issue title:** Let users send a message to the admin from the floating button

**Labels:** `type: feature`, `area: backend`, `area: frontend`, `role: user`

**Milestone:** M3 Users & inbox

**Branch:** `feature/user-contact-form`
**Requirement:** 9
**Depends on:** branch 4

##### Goal
A logged-in user opens פנייה למנהל המערכת from the bottom-left button, fills in כותרת, סוג פנייה (תקלה, רעיון, דיווח, אחר) and תיאור מפורט, and sends it.

##### Today
- The form and `POST /api/contact` exist.
- The route accepts anonymous senders (`optionalAuth`) and trusts the `employeeId` in the body. The מזהה ארגוני field can be edited.
- Admins see the same button and form.

##### Tasks
###### Backend
- [ ] `POST /api/contact` requires login. Take the user and employee ID from the session and ignore `employeeId` in the body.
- [ ] Limits: title up to 120 characters, description up to 4,000, type one of the four values
- [ ] Rate limit: 5 messages per 10 minutes per user

###### Frontend
- [ ] Show the button only to users (admins get the inbox in branch 9)
- [ ] מזהה ארגוני is read-only and shows the user's 7-digit ID from the session
- [ ] After sending: a confirmation, then the form clears and closes. On an error, the text stays in the form.

##### Done when
- [ ] `1000002` sends one message of each type, and each is saved with `1000002`'s ID
- [ ] A call without a session gets 401
- [ ] Changing `employeeId` in the request body has no effect
- [ ] Build, lint and tests pass

#### Branch 9 · `feature/admin-inbox`

_M3 Users & inbox · Size M_

For admins, the bottom-left button opens a chat-style panel with every message users sent, newest first, and shows the unread count on the button.

Requirement: 8 · Depends on: branch 8 · Decision: D5

**Issue title:** Show admins an inbox of user messages

**Labels:** `type: feature`, `area: backend`, `area: frontend`, `area: database`, `role: admin`, `smoke pass`

**Milestone:** M3 Users & inbox

**Branch:** `feature/admin-inbox`
**Requirement:** 8
**Depends on:** branch 8
**Decision:** D5 (approved): read-only plus "mark as read"; actions on messages come later

##### Goal
An admin sees every message users sent, in a panel that opens from the bottom-left button, and knows how many are new.

##### Today
- `GET /api/contact` (admin only) returns every message with the sender's name and email.
- `PUT /api/contact/:id/status` exists, but nothing calls it.
- There is no inbox screen.

##### Tasks
###### Database and backend
- [ ] `ContactRequest.readAt DateTime?`
- [ ] `GET /api/contact/unread-count` (admin only)
- [ ] `PATCH /api/contact/:id/read` (admin only) sets `readAt`
- [ ] `GET /api/contact` takes `?type=` and `?unread=true`, newest first, 50 per page

###### Frontend
- [ ] For admins, the bottom-left button shows an unread badge and opens a side panel
- [ ] Each row: sender name and מזהה ארגוני, a type chip (תקלה, רעיון, דיווח, אחר), title, first line and time
- [ ] Opening a message shows the full text and marks it read
- [ ] Filters: type, unread only
- [ ] Refresh the unread count every 60 seconds while the tab is visible
- [ ] Empty state: "אין פניות חדשות"

##### Done when
- [ ] A message sent by `1000002` appears for `1000001` within a minute, with the badge
- [ ] Opening it clears its unread mark, also after a reload
- [ ] A user gets 403 from every inbox route
- [ ] Build, lint and tests pass

##### Out of scope
- Replying, assigning and changing status: decided later (D5)

#### Branch 10 · `feature/sso-login`

_M4 SSO & release · Size L_

SSO login through OpenID Connect, added once development is finished. In development, a Keycloak container plays the organization's identity provider, so SSO and password login can both be tested. In production, the same code points at the real provider and is the only way in.

Requirement: 1 (SSO half) · Depends on: branches 1–9 (development finished) · Decisions: D1, D7

**Issue title:** Add SSO login, with Keycloak in development

**Labels:** `type: feature`, `area: backend`, `area: frontend`, `area: devops`, `security-sensitive`, `needs: decision`

**Milestone:** M4 SSO & release

**Branch:** `feature/sso-login`
**Requirement:** 1 (the SSO half)
**Depends on:** branches 1–9. It starts once development is finished.
**Decisions:** D1 (dev: password and SSO; prod: SSO only). D7: SSO is configured now, after development is finished; branch 3 left room for it. The protocol, issuer, client and employee ID claim come from IT.

##### Goal
Users can log in through SSO. In development a local Keycloak stands in for the organization's identity provider; in production the same code uses the real one, and SSO is the only way in.

##### Tasks
###### Development identity provider
- [ ] `keycloak` service in `docker-compose.dev.yml` (pinned image tag, `start-dev --import-realm`, port 8080)
- [ ] Realm file `docker/keycloak/pakmaz-dev-realm.json`, imported on start:
  - [ ] client `pakmaz-portal` (confidential), redirect `http://localhost:5173/api/auth/sso/callback`
  - [ ] users `1000001` and `1000002` (also in the dev seed) and `1000003` (Keycloak only, for testing first-time users)
  - [ ] an `employee_id` attribute on each user, mapped into the ID token

###### Backend
- [ ] Add `openid-client`
- [ ] `GET /api/auth/sso/login`: authorization-code flow with PKCE; state, nonce and verifier in a short-lived `httpOnly` cookie; redirect to the provider
- [ ] `GET /api/auth/sso/callback`: validate the response; read the claim named in `OIDC_EMPLOYEE_ID_CLAIM`; reject anything that isn't 7 digits; find the user or create one as USER (name and email from the claims); set the same session cookie as password login; return to the saved page
- [ ] Logout also ends the provider session when it supports it (`OIDC_POST_LOGOUT_REDIRECT_URI`)
- [ ] Both routes answer 404 when `sso` isn't in `AUTH_MODES`
- [ ] Dev `AUTH_MODES` becomes `password,sso`
- [ ] Variables: `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI`, `OIDC_EMPLOYEE_ID_CLAIM` (default `employee_id`), `OIDC_POST_LOGOUT_REDIRECT_URI`, in both example files (Keycloak values in dev, placeholders in prod)

###### Frontend
- [ ] A כניסה עם SSO button on `/login` when `sso` is on
- [ ] With SSO as the only mode (production), the login page shows only that button
- [ ] A failed SSO login returns to `/login` with "לא ניתן לזהות מזהה ארגוני"

##### Done when
- [ ] In dev, `1000001` logs in by password and by SSO and gets the same user and role both ways
- [ ] `1000003` logs in by SSO for the first time and is created as USER
- [ ] A Keycloak user without a 7-digit `employee_id` is refused
- [ ] With `AUTH_MODES=sso`, the login page shows only SSO and password login answers 404
- [ ] Build, lint and tests pass

##### Before production (D7)
- [ ] IT confirms OIDC (if it's SAML, swap `openid-client` for a SAML library; the routes and session stay the same)
- [ ] The portal is registered with the organization's provider; issuer, client ID, secret and claim name go into `.env.prod` on the server

#### Branch 11 · `chore/docs-acceptance-and-prod-release`

_M4 SSO & release · Size M_

Brings the README up to date, checks every requirement in development and then in production, and does the first production deploy with the prod seed and SSO.

Requirements: all · Depends on: branches 1–10 · Decisions: D6, D8 (open)

**Issue title:** Update the docs, run the acceptance check and release to production

**Labels:** `type: docs`, `type: chore`, `area: devops`, `security-sensitive`, `needs: decision`, `smoke pass`

**Milestone:** M4 SSO & release

**Branch:** `chore/docs-acceptance-and-prod-release`
**Requirements:** all
**Depends on:** branches 1–10
**Decisions:** D6 (production runs its own Postgres container) is decided; D8 (who handles HTTPS) must be answered first

##### Goal
Someone new can set the portal up from the README, every requirement has been checked by hand, and production is live with SSO.

##### Tasks
###### Docs
- [ ] README: Docker for dev and prod, every environment variable per environment, the dev test accounts (`1000001`, `1000002`, `1000003`), what each role can do, and how to add an admin in production
- [ ] Replace the Vite template text in `frontend/README.md`, or delete it
- [ ] README: remove the line that says the default database is SQLite, and say that `backend/.env.example` is only for running without Docker
- [ ] Delete or regenerate the stale `backend/package-lock.json` and `frontend/package-lock.json`; only the root lockfile is used
- [ ] Run `npm audit` and decide what to upgrade (5 high-severity findings on 14 October, and a major Prisma update is available)
- [ ] `.env.dev.example` and `.env.prod.example` match `config/env.ts`

###### Acceptance check in development (as `1000001`, then as `1000002`)
- [ ] 1. Log in and out by password and by SSO; a wrong password and a non-7-digit ID are refused
- [ ] 2. The panel tab and `/admin` exist only for the admin
- [ ] 3. The admin adds an app; the user can't
- [ ] 4. The admin posts a message; the user sees it under the bell
- [ ] 5. The admin uploads a video; the user can't
- [ ] 6. The admin adds, renames and deletes folders (two-step warning); the user can't
- [ ] 7. Both favorite apps and share videos; favorites follow the user to another browser
- [ ] 8. The admin's bottom-left button opens the inbox
- [ ] 9. The user's bottom-left button sends a message that reaches the inbox
- [ ] Dark and light themes, desktop and phone width

###### First production deploy
- [ ] D6: the prod Postgres container and its nightly backup run; restoring one backup into a scratch database works
- [ ] A backup of the `uploads-prod` volume is scheduled
- [ ] `.env.prod` filled in on the server only: `AUTH_MODES=sso`, a new `JWT_SECRET`, the OIDC values from D7, `PROD_ADMIN_EMPLOYEE_IDS`
- [ ] `npm run docker:prod:up`, then `docker:prod:migrate`, then `docker:prod:seed`
- [ ] HTTPS in front of nginx (D8), and `CORS_ORIGIN` and `OIDC_REDIRECT_URI` set to the real address
- [ ] In production: an admin logs in by SSO and sees the panel; a regular employee logs in by SSO and doesn't; password login answers 404

##### Done when
- [ ] Every box above is ticked
- [ ] Build, lint and tests pass on `main` after the merge

# শাহ কৃষি তথ্য পাঠাগার · Shah Agriculture Information Library (SAIL)

A production-oriented, **Bengali-first** full-stack platform for an agricultural
information library, museum and knowledge centre. It ships a public website, a
complete admin dashboard, a versioned REST API and a PostgreSQL (Supabase)
database, with an Excel importer for bulk-loading the library catalogue.

> **ভাষা:** সাইটটি ডিফল্টভাবে বাংলায় চলে; হেডারে থাকা ভাষা সুইচার দিয়ে ইংরেজি
> মোডে যাওয়া যায়। পছন্দ ব্রাউজারে সেভ থাকে এবং পেজ রিলোড ছাড়াই বদলায়।

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [npm scripts](#npm-scripts)
- [Database](#database)
- [Creating the first admin](#creating-the-first-admin)
- [Documentation](#documentation)
- [Testing & builds](#testing--builds)
- [Troubleshooting](#troubleshooting)

---

## Features

### Public website (Bengali / English)

- **Two-layer header** — top utility bar (weather rotator across 8 divisions,
  notice ticker, social links, live date, language switch) and a main header
  with the logo, animated search and a database-driven navigation menu with
  dropdowns and "More" sub-menus.
- **Homepage** — hero slider, animated database counters, about section,
  founder's message, mission & vision, testimonials, program highlights,
  weather overview and notices.
- **Digital library** — searchable/ filterable catalogue with book detail pages.
- **Museum, gallery, programs, publications, achievements, research, videos
  (YouTube), useful links, board members and notices** — all database-driven.
- **Global search** across books, programs, publications, museum, gallery,
  videos and notices.
- **Contact form** with validation, spam throttle and optional email
  notification.
- **Correct Bengali calendar** (Bangladesh revised calendar, Pohela Boishakh on
  14 April) — not a translated Gregorian date.
- Responsive, accessible UI with Framer Motion animations and Lucide icons.

### Admin dashboard

- Cookie-based auth (Argon2id password hashing, JWT access token + rotating
  opaque refresh token, HttpOnly cookies) with role-based access control.
- Dashboard with live counts and recent activity.
- **20 content resources** with real create / read / update / delete, search,
  filtering, pagination and publish toggles.
- Singleton editors for site settings, about, founder message and mission/vision.
- Drag-and-drop-free navigation manager, user & role management, audit log,
  media library and an Excel books importer.
- Every list and form is driven by a single resource registry, so fields,
  filters and columns stay consistent between the API and the UI.

### API

- Versioned under `/api/v1`, documented with a served OpenAPI 3.0 document.
- Input validation with Zod, consistent JSON envelopes and error codes.
- Security: Helmet, CORS allowlist, rate limiting, origin (CSRF) checks, audit
  logging and path-traversal guards on uploads.

---

## Tech stack

| Layer      | Technology |
| ---------- | ---------- |
| Frontend   | React 18, Vite 5, TypeScript, Tailwind CSS, React Router 6, Framer Motion, Lucide, React Hook Form, Zod |
| Backend    | Node.js ≥ 20, Express 4, TypeScript (CommonJS), Prisma 5, Zod, ExcelJS, Multer, Pino, Nodemailer |
| Database   | PostgreSQL (encouraged host: Supabase) |
| Auth       | Argon2id (`@node-rs/argon2`), JWT access token, hashed rotating refresh token |
| Tooling    | npm workspaces, Vitest, tsc, concurrently |

---

## Repository layout

```
krishi_library/
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma        # all models (source of truth for fields)
│  │  └─ seed.ts              # idempotent demo/initial data
│  ├─ src/
│  │  ├─ config/              # env parsing + prisma client
│  │  ├─ middleware/          # auth, validation, error, upload, rate limit
│  │  ├─ modules/             # routes, generic CRUD factory, resource registry, Zod schemas
│  │  ├─ services/            # password, token, audit, mail, storage, weather
│  │  ├─ utils/               # http errors, pagination, slug, youtube, logger
│  │  ├─ scripts/             # create-admin
│  │  ├─ app.ts               # express app + OpenAPI static route
│  │  └─ server.ts            # http listener + graceful shutdown
│  ├─ openapi.json            # hand-maintained OpenAPI 3.0 document
│  └─ .env.example
├─ frontend/
│  ├─ src/
│  │  ├─ admin/               # dashboard, resource manager, configs, editors
│  │  ├─ components/          # ui kit, layout (header/footer), home sections
│  │  ├─ i18n/                # bn/en dictionaries + Bengali calendar
│  │  ├─ lib/                 # api client + data hooks
│  │  └─ pages/               # public pages
│  └─ .env.example
├─ docs/
│  ├─ API.md                  # endpoint + field reference
│  ├─ DEPLOYMENT.md           # Supabase, production, Windows, go-live checklist
│  └─ EXCEL-IMPORT.md         # book importer guide + template
└─ package.json               # npm workspaces root scripts
```

---

## Quick start

### Prerequisites

- **Node.js ≥ 20** (LTS) and npm 10+.
- A **PostgreSQL** database. A free [Supabase](https://supabase.com) project is
  the recommended option — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the
  exact connection strings.

### 1. Install dependencies

From the repository root:

```bash
npm install
```

> Prisma needs its client generated once. If your npm version blocks
> install scripts (npm 11+), run `npm run db:generate` manually after install.

### 2. Configure the backend

```bash
copy backend\.env.example backend\.env      # Windows
# cp backend/.env.example backend/.env      # macOS / Linux
```

Open `backend/.env` and set at minimum:

- `DATABASE_URL` and `DIRECT_URL` (Supabase pooler + direct URLs)
- `SESSION_SECRET` (a long random string)
- `FRONTEND_URL` (e.g. `http://localhost:5173`)

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Create the schema and seed data

```bash
npm run db:push      # or: npm run db:migrate   (creates a migration)
npm run db:seed
```

### 4. Create the first super admin

Set `BOOTSTRAP_ADMIN_PASSWORD` (min 8 chars) in `backend/.env`, then:

```bash
npm run create:admin
```

### 5. Run both apps

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:4000/api/v1>
- Admin: <http://localhost:5173/admin/login>

### 6. Optional: configure the frontend

```bash
copy frontend\.env.example frontend\.env
```

`VITE_API_URL` defaults to `http://localhost:4000/api/v1`. Leave it empty to use
the Vite dev proxy (`/api/v1`).

---

## Environment variables

Full reference with examples lives in [`backend/.env.example`](backend/.env.example).
The essentials:

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `NODE_ENV` | yes | `development` \| `test` \| `production` |
| `PORT` | no | API port (default `4000`) |
| `FRONTEND_URL` | yes | Allowed origin for CORS + secure cookies |
| `CORS_ORIGINS` | no | Extra comma-separated allowed origins |
| `DATABASE_URL` | yes | Pooled Postgres URL used by the app |
| `DIRECT_URL` | yes | Direct Postgres URL used for migrations |
| `SESSION_SECRET` | yes | Signs access tokens (min 16, use 32+) |
| `ACCESS_TOKEN_TTL` | no | Access token lifetime (default `15m`) |
| `REFRESH_TOKEN_TTL_DAYS` | no | Refresh session lifetime (default `30`) |
| `BOOTSTRAP_ADMIN_*` | for setup | First super admin credentials |
| `WEATHER_PROVIDER` | no | `open-meteo` (keyless) or `openweathermap` |
| `SMTP_*`, `CONTACT_NOTIFY_EMAIL` | no | Contact-form email notifications |
| `STORAGE_PROVIDER` | no | `local` (default) or `supabase` |
| `UPLOAD_MAX_MB`, `PUBLIC_API_URL` | no | Upload size + absolute media base URL |

Frontend (`frontend/.env`):

| Variable | Purpose |
| -------- | ------- |
| `VITE_API_URL` | Base URL of the API (empty ⇒ use the dev proxy) |

---

## npm scripts

Run from the repository root:

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Run API and web dev servers together |
| `npm run dev:backend` / `dev:frontend` | Run one side only |
| `npm run build` | Type-check and build both apps to `dist/` |
| `npm run typecheck` | TypeScript project checks |
| `npm run test` | Vitest unit tests (backend + frontend) |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Push the schema without a migration |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:seed` | Seed baseline content |
| `npm run db:studio` | Open Prisma Studio |
| `npm run create:admin` | Create/update the bootstrap super admin |
| `npm start` | Run the compiled backend (`backend/dist/src/server.js`) |

---

## Database

- `backend/prisma/schema.prisma` is the **source of truth** for every model and
  field. Enum-like values are stored as strings for portability.
- `backend/prisma/seed.ts` is idempotent: it only inserts when a table is empty
  and upserts singletons, so it is safe to re-run.
- For production use `npm run db:deploy -w backend` after committing a migration
  (`prisma migrate deploy`).

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Supabase connection details.

---

## Creating the first admin

```bash
# in backend/.env
BOOTSTRAP_ADMIN_EMAIL=you@example.com
BOOTSTRAP_ADMIN_PASSWORD=a-strong-password
BOOTSTRAP_ADMIN_NAME=Super Admin

npm run create:admin
```

No default password is ever shipped. The command creates or updates a
`SUPER_ADMIN` account. Additional users and roles are managed from
**Admin → Users** (super admin only).

Roles: `SUPER_ADMIN`, `EDITOR`, `CONTENT_MANAGER`. All three can create and edit
content; only `SUPER_ADMIN` can manage users.

---

## Documentation

- **[docs/API.md](docs/API.md)** — endpoint reference, envelopes, auth flow,
  pagination and the per-resource field tables. The live document is served at
  `/api/v1/openapi.json` and bundled as [`backend/openapi.json`](backend/openapi.json).
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Supabase setup, production
  build, Windows setup, reverse proxy, security and the go-live checklist.
- **[docs/EXCEL-IMPORT.md](docs/EXCEL-IMPORT.md)** — the book import template,
  preview/commit workflow and error handling.

---

## Testing & builds

```bash
npm run typecheck     # backend + frontend
npm run test          # Vitest (backend unit + frontend i18n/calendar)
npm run build         # backend tsc + frontend vite build
```

> Tests and builds are executed locally; only claim them green when the
> commands above have actually been run in your environment.

---

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `PrismaClientInitializationError` | Check `DATABASE_URL` / `DIRECT_URL`; run `npm run db:generate`; ensure the database is reachable. |
| Login says "Invalid email or password" | Run `npm run create:admin` after setting `BOOTSTRAP_ADMIN_PASSWORD`. |
| Uploads 404 in the browser | Set `PUBLIC_API_URL` to the public API origin and make sure `/uploads` is proxied. |
| CORS / cookie errors in production | Set `FRONTEND_URL` (and `CORS_ORIGINS`) to the exact frontend origin and serve both over HTTPS. |
| Weather shows a fallback | Set `WEATHER_API_KEY` for `openweathermap`, or keep the keyless `open-meteo` provider. |
| Contact form doesn't email | SMTP is optional; the message is still stored in **Admin → Contact Inbox**. Configure `SMTP_*` + `CONTACT_NOTIFY_EMAIL` to enable email. |

---

## License

Private project. All rights reserved unless a separate license is provided.

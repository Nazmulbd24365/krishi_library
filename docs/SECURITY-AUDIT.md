# SAIL — Pre-Deployment Security Audit

- **Project:** Shah Agriculture Information Library (SAIL / Krishi)
- **Date:** 2026-10-09
- **Scope:** Actual repository `D:\Projects\krishi_library`, its Git history, backend/frontend code, configuration, and the live Supabase PostgreSQL project (`iurbtarvbtspgmuqgfip`).
- **Method:** Source review, Git history scan, live database inspection (RLS/grants) via Prisma raw SQL, dependency audit, and the project's own typecheck/test/build tooling. No destructive tests were run against production data. Nothing was pushed or deployed.

> Severity reflects production impact. Findings marked **APPLIED** were fixed during this audit (low-risk, non-breaking); findings marked **PENDING** are recommended but not yet changed.

---

## 1. Overall verdict

| Decision | Result |
| --- | --- |
| **Push the repo to GitHub** | ✅ **GO** — no secrets are present in tracked files or history. Commit the two applied fixes first. |
| **Deploy to production** | ✅ **GO once the applied migration is committed** — the critical database exposure is already fixed on the live Supabase project. Address the nodemailer upgrade before a high-profile public launch (not blocking). |

The single blocking issue (Critical #1) has been fixed. The remaining items are hardening and dependency upgrades.

---

## 2. Findings

### CRITICAL

#### C1 — Row-Level Security disabled on all tables; Supabase `anon`/`authenticated` had full read/write access — **APPLIED**
- **Where:** Live database `public` schema (all 31 Prisma tables). Tables were created without RLS by `backend/prisma/migrations/0_init/migration.sql`.
- **Evidence (before fix):**
  - `pg_tables.rowsecurity = false` for every table, including `User`, `Session`, `AuditLog`, `ContactMessage`, `MediaAsset`, `_prisma_migrations`.
  - `anon` **and** `authenticated` held `DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE` on every table.
  - `has_table_privilege('anon', ..., 'SELECT'/'INSERT'/'UPDATE'/'DELETE')` returned `true` for `User`, `Session`, `AuditLog`, `ContactMessage`, `MediaAsset`.
- **Risk:** Supabase exposes the `public` schema through PostgREST. Access by the `anon` role is gated **only** by RLS, and the anon key is by design a public value. With RLS off, anyone holding that key could dump `User.passwordHash` and `Session.tokenHash`, or read/modify/delete/truncate all content — a full data breach and site takeover.
- **Fix applied:** `backend/prisma/migrations/1_enable_rls/migration.sql`
  - Enables RLS on every `public` table (no permissive policies ⇒ default deny for `anon`/`authenticated`).
  - Revokes direct table/sequence grants and default privileges from `anon`/`authenticated` (guarded so it is a no-op on plain PostgreSQL).
  - Safe because the API connects as `postgres` (confirmed `rolbypassrls = true`) and Storage uses `service_role` (`rolbypassrls = true`); neither is affected.
- **Verified after fix:** all 31 tables `rowsecurity = true`; `anon`/`authenticated` grants = **0**; Prisma reads still succeed; full API smoke test passes.
- **Rollback:** drop the migration row and run `ALTER TABLE "<t>" DISABLE ROW LEVEL SECURITY;` — not recommended.

### HIGH

#### H1 — Insecure default `SESSION_SECRET` accepted in production — **APPLIED**
- **Where:** `backend/src/config/env.ts:32` (`SESSION_SECRET` defaulted to `dev-only-insecure-secret-change-me`).
- **Risk:** If the env var were ever unset/mistyped in production, JWTs would be signed with a publicly known constant → anyone could forge admin sessions.
- **Fix applied:** `backend/src/config/env.ts` now refuses to boot when `NODE_ENV=production` and the secret is still the default.
- **Verified:** `NODE_ENV=production SESSION_SECRET=dev-only-insecure-secret-change-me node dist/src/server.js` → prints the refusal message and **exits with code 1**.

#### H2 — Outdated `nodemailer@^6.9.16` (multiple high advisories) — **PENDING**
- **Where:** `backend/package.json:38`, used by `backend/src/services/mail.service.ts`.
- **Risk:** SMTP command/header injection, SSRF/arbitrary file read via message options, recipient-domain allow-list bypass (advisories GHSA-mm7p-fcc7-pg87, GHSA-c7w3-x93f-qmm8, and others). Scanner fix: `>=7.x` (major).
- **Practical exposure:** reduced — the recipient is server-controlled (`env.CONTACT_NOTIFY_EMAIL`, `contact.routes.ts:46`), transport options are server-controlled (`mail.service.ts:10-15`), and email is disabled unless `SMTP_HOST` is set (`hasSmtp`).
- **Recommended:** upgrade `nodemailer` to the current major and re-run tests before enabling SMTP.

### MEDIUM

#### M1 — Upload trusts client-supplied MIME type; SVG allowed → stored-XSS potential — **PENDING**
- **Where:** `backend/src/middleware/upload.ts:8` (`image/svg+xml` allowed), `:15-20` (`file.mimetype` only), `backend/src/modules/upload.routes.ts:14-64`, `backend/src/app.ts:24` (CSP disabled), `app.ts:43-49` (serves `/uploads` from the API origin).
- **Risk:** `file.mimetype` is attacker-controlled; a file named `*.svg` passes as an image and is served by `express.static` as `image/svg+xml`. With CSP disabled, opening it in a browser executes embedded script in the API origin. Requires an authenticated editor account.
- **Mitigation in current prod path:** `STORAGE_PROVIDER=supabase` serves media from the Supabase domain, not the API origin.
- **Recommended:** validate magic bytes, drop `image/svg+xml` (or force `Content-Disposition: attachment`), and set a restrictive CSP on the `/uploads` route.

#### M2 — Public Supabase Storage bucket exposes all objects by URL — **PENDING (decision)**
- **Where:** bucket `sail-media` (`public = true`), `backend/src/services/storage.service.ts:38-43`.
- **Risk:** Any object (including PDFs under `documents/`) is world-readable if its URL is known. Acceptable for public library media; flag if any non-public document is ever uploaded.
- **Recommended:** keep public for public media, or split a private bucket + signed URLs for restricted documents.

#### M3 — Excel import has no row/complexity limit — **PENDING**
- **Where:** `backend/src/modules/books-import.routes.ts` (auth-protected; 20 MB cap via `upload.ts:36-39`).
- **Risk:** ExcelJS parses the whole workbook; a crafted `.xlsx` (zip-bomb / huge rows) can exhaust CPU/memory (DoS by an authenticated editor).
- **Recommended:** cap rows/worksheets and reject oversized workbooks before parsing.

#### M4 — `react-router-dom@^6.28.1` moderate advisories — **PENDING**
- **Where:** `frontend/package.json:20`. Open redirect via backslash in `<Link>`/`useNavigate`; SSR constructor injection. Fix requires v7 (major).

### LOW

| ID | Finding | Location | Note |
| --- | --- | --- | --- |
| L1 | Login user-enumeration via timing (argon2 verify skipped when user not found) | `backend/src/modules/auth.routes.ts:44-46` | Generic message is returned; timing only. Run a dummy verify for constant time. |
| L2 | Access token also returned in JSON body (in addition to httpOnly cookie) | `auth.routes.ts:56`, `:76` | Frontend does not use it (cookie-based). Remove to shrink exposure surface. |
| L3 | `optUrl` accepts protocol-relative `//host` (starts with `/`) | `backend/src/modules/schemas.ts:7-13` | Admin-only input; tighten to require a single leading slash. |
| L4 | Unbounded in-memory contact anti-spam map | `backend/src/modules/contact.routes.ts:14` | Grows one entry per unique message; bound it. |
| L5 | Dev-only dependency advisories | `vitest` (critical, `tinypool` RCE), `vite`, `tailwindcss`, `esbuild` | Not in the production bundle/runtime; upgrade when convenient. Do not `audit fix --force`. |

---

## 3. Controls verified as sound

- **Secrets/Git:** `.env` and `frontend/.env` are git-ignored (`.gitignore:12`). Only `.env.example` / `.env.production.example` are tracked, containing placeholders only. No `eyJ...` tokens, `service_role` values, `AKIA` keys, or credential-bearing connection strings in tracked files. Fresh history (2 commits) — no real `.env`, key, or dump ever added.
- **AuthN:** Argon2id hashing (`password.service.ts:4-9`); JWT access tokens signed with `SESSION_SECRET`; refresh tokens are 48-byte random, stored only as SHA-256 hashes, rotated on use, with expiry + `isActive` checks (`token.service.ts`). `attachUser` re-reads the user from the DB each request, so role/active changes take effect immediately.
- **AuthZ:** Every admin/mutating route is gated (`crud.factory.ts:108`, `upload.routes.ts:12`, `books-import.routes.ts:15`, `navigation.routes.ts`, `admin.routes.ts:8`, singleton PUT `crud.factory.ts:202-206`, user management `auth.routes.ts:126-185`). Confirmed live: unauthenticated `GET /api/v1/admin/dashboard` → **401**.
- **Input/DB:** Zod validation on bodies/queries; list `pageSize` clamped to 100 (`pagination.ts:11`); user role restricted to an enum (`schemas.ts:33,38`); Prisma parameterized queries throughout, no raw SQL with user input. Sort fields are allow-listed.
- **Transport/CSRF:** Production cookies `HttpOnly; Secure; SameSite=None` (`auth.routes.ts:23-31`); CORS allow-list with credentials (`app.ts:27-35`); Origin check on state-changing requests (`auth.ts:62-70`); `trust proxy` set for Render.
- **Rate/size limits:** API 1000/15m, auth 20/15m, forms 10/h, search 120/m; JSON body 2 MB; upload caps enforced.
- **Errors/logs:** Production responses hide stack traces (`middleware/error.ts`); pino redacts `authorization`, `cookie`, `*.password`, `*.passwordHash`; health endpoint returns only status/env/time.
- **Uploads:** Files held in memory, random collision-resistant filenames with sanitized extensions (`storage.service.ts:53-56`), path-traversal guards on delete, auth required, Supabase uses the service-role key server-side only.
- **Frontend:** No `dangerouslySetInnerHTML`/`eval`; no secrets in `VITE_*` (only `VITE_API_URL`); source maps disabled (`vite.config.ts:21`).
- **Storage:** `storage.objects` has RLS enabled with no permissive policies; only `service_role`/`postgres` (`BYPASSRLS`) can write.

---

## 4. Tests executed (actual results)

| Command | Result |
| --- | --- |
| `npm run typecheck` | ✅ clean (backend + frontend) |
| `npm test` | ✅ 15 passed (backend 9, frontend 6) |
| `npm run build` | ✅ success (Vite production build) |
| `npx prisma migrate deploy` | ✅ applied `1_enable_rls` |
| Live DB RLS/grant queries | ✅ before: RLS off + full anon grants; after: RLS on + 0 grants |
| Live API smoke (health, `GET /books` total 24, admin cookie login, `/auth/me`, admin dashboard, unauth admin 401) | ✅ all as expected |
| `NODE_ENV=production` + default `SESSION_SECRET` boot | ✅ refused, exit code 1 |
| `npm audit` | ⚠️ 18 findings: 2 critical (dev-only), 7 high, 9 moderate |

---

## 5. Cannot be verified without production access

- **Supabase Storage upload path** (`service_role` REST upload/delete) — implemented but never exercised against Supabase because the key was intentionally withheld. **Unverified.**
- **Vercel / Render runtime** (env vars, HTTPS, proxy headers, cross-site cookies) — not deployed.
- **Actual PostgREST exploitation with the anon key** — inferred from grants; no attack was performed (avoids destructive testing).
- **Production-mode boot with real secrets** — only the guard path was tested.

---

## 6. Resolution checklist

1. Commit the applied changes: `backend/prisma/migrations/1_enable_rls/` and `backend/src/config/env.ts`.
2. Confirm Render's build runs `npm run db:deploy -w backend` (already in `render.yaml`) so RLS stays applied.
3. Rotate the bootstrap admin password after go-live (known dev secret).
4. Upgrade `nodemailer` (H2) and run the test suite again.
5. Schedule: upload magic-byte validation + SVG/CSP hardening (M1), Excel row limit (M3), React Router v7 (M4).
6. Keep the Supabase `service_role` key only on Render; never in the frontend.

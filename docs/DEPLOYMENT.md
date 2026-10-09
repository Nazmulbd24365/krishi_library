# Deployment Guide

This guide covers deploying SAIL to production with a **Supabase PostgreSQL**
database, plus a Windows-specific setup section and a go-live checklist.

Architecture at a glance:

```
                    ┌────────────────────────────┐
  Browser  ───────► │  Reverse proxy (HTTPS)      │
                    │  /            → frontend     │  static Vite build
                    │  /api/v1, /uploads → API     │  Node/Express
                    └───────────────┬─────────────┘
                                    │ Prisma (pooled connection)
                                    ▼
                          Supabase PostgreSQL
```

The frontend is a static SPA; the backend is a long-running Node process.

---

## 1. Prerequisites

- Node.js **≥ 20** (LTS) and npm 10+.
- A Supabase project (or any PostgreSQL 13+ server).
- A host for the API (VM, container, Render/Railway/Fly, etc.) and static
  hosting for the frontend (same host, Netlify/Vercel, S3+CDN, nginx).
- HTTPS in front of both apps (required for `Secure` cookies).

---

## 2. Supabase setup

1. Create a project at <https://supabase.com> and open **Project Settings →
   Database**.
2. Copy two connection strings:

   - **Connection pooling** (Transaction mode, port `6543`) → `DATABASE_URL`.
     Append `?pgbouncer=true&connection_limit=1`.
   - **Direct connection** (port `5432`) → `DIRECT_URL`. Used only by Prisma
     migrations/introspection.

   ```
   DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
   ```

3. URL-encode any special characters in the password.
4. For media stored in Supabase Storage (instead of local disk), create a public
   bucket (default name `sail-media`) and set `STORAGE_PROVIDER=supabase`,
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`.

> **Pooler note:** keep `connection_limit=1` for serverless platforms. For a
> traditional long-running server you may raise it.

---

## 3. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Required values:

```env
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-domain.example
CORS_ORIGINS=            # optional extra origins, comma separated

DATABASE_URL=postgresql://…:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://…:5432/postgres

SESSION_SECRET=<48+ random bytes, hex>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Optional but recommended:

```env
WEATHER_PROVIDER=open-meteo
UPLOAD_MAX_MB=8
PUBLIC_API_URL=https://api.your-domain.example
STORAGE_PROVIDER=local

SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=…
SMTP_PASSWORD=…
EMAIL_FROM="SAIL <no-reply@your-domain.example>"
CONTACT_NOTIFY_EMAIL=info@your-domain.example
```

> **Never commit `backend/.env`.** It is git-ignored; keep secrets in your host's
> environment store.

---

## 4. Database migration

For the **first deployment** you can push the schema directly:

```bash
npm install
npm run db:generate
npm run db:push          # creates tables from prisma/schema.prisma
npm run db:seed          # optional baseline/demo content
```

For subsequent deployments, prefer **migrations** so schema changes are tracked
and reversible:

```bash
# locally, after editing prisma/schema.prisma
npm run db:migrate -w backend      # creates a migration + applies it
# commit the new files under backend/prisma/migrations/

# on the server
npm run db:deploy -w backend       # applies committed migrations (prisma migrate deploy)
```

> `db:migrate` (development) may prompt and can reset data — use it locally, not
> in production. Production uses `db:deploy`.

---

## 5. Create the first admin

Set the bootstrap variables in `backend/.env`:

```env
BOOTSTRAP_ADMIN_EMAIL=admin@your-domain.example
BOOTSTRAP_ADMIN_PASSWORD=a-strong-unique-password
BOOTSTRAP_ADMIN_NAME=Super Admin
```

Then:

```bash
npm run create:admin
```

Remove or blank `BOOTSTRAP_ADMIN_PASSWORD` afterwards. No default password is
shipped; additional users are created from **Admin → Users**.

---

## 6. Build and run

```bash
npm run build           # backend → dist/, frontend → frontend/dist/
```

Start the API:

```bash
NODE_ENV=production npm start
# equivalent to: node backend/dist/src/server.js
```

Serve the frontend `frontend/dist/` as static files.

---

## 7. Frontend configuration

Create `frontend/.env` (or set at build time) with the public API base:

```env
VITE_API_URL=https://api.your-domain.example/api/v1
```

If the frontend and API share an origin through the reverse proxy, you can leave
`VITE_API_URL` empty and proxy `/api` and `/uploads` to the API. Rebuild the
frontend after changing this value.

---

## 8. Reverse proxy (nginx example)

```nginx
server {
  listen 443 ssl;
  server_name your-domain.example;

  root /var/www/sail/frontend/dist;
  index index.html;

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # API + local uploads
  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /uploads/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
  }

  client_max_body_size 32m;   # keep >= 3 × UPLOAD_MAX_MB
}
```

The API already trusts the first proxy hop (`trust proxy = 1`) so rate limiting
and secure cookies behave correctly behind nginx.

---

## 9. Process management

### Linux (systemd)

```ini
# /etc/systemd/system/sail.service
[Unit]
Description=SAIL API
After=network.target

[Service]
WorkingDirectory=/var/www/sail
ExecStart=/usr/bin/node backend/dist/src/server.js
EnvironmentFile=/var/www/sail/backend/.env
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now sail
```

### PM2 (cross-platform)

```bash
npm i -g pm2
pm2 start backend/dist/src/server.js --name sail-api
pm2 save && pm2 startup
```

### Windows (NSSM or Task Scheduler)

Use [NSSM](https://nssm.cc/) to run `node backend\dist\src\server.js` as a
service, setting the working directory to the repository root and loading
`backend\.env`. Alternatively create a **Scheduled Task** that runs at startup:

```powershell
node D:\Projects\krishi_library\backend\dist\src\server.js
```

Set the task's **Start in** to `D:\Projects\krishi_library`.

---

## 10. Windows setup

1. **Install Node.js 20 LTS** with the official installer (includes npm). Verify:

   ```powershell
   node -v
   npm -v
   ```

2. **Clone/copy the project**, then from the project root:

   ```powershell
   npm install
   npm run db:generate
   Copy-Item backend\.env.example backend\.env
   Copy-Item frontend\.env.example frontend\.env
   ```

3. **Edit `backend\.env`** in Notepad/VS Code and fill in Supabase +
   `SESSION_SECRET`.

4. **PowerShell execution policy** — if scripts are blocked (`about_Execution_Policy`):

   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```

5. **Run in development**:

   ```powershell
   npm run dev
   ```

6. **npm install scripts blocked (npm 11+)**: Prisma's client and esbuild run
   post-install scripts. If they are skipped, run:

   ```powershell
   npm run db:generate
   npm run build -w frontend
   ```

7. **Long paths / file watchers**: if `tsx watch` or Vite misses changes, enable
   long-path support (`git config --system core.longpaths true`; Windows 10+
   registry `LongPathsEnabled=1`) and consider excluding `node_modules` from
   antivirus scanning.

8. **Firewall**: allow inbound TCP `4000` only if the API is exposed directly;
   otherwise keep it bound behind the reverse proxy.

---

## 11. Security checklist

- [ ] `SESSION_SECRET` is long, random and unique per environment.
- [ ] `NODE_ENV=production` (enables `Secure` cookies and disables stack traces).
- [ ] `FRONTEND_URL` / `CORS_ORIGINS` list only real origins.
- [ ] HTTPS enforced end-to-end; HTTP redirects to HTTPS.
- [ ] Database password rotated; connection strings stored as secrets.
- [ ] `BOOTSTRAP_ADMIN_PASSWORD` cleared after creating the admin.
- [ ] Default IAM/admin accounts replaced; principle of least privilege applied.
- [ ] Backups enabled on Supabase; restore procedure tested.
- [ ] `UPLOAD_MAX_MB` and reverse-proxy `client_max_body_size` aligned.
- [ ] Rate limits reviewed for expected traffic.
- [ ] Audit log (`/admin/audit-logs`) monitored for unexpected writes.

---

## 12. Operations

- **Health check:** `GET /api/v1/health` (returns `{ success, status, env, time }`).
  Point your load balancer/uptime monitor here. Note the API starts even if the
  database is temporarily unreachable and logs the failure — verify the health
  endpoint *and* a database read.
- **Logs:** Pino structured logs on stdout; collect with your platform's logger.
- **Media:** local uploads live in `backend/uploads/`; back up this directory, or
  switch to Supabase Storage so media is durable and CDN-served.
- **Updates:** pull/build, run `npm run db:deploy -w backend`, then restart the
  process. Migrations are additive by default — review generated SQL before
  deploying destructive changes.
- **Rollback:** redeploy the previous build. If a migration must be reverted,
  restore from a database backup; `prisma migrate` does not auto-downgrade.

---

## 13. Go-live checklist

**Configuration**

- [ ] `backend/.env` complete and secret values set.
- [ ] `frontend/.env` (`VITE_API_URL`) set and frontend rebuilt.
- [ ] `npm run db:generate` succeeded.

**Database**

- [ ] Migrations applied (`db:deploy`) or schema pushed (`db:push`).
- [ ] Seed run if demo/baseline content is wanted (`db:seed`).
- [ ] Super admin created (`create:admin`) and able to sign in.

**Build**

- [ ] `npm run typecheck` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` produces `backend/dist/` and `frontend/dist/`.
- [ ] `npm start` serves `/api/v1/health` and `/api/v1/openapi.json` with `200`.

**Runtime**

- [ ] HTTPS active; cookies set with `Secure` + `HttpOnly`.
- [ ] CORS allows only the production origin.
- [ ] Public pages load with seeded content and correct Bengali date.
- [ ] Admin login, create/edit/delete, publish toggle and Excel import smoke-tested.
- [ ] Contact form stores a message; email notification delivered (if configured).
- [ ] Uploads persist and are reachable at `/uploads/...` (or the storage URL).

**Post-launch**

- [ ] Uptime monitoring on `/api/v1/health`.
- [ ] Database backups scheduled; restore tested.
- [ ] Error logging/alerting wired up.

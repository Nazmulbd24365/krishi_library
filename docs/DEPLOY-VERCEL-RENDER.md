# Deploying SAIL: Vercel (frontend) + Render (API) + Supabase Storage

This is the recommended go-live path chosen for SAIL:

```
   Browser
      │  https://sail.vercel.app            (static React SPA)
      ▼
 ┌──────────┐   fetch  https://sail-api.onrender.com/api/v1   ┌──────────┐
 │  Vercel  │ ───────────────────────────────────────────────► │  Render  │  Node/Express API
 └──────────┘                                                  └────┬─────┘
                                                                    │ Prisma (pgbouncer :6543)
                                                                    ▼
                                                         Supabase PostgreSQL
                                                         Supabase Storage (media)
```

- **Frontend** → Vercel (static, free, auto-HTTPS)
- **API** → Render Web Service (free tier available)
- **Database + media** → Supabase (already connected)

> The frontend and API are on **different domains**, so the API sets auth cookies
> with `SameSite=None; Secure` in production. This is already configured.

---

## 0. Supabase: create the media bucket

1. Supabase Dashboard → **Storage** → **New bucket**.
2. Name: **`sail-media`**, toggle **Public bucket** = ON → Create.
3. Get the service key: **Project Settings → API → Project API keys → `service_role`** (click reveal). This is a secret — it lives only on Render, never in the frontend.
4. Your project URL is `https://iurbtarvbtspgmuqgfip.supabase.co`.

<details>
<summary>Prefer SQL? Run this once in the Supabase SQL editor</summary>

```sql
insert into storage.buckets (id, name, public)
values ('sail-media', 'sail-media', true)
on conflict (id) do nothing;
```
</details>

---

## 1. Push the code to GitHub

`gh` is not installed, so create the repo in the browser:

1. On <https://github.com/new>, create an empty repository (e.g. `krishi-library`). Do **not** add a README.
2. From this project folder:

```powershell
git add .
git commit -m "Initial commit: SAIL full-stack"
git branch -M main
git remote add origin https://github.com/<you>/krishi-library.git
git push -u origin main
```

`.env` files and `node_modules/` are already git-ignored.

---

## 2. Deploy the API on Render

1. <https://dashboard.render.com> → **New +** → **Blueprint**.
2. Connect your GitHub repo. Render reads `render.yaml` and proposes the **`sail-api`** service.
3. Fill the secrets it asks for:

| Variable | Value |
| --- | --- |
| `FRONTEND_URL` | `https://sail.vercel.app` (temporary — fix in step 4) |
| `DATABASE_URL` | `postgresql://postgres.iurbtarvbtspgmuqgfip:<password>@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10` |
| `DIRECT_URL` | `postgresql://postgres.iurbtarvbtspgmuqgfip:<password>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres` |
| `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` key from step 0 |
| `PUBLIC_API_URL` | `https://sail-api.onrender.com` (or the exact URL Render shows) |

   `SESSION_SECRET` is generated automatically. Everything else is preset.
4. **Create** the Blueprint. The build runs `db:generate` → `db:deploy` (migrations) → `build`.
5. When live, copy the service URL (e.g. `https://sail-api.onrender.com`). Verify:

   ```
   https://sail-api.onrender.com/api/v1/health   →   {"success":true,...}
   ```

> Free Render services sleep after ~15 minutes of inactivity; the next request
> takes ~30–60s to wake. Upgrade to Starter to avoid cold starts.

---

## 3. Deploy the frontend on Vercel

1. <https://vercel.com/new> → import the same GitHub repo.
2. Set **Root Directory** to **`frontend`** (click *Edit* next to Root Directory).
3. Framework: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
4. **Environment Variable**:

   | Name | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://sail-api.onrender.com/api/v1` |

5. **Deploy**. Note your URL, e.g. `https://sail.vercel.app`.

---

## 4. Close the loop (important)

On Render → `sail-api` → **Environment**, set these to their final values, then
**Save** (triggers a redeploy):

| Variable | Final value |
| --- | --- |
| `FRONTEND_URL` | your Vercel URL, e.g. `https://sail.vercel.app` (no trailing slash) |
| `PUBLIC_API_URL` | your Render URL, e.g. `https://sail-api.onrender.com` |

`FRONTEND_URL` must match the browser origin exactly, or CORS and cookie
verification will reject requests.

---

## 5. Verify go-live

- [ ] `GET https://sail-api.onrender.com/api/v1/health` → `200`.
- [ ] Public site loads with seeded Bengali content; language toggle works.
- [ ] `https://<app>.vercel.app/admin/login` → log in as your admin user.
- [ ] DevTools → Application → Cookies: `sail_at` / `sail_rt` are present and **Secure**.
- [ ] Upload an image in the admin; it renders, and the file appears in Supabase → Storage → `sail-media/images/`.
- [ ] Create → publish → delete a record.
- [ ] Contact form submits (email only if SMTP is configured).
- [ ] Change the bootstrap admin password.

---

## 6. Ongoing deploys

- **Frontend**: push to `main` → Vercel rebuilds automatically. If you change
  `VITE_API_URL`, update the Vercel env var and redeploy.
- **API**: push to `main` → Render rebuilds and runs `prisma migrate deploy`.
- **Schema changes**: edit `backend/prisma/schema.prisma`, run
  `npm run db:migrate -w backend` locally to generate a migration, commit the
  new `backend/prisma/migrations/*` files, then push. Never use `db:push` in production.

---

## 7. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Admin login returns 200 but you're still logged out | `FRONTEND_URL` doesn't match the Vercel origin, or the browser blocks third-party cookies. Confirm the value and that the API is HTTPS. |
| CORS error in console | Add the exact origin to `FRONTEND_URL` (or `CORS_ORIGINS`, comma-separated). |
| Uploaded images 404 | Bucket not **Public**, or `SUPABASE_SERVICE_ROLE_KEY` missing/wrong on Render. Check Render logs for `Supabase Storage upload failed`. |
| Render build fails at `db:deploy` | `DATABASE_URL`/`DIRECT_URL` wrong or DB password needs URL-encoding. |
| First request after idle is slow | Render free plan cold start — expected. |
| 500s only in production | Set `NODE_ENV=production`; check Render logs (Pino JSON on stdout). |

---

## 8. Custom domain (later)

1. Vercel → Project → **Domains** → add `krishilibrary.com` (or similar) and follow the DNS instructions.
2. Render → `sail-api` → **Settings → Custom Domains** → add `api.krishilibrary.com`.
3. Update `VITE_API_URL` (Vercel) to `https://api.krishilibrary.com/api/v1` and `FRONTEND_URL` (Render) to `https://krishilibrary.com`, then redeploy both.

# SAIL API Reference

Base URL: **`/api/v1`** (e.g. `http://localhost:4000/api/v1` in development).

A machine-readable [OpenAPI 3.0](https://spec.openapis.org/oas/v3.0.3) document is
served at **`GET /api/v1/openapi.json`** and is also stored at
[`backend/openapi.json`](../backend/openapi.json). It is hand-maintained and
mirrors this page.

---

## Response envelope

Every JSON response uses one of these shapes.

**Success (single item / object)**

```json
{ "success": true, "data": { "id": "clx…" } }
```

**Success (list)** — list endpoints add pagination metadata:

```json
{
  "success": true,
  "data": [ { "id": "clx…" } ],
  "meta": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 }
}
```

**Success (message only)**

```json
{ "success": true, "message": "Deleted successfully" }
```

**Error**

```json
{ "success": false, "message": "Validation failed", "details": { "nameBn": ["Required"] } }
```

| Status | Meaning |
| ------ | ------- |
| 200 | OK |
| 201 | Created |
| 400 | Validation failed / bad request (`details` contains field errors) |
| 401 | Not authenticated or session expired |
| 403 | Authenticated but not permitted (role or origin) |
| 404 | Not found |
| 409 | Unique conflict (e.g. duplicate email/slug) |
| 429 | Rate limit exceeded |
| 500 | Unhandled server error |

---

## Rate limits

| Limiter | Scope | Window | Max |
| ------- | ----- | ------ | --- |
| Global API | all `/api/v1` routes | 15 min | 1000 |
| Auth | `POST /auth/login` | 15 min | 20 |
| Contact form | `POST /contact` | 60 min | 10 |
| Search | `GET /search` | 1 min | 120 |

Exceeded limits return `429` with `{ "success": false, "message": "Too many requests…" }`.

---

## Authentication

Auth uses **HttpOnly cookies** set by `POST /auth/login`:

- `sail_at` — JWT access token, 15 minutes.
- `sail_rt` — opaque rotating refresh token, 30 days (hashed at rest).

For non-browser clients you may instead send `Authorization: Bearer <accessToken>`
(returned in the login response). All state-changing requests are origin-checked;
browser requests from an unlisted origin are rejected with `403`.

### `POST /auth/login`

```json
{ "email": "admin@example.com", "password": "••••••••" }
```

Returns the user and access token, and sets both cookies.

### `POST /auth/refresh`

Uses the `sail_rt` cookie, rotates it and issues a new access token. Returns `401`
if the session is expired or revoked.

### `POST /auth/logout`

Revokes the current refresh session and clears both cookies.

### `GET /auth/me` 🔒

Returns the authenticated user.

### `POST /auth/change-password` 🔒

```json
{ "currentPassword": "old", "newPassword": "new-at-least-8" }
```

Revokes all sessions and clears cookies on success.

### Users (SUPER_ADMIN only)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/auth/users` | List users |
| `POST` | `/auth/users` | Create user `{ name, email, password, role }` |
| `PATCH` | `/auth/users/:id` | Update `{ name?, role?, isActive?, password? }` |
| `DELETE` | `/auth/users/:id` | Delete user (cannot delete self) |

`role` is one of `SUPER_ADMIN`, `EDITOR`, `CONTENT_MANAGER`.

🔒 = requires authentication. Content writes require `SUPER_ADMIN`, `EDITOR` or
`CONTENT_MANAGER`; user management requires `SUPER_ADMIN`.

---

## Common list query parameters

All list endpoints (public and admin) accept:

| Param | Type | Default | Notes |
| ----- | ---- | ------- | ----- |
| `page` | integer ≥ 1 | `1` | Page number |
| `pageSize` | integer 1–100 | `10` | Items per page |
| `search` | string | — | Case-insensitive across the resource's search fields |
| `sort` | string | `createdAt` | Field to sort by; unknown fields fall back to the default order |
| `order` | `asc` \| `desc` | `desc` | Sort direction |

Resource-specific filters are listed per resource below.

---

## System endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/health` | `{ success, status, env, time }` |
| `GET` | `/config/public` | Non-secret flags: weather provider/units, email enabled, max upload MB |
| `GET` | `/openapi.json` | This API's OpenAPI document |

---

## Weather

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/weather/divisions` | The 8 divisions `{ key, nameBn, nameEn }` |
| `GET` | `/weather` | Current weather for all divisions |
| `GET` | `/weather/:division` | Current weather for one division (or `null`) |
| `POST` | `/weather/refresh` 🔒 | Force a cache refresh |

Weather is cached (`WEATHER_CACHE_TTL_SECONDS`) and degrades gracefully when the
provider is unreachable.

---

## Search

### `GET /search?q=ধান`

Queries must be at least 2 characters. Returns grouped hits:

```json
{
  "success": true,
  "data": {
    "query": "ধান",
    "groups": [
      {
        "key": "books",
        "labelBn": "বই",
        "labelEn": "Books",
        "items": [{ "type": "book", "id": "…", "title": "…", "subtitle": "…", "url": "/library/…", "image": null }]
      }
    ]
  }
}
```

Groups: `books`, `programs`, `publications`, `museum`, `gallery`, `videos`, `notices`.

---

## Contact

### `POST /contact`

```json
{
  "name": "করিম",
  "email": "karim@example.com",
  "subject": "প্রশ্ন",
  "message": "আমি একটি বই খুঁজছি।",
  "consent": true
}
```

Stores the message (visible in **Admin → Contact Inbox**) and, if SMTP is
configured, sends a notification email. `consent` must be `true`.

---

## Navigation

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/navigation` | Active navigation tree (with `children`) |
| `GET` | `/navigation/all` 🔒 | Flat list + tree for the manager |
| `POST` | `/navigation` 🔒 | Create an item |
| `PATCH` | `/navigation/:id` 🔒 | Update an item (cannot be its own parent) |
| `DELETE` | `/navigation/:id` 🔒 | Delete an item |

Item body: `{ labelBn, labelEn, url, type, parentId?, order?, isActive?, openInNewTab? }`.

---

## Singletons

Each singleton is a single document with a fixed id. `GET` returns it (creating an
empty record on first access); `PUT` upserts it.

| Method | Path | Document |
| ------ | ---- | -------- |
| `GET` / `PUT` | `/settings` | Site identity, contact details, social meta, theme color |
| `GET` / `PUT` | `/about` | About page heading + body (bilingual) + media |
| `GET` / `PUT` | `/founder-message` | Founder name, designation, message, portrait |
| `GET` / `PUT` | `/mission-vision` | Mission, vision, objectives (bilingual) |

`PUT` requires authentication. See the `*Input` schemas in
[`backend/openapi.json`](../backend/openapi.json) for exact fields.

---

## Statistics

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/statistics` | Homepage counters (`books`, `programs`, `publications`, `achievements`) |
| `GET` | `/program-years` | Distinct published program years, newest first |

Each statistic uses a live database count unless `useManual` is enabled, in which
case the admin-provided `value` is used.

---

## Generic content resources

Every content resource follows the same pattern:

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/{resource}` | public | List (only published/active records) |
| `GET` | `/{resource}/:id` | public | Get one public record |
| `GET` | `/admin/{resource}` | 🔒 | List all (incl. drafts) |
| `POST` | `/admin/{resource}` | 🔒 | Create |
| `GET` | `/admin/{resource}/:id` | 🔒 | Get one |
| `PATCH` | `/admin/{resource}/:id` | 🔒 | Partial update |
| `DELETE` | `/admin/{resource}/:id` | 🔒 | Delete |
| `PATCH` | `/admin/{resource}/:id/publish` | 🔒 | Publish toggle |

**Publish toggle** — body `{ "active": true }` (or omit for `true`) sets the
resource's publish field to `published`/`draft` or its active flag to
`true`/`false`:

| Resources | Publish field |
| --------- | ------------- |
| books, museum, programs, publications, achievements, research, videos, testimonials | `status` (`published` \| `draft`) |
| book-categories, gallery-albums, gallery-images, board-members, links, hero-slides, notices, social-links | `isActive` (boolean) |

Resources without a publish toggle: `museum-categories`, `program-images`,
`statistics`, `contact-messages`.

The endpoint returns the updated record on success.

### Resource reference

Legend: **\*** = required on create. Bilingual fields accept a Bangla and an
English variant (`…Bn` / `…En`). URL fields accept `http(s)://` or an internal
path starting with `/`.

#### Library

**`book-categories`** — filters: `isActive` (bool)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `nameBn` * | string | ≤ 160 |
| `nameEn` | string | |
| `slug` | string | auto-generated from the name if omitted |
| `descriptionBn` / `descriptionEn` | text | |
| `icon` | string | Lucide name or emoji |
| `order` | int | default `0` |
| `isActive` | bool | default `true` |

**`books`** — filters: `categoryId`, `isAvailable` (bool), `status`, `language`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `nameBn` * | string | ≤ 400 |
| `nameEn` | string | |
| `serialNo` | int | |
| `authorBn` / `authorEn` | string | |
| `copies` | int | default `1` |
| `rackNo` | string | |
| `categoryId` | string | FK to `book-categories` |
| `isbn` | string | |
| `publisher` | string | |
| `publicationYear` | int | 1000–2200 |
| `language` | string | default `bn` |
| `description` | text | |
| `coverImage` | url | |
| `keywords` | string | comma separated |
| `isAvailable` | bool | default `true` |
| `status` | `published`\|`draft` | default `published` |

#### Museum & gallery

**`museum-categories`** — filters: none

| Field | Type | Notes |
| ----- | ---- | ----- |
| `nameBn` * | string | |
| `nameEn` | string | |
| `order` | int | default `0` |

**`museum`** — filters: `categoryId`, `status`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `titleBn` * | string | |
| `titleEn` | string | |
| `descriptionBn` / `descriptionEn` | text | |
| `categoryId` | string | FK to `museum-categories` |
| `categoryName` | string | fallback label |
| `imageUrl` / `imageAlt` | url / string | |
| `period` | string | era of the item |
| `order` | int | default `0` |
| `status` | `published`\|`draft` | default `published` |

**`gallery-albums`** — filters: none

| Field | Type | Notes |
| ----- | ---- | ----- |
| `titleBn` * | string | |
| `titleEn` | string | |
| `descriptionBn` / `descriptionEn` | text | |
| `coverImage` | url | |
| `order` | int | default `0` |
| `isActive` | bool | default `true` |

**`gallery-images`** — filters: `albumId`, `isActive` (bool)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `imageUrl` * | string | required |
| `albumId` | string | FK to `gallery-albums` |
| `captionBn` / `captionEn` | string | |
| `altText` | string | |
| `order` | int | default `0` |
| `isActive` | bool | default `true` |

#### Programs, publications & achievements

**`programs`** — filters: `year` (int), `status`, `categoryName`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `titleBn` * | string | |
| `titleEn` | string | |
| `descriptionBn` / `descriptionEn` | text | |
| `programDate` | date | ISO string |
| `year` * | int | 1900–2200 |
| `location` | string | |
| `categoryName` | string | |
| `videoUrl` | url | |
| `reportUrl` | url | |
| `order` | int | default `0` |
| `status` | `published`\|`draft` | default `published` |

**`program-images`** — filters: `programId`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `programId` * | string | FK to `programs` |
| `imageUrl` * | string | |
| `altText` | string | |
| `order` | int | default `0` |

**`publications`** — filters: `status`, `categoryName`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `titleBn` * | string | |
| `titleEn` | string | |
| `descriptionBn` / `descriptionEn` | text | |
| `coverImage` | url | |
| `author` | string | |
| `publishedDate` | date | |
| `categoryName` | string | |
| `fileUrl` / `externalUrl` | url | |
| `order` | int | default `0` |
| `status` | `published`\|`draft` | default `published` |

**`achievements`** — filters: `status`, `categoryName`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `titleBn` * | string | |
| `titleEn` | string | |
| `descriptionBn` / `descriptionEn` | text | |
| `imageUrl` | url | |
| `achievementDate` | date | |
| `categoryName` | string | |
| `issuer` | string | |
| `order` | int | default `0` |
| `status` | `published`\|`draft` | default `published` |

#### Research & videos

**`research`** — filters: `status`, `category`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `titleBn` * | string | |
| `titleEn` | string | |
| `researcher` | string | |
| `abstractBn` / `abstractEn` | text | |
| `researchDate` | date | |
| `category` | string | |
| `imageUrl` / `fileUrl` / `externalUrl` | url | |
| `order` | int | default `0` |
| `status` | `published`\|`draft` | default `published` |

**`videos`** — filters: `category`, `status`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `titleBn` * | string | |
| `titleEn` | string | |
| `descriptionBn` / `descriptionEn` | text | |
| `youtubeUrl` * | string | `youtubeId` + thumbnail are derived automatically |
| `category` | `programs-news`\|`press-media`\|`krishi-news` | default `krishi-news` |
| `publishedAt` | date | |
| `order` | int | default `0` |
| `status` | `published`\|`draft` | default `published` |

#### More section

**`board-members`** — filters: none

| Field | Type | Notes |
| ----- | ---- | ----- |
| `nameBn` * | string | |
| `nameEn` | string | |
| `designationBn` / `designationEn` | string | |
| `bioBn` / `bioEn` | text | |
| `photoUrl` | url | |
| `order` | int | default `0` |
| `isActive` | bool | default `true` |

**`links`** — filters: `category`, `isActive` (bool)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `titleBn` * | string | |
| `titleEn` | string | |
| `url` * | url | must be a valid URL |
| `descriptionBn` / `descriptionEn` | text | |
| `category` | string | |
| `icon` | string | |
| `order` | int | default `0` |
| `isActive` | bool | default `true` |

#### Homepage

**`testimonials`** — filters: `status`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` * | string | |
| `designation` | string | |
| `location` | string | |
| `photoUrl` | url | |
| `messageBn` / `messageEn` | text | |
| `language` | `bn`\|`en` | default `bn` |
| `order` | int | default `0` |
| `status` | `pending`\|`published`\|`rejected` | default `pending` |

**`hero-slides`** — filters: `isActive` (bool)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `headingBn` * | string | |
| `headingEn` | string | |
| `descriptionBn` / `descriptionEn` | text | |
| `buttonTextBn` / `buttonTextEn` | string | |
| `buttonUrl` | url | |
| `isExternal` | bool | default `false` |
| `imageUrl` * | string | |
| `imageAlt` | string | |
| `order` | int | default `0` |
| `isActive` | bool | default `true` |

**`notices`** — filters: `isActive` (bool)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `titleBn` * | string | |
| `titleEn` | string | |
| `contentBn` / `contentEn` | text | |
| `url` | url | |
| `isExternal` | bool | default `false` |
| `priority` | int | higher first |
| `isActive` | bool | default `true` |
| `startDate` / `endDate` | date | |

**`social-links`** — filters: none

| Field | Type | Notes |
| ----- | ---- | ----- |
| `platform` * | string | e.g. `facebook`, `youtube`, `x`, `other` |
| `label` * | string | |
| `url` * | url | |
| `icon` | string | |
| `order` | int | default `0` |
| `isActive` | bool | default `true` |

**`statistics`** — filters: none

| Field | Type | Notes |
| ----- | ---- | ----- |
| `key` * | string | `books`, `programs`, `publications` or `achievements` |
| `labelBn` * / `labelEn` * | string | |
| `value` | int | used when `useManual` is true |
| `useManual` | bool | default `false` |
| `order` | int | default `0` |

#### Engagement

**`contact-messages`** — filters: `status`, `isRead` (bool)

Public `POST /contact` creates these. Admin create is disabled in the UI; the
generic `POST /admin/contact-messages` also exists for completeness.

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` * | string | |
| `email` * | email | |
| `subject` | string | |
| `message` * | string | |
| `consent` * | `true` | required by the public endpoint |

Admin update accepts `{ status?: 'new'|'read'|'archived', isRead?: boolean }`.

---

## Media uploads 🔒

`multipart/form-data` with a `file` field. Images accept
`jpeg, png, webp, gif, svg`; documents accept those plus `pdf`.

| Method | Path | Notes |
| ------ | ---- | ----- |
| `POST` | `/admin/uploads/image` | ≤ `UPLOAD_MAX_MB` (default 8 MB) |
| `POST` | `/admin/uploads/document` | ≤ 3 × `UPLOAD_MAX_MB` |
| `GET` | `/admin/uploads/media` | List assets (`page`, `pageSize`, `folder`) |
| `DELETE` | `/admin/uploads/media/:id` | Delete the record and the file on disk |

Uploads are stored on disk by default and served at `/uploads/...`. Set
`STORAGE_PROVIDER=supabase` with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` to
return public bucket URLs instead.

---

## Books import 🔒

See **[docs/EXCEL-IMPORT.md](EXCEL-IMPORT.md)** for the full workflow.

| Method | Path | Notes |
| ------ | ---- | ----- |
| `GET` | `/admin/books/template` | Download the `.xlsx` template |
| `POST` | `/admin/books/import` | Preview or commit (`multipart/form-data`) |

Query parameters: `commit=true`, `duplicatePolicy=skip|update`,
`createCategories=true`.

---

## Administration

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/admin/dashboard` | Counts + recent messages and audit entries |
| `GET` | `/admin/audit-logs` | Paginated audit log (`page`, `pageSize`, `entity`) |

---

## Examples

**Login and reuse the cookie**

```bash
curl -c cookies.txt -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret123"}'

curl -b cookies.txt "http://localhost:4000/api/v1/admin/books?page=1&pageSize=10&search=ধান"
```

**Create and publish a book**

```bash
curl -b cookies.txt -X POST http://localhost:4000/api/v1/admin/books \
  -H "Content-Type: application/json" \
  -d '{"nameBn":"আধুনিক ধান চাষ","authorBn":"ড. কৃষিবিদ","year":2024,"status":"draft"}'

curl -b cookies.txt -X PATCH http://localhost:4000/api/v1/admin/books/<id>/publish \
  -H "Content-Type: application/json" -d '{"active":true}'
```

**Public list with pagination**

```bash
curl "http://localhost:4000/api/v1/books?page=1&pageSize=12&sort=createdAt&order=desc"
```

**Upload an image**

```bash
curl -b cookies.txt -X POST http://localhost:4000/api/v1/admin/uploads/image \
  -F "file=@cover.jpg"
```

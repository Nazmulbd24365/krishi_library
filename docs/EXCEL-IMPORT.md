# Excel Book Import

Bulk-load the library catalogue from a spreadsheet. The importer supports a safe
**preview → commit** workflow, duplicate handling, automatic category creation and
row-level error reporting.

- UI: **Admin → Library → Books Import** (`/admin/books-import`)
- API: `GET /api/v1/admin/books/template`, `POST /api/v1/admin/books/import`
- Auth: requires `SUPER_ADMIN`, `EDITOR` or `CONTENT_MANAGER`.

---

## 1. Download the template

From the admin page click **Download template**, or:

```bash
curl -b cookies.txt -o book-import-template.xlsx \
  http://localhost:4000/api/v1/admin/books/template
```

The workbook has one `Books` sheet whose header row defines the columns.

---

## 2. Columns

The first row must contain headers. Headers are matched **case-insensitively**
against either the friendly header or the field key, so `Serial Number` and
`serialNo` both work. Columns may appear in any order; unknown columns are
ignored.

| Header | Key | Type | Notes |
| ------ | --- | ---- | ----- |
| Serial Number | `serialNo` | number | Optional catalogue serial |
| Book Name | `nameBn` | text | **Required** (falls back to the English name) |
| Book Name (English) | `nameEn` | text | Optional |
| Author Name | `authorBn` | text | Optional |
| Author Name (English) | `authorEn` | text | Optional |
| Number of Copies | `copies` | number | Default `1` |
| Rack Number | `rackNo` | text | Optional |
| Category | `categoryName` | text | Matched by Bangla name; optionally created |
| ISBN | `isbn` | text | Used for duplicate detection |
| Publisher | `publisher` | text | Optional |
| Publication Year | `publicationYear` | number | 1000–2200 |
| Language | `language` | text | Default `bn` |
| Description | `description` | text | Optional |
| Keywords | `keywords` | text | Comma separated |

A sample row is included in the template — replace it with real data.

### Cell handling

- Blank rows (no Bangla **or** English name) are skipped.
- Formula cells use the **cached result only**; formulas are never evaluated.
- Numbers may contain separators (`1,200`); non-numeric characters are stripped.
- Dates are converted to ISO strings.

---

## 3. Preview vs commit

`POST /admin/books/import` accepts `multipart/form-data` with a `file` field.

| Query param | Default | Effect |
| ----------- | ------- | ------ |
| `commit` | `false` | When `true`, rows are written in a single transaction. Omit/false for a validation-only preview. |
| `duplicatePolicy` | `skip` | `skip` ignores rows matching an existing book; `update` overwrites them. |
| `createCategories` | `false` | When `true`, unknown category names are created automatically. |

**Always preview first**, review the reported errors, fix the file, then commit.

### Response

```json
{
  "success": true,
  "data": {
    "committed": false,
    "duplicatePolicy": "skip",
    "detectedColumns": ["serialNo", "nameBn", "authorBn"],
    "summary": {
      "totalRows": 120,
      "validRows": 118,
      "inserted": 0,
      "updated": 0,
      "skipped": 0,
      "failed": 2
    },
    "errors": [
      { "row": 7, "field": "nameBn", "message": "Required" }
    ],
    "preview": [ { "nameBn": "…", "copies": 3 } ]
  }
}
```

- `preview` contains up to 50 validated rows (empty on commit).
- `errors` contains up to 200 row-level errors; `failed` is the true count.

On commit, `inserted` / `updated` / `skipped` reflect the transaction result, and
an audit-log entry (`action: import`) is written.

---

## 4. Duplicate detection

A row is considered a duplicate when it matches an existing book by:

1. **ISBN** (case-insensitive), or
2. **Bangla name + author** (`nameBn|authorBn`, case-insensitive).

The same rule detects duplicates **within the uploaded file** (those rows are
reported as errors). With `duplicatePolicy=skip` existing matches are counted as
`skipped`; with `update` the existing book is updated in place.

---

## 5. Categories

- Category names are matched against `BookCategory.nameBn` (case-insensitive).
- If no match is found:
  - `createCategories=true` creates a new category (slug generated from the
    name), or
  - the book is imported with no category.
- All categories are resolved **before** the transaction so the commit stays
  consistent.

---

## 6. Error handling & limits

- Validation uses the same rules as the single-book endpoint. Any row that fails
  is reported and skipped; valid rows still import.
- Uploaded file size limit: **20 MB**.
- Accepted types: `.xlsx`
  (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) and
  `.xls` (`application/vnd.ms-excel`). Prefer `.xlsx`.
- The workbook must contain at least one recognizable column, otherwise the
  request fails with `400 No recognizable columns found`.

---

## 7. Command-line example

```bash
# 1. Preview
curl -b cookies.txt -X POST \
  "http://localhost:4000/api/v1/admin/books/import" \
  -F "file=@books.xlsx"

# 2. Commit, updating duplicates and creating missing categories
curl -b cookies.txt -X POST \
  "http://localhost:4000/api/v1/admin/books/import?commit=true&duplicatePolicy=update&createCategories=true" \
  -F "file=@books.xlsx"
```

---

## 8. UI walkthrough

1. Go to **Admin → Books Import**.
2. Download the template and fill it in.
3. Choose the file and the options (commit, duplicate policy, create categories).
4. Run a **preview** and review the summary/errors table.
5. Fix problems, re-run the preview, then **commit**.
6. Open **Admin → Books** to verify the imported catalogue.

> Imports are transactional: on commit either every staged row is written or the
> transaction is rolled back, so a failed commit never leaves a half-imported
> catalogue.

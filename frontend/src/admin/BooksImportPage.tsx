import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { api, API_BASE, ApiError } from '@/lib/api';
import { usePageTitle } from '@/components/PageHeader';
import { Badge, Button, Card, Field, Select } from '@/components/ui';

interface ImportSummary {
  totalRows: number;
  validRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
}

interface ImportResult {
  committed: boolean;
  duplicatePolicy: string;
  detectedColumns: string[];
  summary: ImportSummary;
  errors: { row: number; field: string; message: string }[];
  preview: Record<string, unknown>[];
}

export default function BooksImportPage() {
  usePageTitle('Books Import');
  const [file, setFile] = useState<File | null>(null);
  const [policy, setPolicy] = useState<'skip' | 'update'>('skip');
  const [createCategories, setCreateCategories] = useState(true);
  const [busy, setBusy] = useState<'preview' | 'commit' | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = async (commit: boolean) => {
    if (!file) {
      setError('Choose an .xlsx file first.');
      return;
    }
    setBusy(commit ? 'commit' : 'preview');
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post<ImportResult>('/admin/books/import', form, {
        commit: commit ? 'true' : undefined,
        duplicatePolicy: policy,
        createCategories: String(createCategories),
      });
      setResult(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-farm-900">Books Import</h1>
        <p className="text-sm text-farm-500">Bulk-load the library from an Excel (.xlsx) spreadsheet.</p>
      </div>

      <Card className="p-5">
        <ol className="mb-5 list-decimal space-y-1 pl-5 text-sm text-farm-600">
          <li>
            Download the template:{' '}
            <a href={`${API_BASE}/admin/books/template`} className="inline-flex items-center gap-1 font-medium text-farm-700 underline">
              <Download className="h-3.5 w-3.5" /> book-import-template.xlsx
            </a>
          </li>
          <li>Fill in one book per row (book name in Bangla is required; English optional).</li>
          <li>Upload the file, review the preview, then commit.</li>
        </ol>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Spreadsheet" required>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex w-full items-center gap-2 rounded-xl border border-dashed border-farm-300 px-4 py-3 text-sm text-farm-700 hover:bg-farm-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {file ? file.name : 'Choose .xlsx file'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
                e.target.value = '';
              }}
            />
          </Field>
          <Field label="If a book already exists">
            <Select value={policy} onChange={(e) => setPolicy(e.target.value as 'skip' | 'update')}>
              <option value="skip">Skip duplicates</option>
              <option value="update">Update existing rows</option>
            </Select>
          </Field>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-farm-800">
          <input
            type="checkbox"
            checked={createCategories}
            onChange={(e) => setCreateCategories(e.target.checked)}
            className="h-4 w-4 rounded border-farm-300"
          />
          Create missing book categories automatically
        </label>

        {error && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => run(false)} loading={busy === 'preview'}>
            <Upload className="h-4 w-4" /> Preview
          </Button>
          <Button onClick={() => run(true)} loading={busy === 'commit'}>
            <CheckCircle2 className="h-4 w-4" /> Commit import
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {result.committed ? (
              <Badge tone="farm">Import committed</Badge>
            ) : (
              <Badge tone="gold">Preview only</Badge>
            )}
            <span className="text-sm text-farm-600">
              {result.summary.validRows} valid rows of {result.summary.totalRows}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Inserted', value: result.summary.inserted },
              { label: 'Updated', value: result.summary.updated },
              { label: 'Skipped', value: result.summary.skipped },
              { label: 'Failed', value: result.summary.failed },
              { label: 'Valid', value: result.summary.validRows },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-farm-50 p-3 text-center">
                <p className="font-display text-xl font-bold text-farm-900">{s.value}</p>
                <p className="text-xs text-farm-500">{s.label}</p>
              </div>
            ))}
          </div>

          {result.errors.length > 0 && (
            <div className="mt-5">
              <h2 className="mb-2 flex items-center gap-2 font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4" /> Row errors ({result.errors.length})
              </h2>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-red-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-red-50 text-red-700">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Row</th>
                      <th className="px-3 py-2 font-semibold">Field</th>
                      <th className="px-3 py-2 font-semibold">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-50">
                    {result.errors.map((e, i) => (
                      <tr key={`${e.row}-${e.field}-${i}`}>
                        <td className="px-3 py-2 text-farm-700">{e.row}</td>
                        <td className="px-3 py-2 text-farm-700">{e.field}</td>
                        <td className="px-3 py-2 text-red-700">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.preview.length > 0 && (
            <div className="mt-5">
              <h2 className="mb-2 font-semibold text-farm-900">Preview (first {result.preview.length} rows)</h2>
              <div className="max-h-80 overflow-auto rounded-xl border border-farm-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-farm-50 text-farm-600">
                    <tr>
                      {Object.keys(result.preview[0]).map((k) => (
                        <th key={k} className="whitespace-nowrap px-3 py-2 font-semibold">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-farm-50">
                    {result.preview.map((row, i) => (
                      <tr key={i}>
                        {Object.keys(result.preview[0]).map((k) => (
                          <td key={k} className="whitespace-nowrap px-3 py-2 text-farm-700">
                            {String(row[k] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

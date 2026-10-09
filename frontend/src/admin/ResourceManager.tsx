import { useState } from 'react';
import { Pencil, Plus, Search, Trash2, Power } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useDebounced, useFetch } from '@/lib/useApi';
import { Button, Card, EmptyState, ErrorState, Field, Input, Modal, Pagination, Select, Skeleton, Textarea, cn } from '@/components/ui';
import { ImageUploadField } from './ImageUploadField';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'image'
  | 'file'
  | 'bilingual'
  | 'bilingualTextarea';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string | number; label: string }[];
  /** Populate a select from a public API endpoint (e.g. book categories). */
  optionsFrom?: { path: string; params?: Record<string, unknown>; valueKey?: string; labelKey?: string };
  help?: string;
  wide?: boolean;
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

export interface ResourceConfig<T> {
  resource: string;
  title: string;
  description?: string;
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  defaults?: Record<string, unknown>;
  /** 'status' | 'isActive' - how the publish toggle behaves */
  publish?: 'status' | 'isActive';
  /** Whether creation is allowed (false for read-only inboxes) */
  canCreate?: boolean;
  filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
  pageSize?: number;
}

export type Row = { id: string };

/* --------------------------------------------------------------- AsyncSelect */
function AsyncSelect({
  value,
  onChange,
  optionsFrom,
}: {
  value: string;
  onChange: (value: string) => void;
  optionsFrom: NonNullable<FieldDef['optionsFrom']>;
}) {
  const { data, loading } = useFetch<Row[]>(optionsFrom.path, optionsFrom.params);
  const valueKey = optionsFrom.valueKey ?? 'id';
  const labelKey = optionsFrom.labelKey ?? 'name';
  const items = data ?? [];
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{loading ? 'Loading…' : '—'}</option>
      {items.map((item) => {
        const rec = item as Record<string, unknown>;
        const val = String(rec[valueKey] ?? '');
        return (
          <option key={val} value={val}>
            {String(rec[labelKey] ?? val)}
          </option>
        );
      })}
    </Select>
  );
}

export function ResourceManager<T extends Row>({ config }: { config: ResourceConfig<T> }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const { data, meta, loading, error, refetch } = useFetch<T[]>(`/admin/${config.resource}`, {
    page,
    pageSize: config.pageSize ?? 10,
    search: debounced || undefined,
    ...filterValues,
  });

  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<T | null>(null);

  const items = data ?? [];

  const openCreate = () => {
    setForm({ ...(config.defaults ?? {}) });
    setEditing(null);
    setCreating(true);
    setFormError(null);
  };

  const openEdit = (item: T) => {
    const initial: Record<string, unknown> = { ...item };
    config.fields.forEach((f) => {
      if (f.type === 'date' && initial[f.name]) initial[f.name] = String(initial[f.name]).slice(0, 10);
    });
    setForm(initial);
    setEditing(item);
    setCreating(false);
    setFormError(null);
  };

  const setValue = (name: string, value: unknown) => setForm((f) => ({ ...f, [name]: value }));

  const submit = async () => {
    setSaving(true);
    setFormError(null);
    const payload: Record<string, unknown> = {};
    config.fields.forEach((f) => {
      const names = f.type === 'bilingual' || f.type === 'bilingualTextarea' ? [`${f.name}Bn`, `${f.name}En`] : [f.name];
      names.forEach((n) => {
        let v = form[n];
        if (f.type === 'number' && v === '') v = undefined;
        if (typeof v === 'string' && v.trim() === '') v = f.type === 'checkbox' ? false : v;
        payload[n] = v;
      });
    });
    try {
      if (editing) await api.patch(`/admin/${config.resource}/${editing.id}`, payload);
      else await api.post(`/admin/${config.resource}`, payload);
      setCreating(false);
      setEditing(null);
      refetch();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setFormError(Object.entries(err.details).map(([k, v]) => `${k}: ${v.join(', ')}`).join(' | '));
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    await api.del(`/admin/${config.resource}/${confirmDelete.id}`);
    setConfirmDelete(null);
    refetch();
  };

  const isPublished = (item: T) => {
    const rec = item as Record<string, unknown>;
    return config.publish === 'isActive' ? Boolean(rec.isActive) : rec.status === 'published';
  };

  const togglePublish = async (item: T) => {
    if (!config.publish) return;
    await api.patch(`/admin/${config.resource}/${item.id}/publish`, { active: !isPublished(item) });
    refetch();
  };

  const renderField = (f: FieldDef) => {
    if (f.type === 'bilingual' || f.type === 'bilingualTextarea') {
      const Comp = f.type === 'bilingual' ? Input : Textarea;
      return (
        <div key={f.name} className={cn('grid gap-3 sm:grid-cols-2', f.wide && 'sm:col-span-2')}>
          <Field label={`${f.label} (বাংলা)`} required={f.required}>
            <Comp value={(form[`${f.name}Bn`] as string) ?? ''} onChange={(e) => setValue(`${f.name}Bn`, e.target.value)} />
          </Field>
          <Field label={`${f.label} (English)`}>
            <Comp value={(form[`${f.name}En`] as string) ?? ''} onChange={(e) => setValue(`${f.name}En`, e.target.value)} />
          </Field>
        </div>
      );
    }
    const label = <Field label={f.label} required={f.required} hint={f.help} className={cn(f.wide && 'sm:col-span-2')}>{
      f.type === 'textarea' ? (
        <Textarea value={(form[f.name] as string) ?? ''} onChange={(e) => setValue(f.name, e.target.value)} />
      ) : f.type === 'select' ? (
        f.optionsFrom ? (
          <AsyncSelect
            value={(form[f.name] as string) ?? ''}
            onChange={(v) => setValue(f.name, v)}
            optionsFrom={f.optionsFrom}
          />
        ) : (
          <Select value={(form[f.name] as string) ?? ''} onChange={(e) => setValue(f.name, e.target.value)}>
            <option value="">—</option>
            {(f.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        )
      ) : f.type === 'checkbox' ? (
        <input
          type="checkbox"
          checked={Boolean(form[f.name])}
          onChange={(e) => setValue(f.name, e.target.checked)}
          className="h-4 w-4 rounded border-farm-300"
        />
      ) : f.type === 'image' || f.type === 'file' ? (
        <ImageUploadField
          value={form[f.name] as string}
          onChange={(url) => setValue(f.name, url)}
          accept={f.type === 'file' ? 'application/pdf,image/*' : 'image/*'}
        />
      ) : (
        <Input
          type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
          value={(form[f.name] as string) ?? ''}
          onChange={(e) => setValue(f.name, e.target.value)}
        />
      )
    }</Field>;
    return <div key={f.name}>{label}</div>;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-farm-900">{config.title}</h1>
          {config.description && <p className="text-sm text-farm-500">{config.description}</p>}
        </div>
        {config.canCreate !== false && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-farm-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9" />
        </div>
        {(config.filters ?? []).map((f) => (
          <Select
            key={f.name}
            value={filterValues[f.name] ?? ''}
            onChange={(e) => {
              setFilterValues((v) => ({ ...v, [f.name]: e.target.value }));
              setPage(1);
            }}
            className="w-auto"
          >
            <option value="">{f.label}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading && (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        )}
        {error && <div className="p-4"><ErrorState message={error} onRetry={refetch} /></div>}
        {!loading && !error && items.length === 0 && <div className="p-4"><EmptyState /></div>}
        {!loading && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-farm-50 text-farm-600">
                <tr>
                  {config.columns.map((c) => (
                    <th key={c.key} className="whitespace-nowrap px-4 py-3 font-semibold">{c.label}</th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farm-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-farm-50/50">
                    {config.columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 align-top text-farm-800">
                        {c.render ? c.render(item) : String((item as Record<string, unknown>)[c.key] ?? '—')}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {config.publish && (
                          <button
                            onClick={() => togglePublish(item)}
                            title="Toggle publish"
                            className={cn(
                              'rounded-lg p-2',
                              (isPublished(item))
                                ? 'text-farm-600 hover:bg-farm-50'
                                : 'text-farm-300 hover:bg-farm-50',
                            )}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-farm-600 hover:bg-farm-50" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(item)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination page={page} totalPages={meta?.totalPages ?? 1} onChange={setPage} />

      <Modal
        open={creating || Boolean(editing)}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? `Edit ${config.title}` : `New ${config.title}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={submit} loading={saving}>Save</Button>
          </>
        }
      >
        {formError && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
        <div className="grid gap-4 sm:grid-cols-2">{config.fields.map(renderField)}</div>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Confirm delete"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={doDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-farm-700">This action cannot be undone. Delete this record permanently?</p>
      </Modal>
    </div>
  );
}

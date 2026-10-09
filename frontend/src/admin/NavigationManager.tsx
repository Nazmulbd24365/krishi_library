import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useFetch } from '@/lib/useApi';
import { usePageTitle } from '@/components/PageHeader';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, Select, Skeleton } from '@/components/ui';
import type { NavItem } from '@/types';

interface NavPayload {
  labelBn: string;
  labelEn: string;
  url: string;
  type: 'internal' | 'external';
  parentId: string;
  order: number;
  isActive: boolean;
  openInNewTab: boolean;
}

const emptyForm: NavPayload = {
  labelBn: '',
  labelEn: '',
  url: '/',
  type: 'internal',
  parentId: '',
  order: 0,
  isActive: true,
  openInNewTab: false,
};

export default function NavigationManager() {
  usePageTitle('Navigation');
  const { data, loading, error, refetch } = useFetch<{ flat: NavItem[]; tree: NavItem[] }>('/navigation/all');
  const [editing, setEditing] = useState<NavItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<NavPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NavItem | null>(null);

  const items = data?.flat ?? [];
  const labelOf = (id?: string | null) => {
    const found = items.find((i) => i.id === id);
    return found ? found.labelBn : '—';
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditing(null);
    setCreating(true);
    setFormError(null);
  };

  const openEdit = (item: NavItem) => {
    setForm({
      labelBn: item.labelBn,
      labelEn: item.labelEn,
      url: item.url,
      type: item.type,
      parentId: item.parentId ?? '',
      order: item.order,
      isActive: item.isActive,
      openInNewTab: item.openInNewTab,
    });
    setEditing(item);
    setCreating(false);
    setFormError(null);
  };

  const submit = async () => {
    setSaving(true);
    setFormError(null);
    const payload = { ...form, parentId: form.parentId || null };
    try {
      if (editing) await api.patch(`/navigation/${editing.id}`, payload);
      else await api.post('/navigation', payload);
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
    await api.del(`/navigation/${confirmDelete.id}`);
    setConfirmDelete(null);
    refetch();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-farm-900">Navigation</h1>
          <p className="text-sm text-farm-500">Build the public menu tree. Leave the parent empty for a top-level item.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New item
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {error && (
          <div className="p-4">
            <ErrorState message={error} onRetry={refetch} />
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="p-4">
            <EmptyState description="Add your first menu item to replace the default navigation." />
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-farm-50 text-farm-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Label (বাংলা)</th>
                  <th className="px-4 py-3 font-semibold">Label (English)</th>
                  <th className="px-4 py-3 font-semibold">URL</th>
                  <th className="px-4 py-3 font-semibold">Parent</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farm-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-farm-50/50">
                    <td className="px-4 py-3 text-farm-900">{item.labelBn}</td>
                    <td className="px-4 py-3 text-farm-700">{item.labelEn}</td>
                    <td className="px-4 py-3 text-farm-600">
                      <span className="rounded bg-farm-50 px-1.5 py-0.5 text-xs">{item.url}</span>
                    </td>
                    <td className="px-4 py-3 text-farm-600">{item.parentId ? labelOf(item.parentId) : '—'}</td>
                    <td className="px-4 py-3 text-farm-600">{item.order}</td>
                    <td className="px-4 py-3">
                      {item.isActive ? <Badge tone="farm">Active</Badge> : <Badge tone="gray">Hidden</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-farm-600 hover:bg-farm-50" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(item)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
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

      <Modal
        open={creating || Boolean(editing)}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? 'Edit navigation item' : 'New navigation item'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        {formError && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Label (বাংলা)" required>
            <Input value={form.labelBn} onChange={(e) => setForm({ ...form, labelBn: e.target.value })} />
          </Field>
          <Field label="Label (English)" required>
            <Input value={form.labelEn} onChange={(e) => setForm({ ...form, labelEn: e.target.value })} />
          </Field>
          <Field label="URL" required>
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="/library" />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NavPayload['type'] })}>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </Select>
          </Field>
          <Field label="Parent">
            <Select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">Top level</option>
              {items
                .filter((i) => i.id !== editing?.id)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.labelBn}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Sort order">
            <Input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-farm-800">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-farm-300"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-farm-800">
            <input
              type="checkbox"
              checked={form.openInNewTab}
              onChange={(e) => setForm({ ...form, openInNewTab: e.target.checked })}
              className="h-4 w-4 rounded border-farm-300"
            />
            Open in new tab
          </label>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Confirm delete"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-farm-700">
          Deleting a parent item will also remove its children. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

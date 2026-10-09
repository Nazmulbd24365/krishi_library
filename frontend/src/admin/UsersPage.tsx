import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useFetch } from '@/lib/useApi';
import { usePageTitle } from '@/components/PageHeader';
import { Badge, Button, Card, ErrorState, Field, Input, Modal, Select, Skeleton } from '@/components/ui';
import { useAdminSession } from './AdminLayout';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super admin' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'CONTENT_MANAGER', label: 'Content manager' },
];

interface UserForm {
  name: string;
  email: string;
  role: string;
  password: string;
  isActive: boolean;
}

const emptyForm: UserForm = { name: '', email: '', role: 'CONTENT_MANAGER', password: '', isActive: true };

export default function UsersPage() {
  usePageTitle('Users');
  const session = useAdminSession();
  const isSuper = session?.role === 'SUPER_ADMIN';
  const { data, loading, error, refetch } = useFetch<UserRow[]>(isSuper ? '/auth/users' : null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  const users = data ?? [];

  if (!isSuper) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold text-farm-900">Users</h1>
        <Card className="p-6 text-sm text-farm-600">
          Only a super administrator can manage admin users.
        </Card>
      </div>
    );
  }

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditing(null);
    setCreating(true);
    setFormError(null);
  };

  const openEdit = (user: UserRow) => {
    setForm({ name: user.name, email: user.email, role: user.role, password: '', isActive: user.isActive });
    setEditing(user);
    setCreating(false);
    setFormError(null);
  };

  const submit = async () => {
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        const payload: Record<string, unknown> = { name: form.name, role: form.role, isActive: form.isActive };
        if (form.password) payload.password = form.password;
        await api.patch(`/auth/users/${editing.id}`, payload);
      } else {
        await api.post('/auth/users', {
          name: form.name,
          email: form.email,
          role: form.role,
          password: form.password,
        });
      }
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
    await api.del(`/auth/users/${confirmDelete.id}`);
    setConfirmDelete(null);
    refetch();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-farm-900">Users</h1>
          <p className="text-sm text-farm-500">Manage who can sign in to the admin dashboard.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New user
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {error && (
          <div className="p-4">
            <ErrorState message={error} onRetry={refetch} />
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-farm-50 text-farm-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last login</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farm-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-farm-50/50">
                    <td className="px-4 py-3 font-medium text-farm-900">{user.name}</td>
                    <td className="px-4 py-3 text-farm-600">{user.email}</td>
                    <td className="px-4 py-3 text-farm-700">{user.role.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      {user.isActive ? <Badge tone="farm">Active</Badge> : <Badge tone="red">Disabled</Badge>}
                    </td>
                    <td className="px-4 py-3 text-farm-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(user)} className="rounded-lg p-2 text-farm-600 hover:bg-farm-50" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {user.id !== session?.id && (
                          <button
                            onClick={() => setConfirmDelete(user)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
        title={editing ? 'Edit user' : 'New user'}
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
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={Boolean(editing)}
            />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={editing ? 'New password (optional)' : 'Password'} hint="At least 8 characters">
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
            />
          </Field>
          {editing && (
            <label className="flex items-center gap-2 text-sm text-farm-800">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-farm-300"
              />
              Active
            </label>
          )}
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
        <p className="text-sm text-farm-700">Delete this admin user permanently?</p>
      </Modal>
    </div>
  );
}

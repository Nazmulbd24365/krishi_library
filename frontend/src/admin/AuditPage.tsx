import { useState } from 'react';
import { Search } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { usePageTitle } from '@/components/PageHeader';
import { Badge, Button, Card, EmptyState, ErrorState, Input, Pagination, Skeleton } from '@/components/ui';

interface AuditRow {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  ip?: string | null;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

const ACTION_TONES: Record<string, 'farm' | 'gold' | 'gray' | 'red' | 'blue'> = {
  create: 'farm',
  update: 'blue',
  delete: 'red',
  publish: 'gold',
  unpublish: 'gray',
  login: 'gray',
  upload: 'blue',
  import: 'gold',
};

export default function AuditPage() {
  usePageTitle('Audit Log');
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [entityInput, setEntityInput] = useState('');
  const { data, meta, loading, error, refetch } = useFetch<AuditRow[]>('/admin/audit-logs', {
    page,
    pageSize: 20,
    entity: entity || undefined,
  });

  const items = data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-farm-900">Audit Log</h1>
        <p className="text-sm text-farm-500">Every create, update, delete and publish action is recorded here.</p>
      </div>

      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setEntity(entityInput.trim());
        }}
      >
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-farm-400" />
          <Input
            value={entityInput}
            onChange={(e) => setEntityInput(e.target.value)}
            placeholder="Filter by entity (e.g. Book)…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Filter
        </Button>
        {entity && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEntityInput('');
              setEntity('');
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      <Card className="overflow-hidden">
        {loading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
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
            <EmptyState title="No activity found" />
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-farm-50 text-farm-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farm-50">
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-farm-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-farm-600">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-farm-800">{row.user?.name ?? 'System'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={ACTION_TONES[row.action] ?? 'gray'}>{row.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-farm-700">{row.entity}</td>
                    <td className="px-4 py-3 text-farm-500">{row.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination page={page} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
    </div>
  );
}

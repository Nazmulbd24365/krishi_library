import { useRef, useState } from 'react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useFetch } from '@/lib/useApi';
import { usePageTitle } from '@/components/PageHeader';
import { Button, Card, EmptyState, ErrorState, Modal, Pagination, Select, Skeleton } from '@/components/ui';

interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  folder: string;
  createdAt: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  usePageTitle('Media Library');
  const [page, setPage] = useState(1);
  const [folder, setFolder] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MediaAsset | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, meta, loading, error: loadError, refetch } = useFetch<MediaAsset[]>('/admin/uploads/media', {
    page,
    pageSize: 24,
    folder: folder || undefined,
  });

  const items = data ?? [];

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const endpoint = file.type === 'application/pdf' ? '/admin/uploads/document' : '/admin/uploads/image';
      await api.post(endpoint, form);
      setPage(1);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    await api.del(`/admin/uploads/media/${confirmDelete.id}`);
    setConfirmDelete(null);
    refetch();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-farm-900">Media Library</h1>
          <p className="text-sm text-farm-500">Images and documents uploaded through the dashboard.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={folder} onChange={(e) => { setFolder(e.target.value); setPage(1); }} className="w-auto">
            <option value="">All folders</option>
            <option value="images">Images</option>
            <option value="documents">Documents</option>
          </Select>
          <Button onClick={() => inputRef.current?.click()} loading={uploading}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}
      {loadError && <ErrorState message={loadError} onRetry={refetch} />}
      {!loading && !loadError && items.length === 0 && <EmptyState description="No media uploaded yet." />}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((asset) => {
            const isImage = asset.mimeType.startsWith('image/');
            return (
              <Card key={asset.id} className="group overflow-hidden">
                <div className="flex h-40 items-center justify-center bg-farm-50">
                  {isImage ? (
                    <img src={asset.url} alt={asset.originalName} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <FileText className="h-10 w-10 text-farm-400" />
                  )}
                </div>
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-farm-900" title={asset.originalName}>
                      {asset.originalName}
                    </p>
                    <p className="text-xs text-farm-500">
                      {formatSize(asset.size)} · {asset.folder}
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(asset)}
                    className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={meta?.totalPages ?? 1} onChange={setPage} />

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete media"
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
          This permanently removes the file from the server. Content referencing it will show a broken image.
        </p>
      </Modal>

      {uploading && (
        <p className="flex items-center gap-2 text-sm text-farm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
        </p>
      )}
    </div>
  );
}

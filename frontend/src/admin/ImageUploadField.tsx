import { useRef, useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Input } from '@/components/ui';

/** Image upload field that stores an uploaded file and returns its public URL. */
export function ImageUploadField({
  value,
  onChange,
  accept = 'image/*',
  label = 'Upload',
}: {
  value?: string | null;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const endpoint = accept.includes('pdf') ? '/admin/uploads/document' : '/admin/uploads/image';
      const res = await api.post<{ url: string }>(endpoint, form);
      onChange(res.data.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            {accept.includes('pdf') ? (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-farm-600 underline">
                {value.split('/').pop()}
              </a>
            ) : (
              <img src={value} alt="" className="h-16 w-16 rounded-lg border border-farm-100 object-cover" />
            )}
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -right-2 -top-2 rounded-full bg-red-600 p-0.5 text-white"
              aria-label="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-farm-200 px-3 py-2 text-sm text-farm-700 hover:bg-farm-50 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {label}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
      </div>
      <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="…or paste a URL" />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

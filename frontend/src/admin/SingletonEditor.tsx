import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useFetch } from '@/lib/useApi';
import { usePageTitle } from '@/components/PageHeader';
import { Button, Card, EmptyState, ErrorState, Field, Input, Skeleton, Textarea, cn } from '@/components/ui';
import { ImageUploadField } from './ImageUploadField';

type SFieldType = 'text' | 'textarea' | 'bilingual' | 'bilingualTextarea' | 'image' | 'file';

export interface SingletonField {
  name: string;
  label: string;
  type: SFieldType;
  required?: boolean;
  wide?: boolean;
  help?: string;
}

export interface SingletonDef {
  title: string;
  description?: string;
  endpoint: string;
  fields: SingletonField[];
}

export const SINGLETON_DEFS: Record<string, SingletonDef> = {
  settings: {
    title: 'Site Settings',
    description: 'Brand, contact details and SEO defaults used across the public site.',
    endpoint: '/settings',
    fields: [
      { name: 'siteNameBn', label: 'Site name (বাংলা)', type: 'text', required: true },
      { name: 'siteNameEn', label: 'Site name (English)', type: 'text', required: true },
      { name: 'shortNameBn', label: 'Short name (বাংলা)', type: 'text' },
      { name: 'shortNameEn', label: 'Short name (English)', type: 'text' },
      { name: 'taglineBn', label: 'Tagline (বাংলা)', type: 'text' },
      { name: 'taglineEn', label: 'Tagline (English)', type: 'text' },
      { name: 'logoUrl', label: 'Logo', type: 'image' },
      { name: 'faviconUrl', label: 'Favicon', type: 'image' },
      { name: 'primaryColor', label: 'Primary colour', type: 'text', help: 'Hex value, e.g. #1f5132' },
      { name: 'footerAbout', label: 'Footer about', type: 'bilingualTextarea', wide: true },
      { name: 'addressBn', label: 'Address (বাংলা)', type: 'text' },
      { name: 'addressEn', label: 'Address (English)', type: 'text' },
      { name: 'phone1', label: 'Phone 1', type: 'text' },
      { name: 'phone2', label: 'Phone 2', type: 'text' },
      { name: 'email1', label: 'Email 1', type: 'text' },
      { name: 'email2', label: 'Email 2', type: 'text' },
      { name: 'openingHoursBn', label: 'Opening hours (বাংলা)', type: 'text' },
      { name: 'openingHoursEn', label: 'Opening hours (English)', type: 'text' },
      { name: 'mapEmbedUrl', label: 'Map embed URL', type: 'text', wide: true },
      { name: 'metaTitleBn', label: 'Meta title (বাংলা)', type: 'text' },
      { name: 'metaTitleEn', label: 'Meta title (English)', type: 'text' },
      { name: 'metaDescription', label: 'Meta description', type: 'bilingualTextarea', wide: true },
      { name: 'metaKeywords', label: 'Meta keywords', type: 'text', wide: true },
    ],
  },
  about: {
    title: 'About Content',
    description: 'The main "About Us" section shown on the homepage and the about page.',
    endpoint: '/about',
    fields: [
      { name: 'headingBn', label: 'Heading (বাংলা)', type: 'text', required: true },
      { name: 'headingEn', label: 'Heading (English)', type: 'text' },
      { name: 'imageUrl', label: 'Image', type: 'image' },
      { name: 'youtubeUrl', label: 'YouTube URL', type: 'text' },
      { name: 'excerpt', label: 'Excerpt', type: 'bilingualTextarea', wide: true },
      { name: 'content', label: 'Content', type: 'bilingualTextarea', wide: true },
    ],
  },
  'founder-message': {
    title: 'Founder Message',
    endpoint: '/founder-message',
    fields: [
      { name: 'nameBn', label: 'Name (বাংলা)', type: 'text', required: true },
      { name: 'nameEn', label: 'Name (English)', type: 'text' },
      { name: 'designationBn', label: 'Designation (বাংলা)', type: 'text' },
      { name: 'designationEn', label: 'Designation (English)', type: 'text' },
      { name: 'portraitUrl', label: 'Portrait', type: 'image' },
      { name: 'readMoreUrl', label: 'Read more URL', type: 'text' },
      { name: 'message', label: 'Message', type: 'bilingualTextarea', wide: true },
    ],
  },
  'mission-vision': {
    title: 'Mission & Vision',
    endpoint: '/mission-vision',
    fields: [
      { name: 'mission', label: 'Mission', type: 'bilingualTextarea', wide: true },
      { name: 'vision', label: 'Vision', type: 'bilingualTextarea', wide: true },
      { name: 'objectives', label: 'Objectives', type: 'bilingualTextarea', wide: true },
    ],
  },
};

export function SingletonEditor({ def }: { def: SingletonDef }) {
  const { data, loading, error, refetch } = useFetch<Record<string, unknown>>(def.endpoint);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm({ ...data });
  }, [data]);

  const setValue = (name: string, value: unknown) => setForm((f) => ({ ...f, [name]: value }));

  const save = async () => {
    setSaving(true);
    setNotice(null);
    setFormError(null);
    const payload: Record<string, unknown> = {};
    def.fields.forEach((f) => {
      const names = f.type === 'bilingual' || f.type === 'bilingualTextarea' ? [`${f.name}Bn`, `${f.name}En`] : [f.name];
      names.forEach((n) => {
        let v = form[n];
        if (typeof v === 'string' && v.trim() === '') v = '';
        payload[n] = v;
      });
    });
    try {
      await api.put(def.endpoint, payload);
      setNotice('Saved successfully.');
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

  const renderField = (f: SingletonField) => {
    if (f.type === 'bilingual' || f.type === 'bilingualTextarea') {
      const Comp = f.type === 'bilingual' ? Input : Textarea;
      return (
        <div key={f.name} className={cn('grid gap-3 sm:col-span-2 sm:grid-cols-2')}>
          <Field label={`${f.label} (বাংলা)`}>
            <Comp value={(form[`${f.name}Bn`] as string) ?? ''} onChange={(e) => setValue(`${f.name}Bn`, e.target.value)} />
          </Field>
          <Field label={`${f.label} (English)`}>
            <Comp value={(form[`${f.name}En`] as string) ?? ''} onChange={(e) => setValue(`${f.name}En`, e.target.value)} />
          </Field>
        </div>
      );
    }
    return (
      <Field key={f.name} label={f.label} required={f.required} hint={f.help} className={cn(f.wide && 'sm:col-span-2')}>
        {f.type === 'textarea' ? (
          <Textarea value={(form[f.name] as string) ?? ''} onChange={(e) => setValue(f.name, e.target.value)} />
        ) : f.type === 'image' || f.type === 'file' ? (
          <ImageUploadField
            value={form[f.name] as string}
            onChange={(url) => setValue(f.name, url)}
            accept={f.type === 'file' ? 'application/pdf,image/*' : 'image/*'}
          />
        ) : (
          <Input value={(form[f.name] as string) ?? ''} onChange={(e) => setValue(f.name, e.target.value)} />
        )}
      </Field>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-farm-900">{def.title}</h1>
          {def.description && <p className="text-sm text-farm-500">{def.description}</p>}
        </div>
        <Button onClick={save} loading={saving}>
          <Save className="h-4 w-4" /> Save changes
        </Button>
      </div>

      {notice && <div className="rounded-xl bg-farm-50 px-4 py-3 text-sm text-farm-800">{notice}</div>}

      {loading && <Skeleton className="h-72" />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && (
        <Card className="p-5">
          {formError && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <div className="grid gap-4 sm:grid-cols-2">{def.fields.map(renderField)}</div>
        </Card>
      )}
    </div>
  );
}

export default function SingletonPage() {
  const { key = '' } = useParams();
  const def = SINGLETON_DEFS[key];
  usePageTitle(def?.title ?? 'Admin');
  if (!def) return <EmptyState title="Unknown page" description="This singleton page does not exist." />;
  return <SingletonEditor def={def} />;
}

import { useState } from 'react';
import { Search, Landmark } from 'lucide-react';
import { useCollection, useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { MuseumItem } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { Badge, EmptyState, ErrorState, Input, Modal, Pagination, Skeleton, SmartImage } from '@/components/ui';
import { Lightbox } from '@/components/media';

export default function MuseumPage() {
  const { t, pick } = useI18n();
  usePageTitle('জাদুঘর | Museum');
  const { data: categories } = useFetch<{ id: string; nameBn: string; nameEn?: string }[]>('/museum-categories');
  const [categoryId, setCategoryId] = useState('');
  const { items, meta, loading, error, refetch, page, setPage, search, setSearch } = useCollection<MuseumItem>('museum', {
    pageSize: 12,
    filters: categoryId ? { categoryId } : {},
  });
  const [selected, setSelected] = useState<MuseumItem | null>(null);
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      <PageHeader eyebrow={t('nav.museum')} title={t('museum.title')} subtitle={t('museum.subtitle')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-farm-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('common.search')} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryId('')}
              className={`rounded-full px-3 py-1.5 text-sm ${!categoryId ? 'bg-farm-700 text-white' : 'bg-white text-farm-700'}`}
            >
              {t('common.all')}
            </button>
            {(categories ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${categoryId === c.id ? 'bg-farm-700 text-white' : 'bg-white text-farm-700'}`}
              >
                {pick(c.nameBn, c.nameEn)}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <section className="section">
        <div className="shell">
          {loading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          )}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && items.length === 0 && <EmptyState icon={<Landmark className="h-10 w-10" />} />}
          {!loading && items.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <button key={m.id} onClick={() => setSelected(m)} className="group card-surface overflow-hidden text-left">
                  <SmartImage src={m.imageUrl} alt={m.imageAlt ?? pick(m.titleBn, m.titleEn)} className="h-52 w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="p-4">
                    <h3 className="font-display font-bold text-farm-900">{pick(m.titleBn, m.titleEn)}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(m.categoryName || m.category) && (
                        <Badge tone="gold">{m.categoryName || pick(m.category?.nameBn, m.category?.nameEn)}</Badge>
                      )}
                      {m.period && <Badge tone="gray">{m.period}</Badge>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
        </div>
      </section>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? pick(selected.titleBn, selected.titleEn) : ''} size="lg">
        {selected && (
          <div className="space-y-4">
            <SmartImage
              src={selected.imageUrl}
              alt={selected.imageAlt ?? ''}
              className="max-h-80 w-full cursor-zoom-in rounded-xl object-cover"
              onClick={() => selected.imageUrl && setLightbox(true)}
            />
            <p className="prose-bn text-farm-700">{pick(selected.descriptionBn, selected.descriptionEn)}</p>
            {selected.period && <p className="text-sm text-farm-500">{selected.period}</p>}
          </div>
        )}
      </Modal>

      <Lightbox
        images={selected?.imageUrl ? [{ src: selected.imageUrl, alt: selected.imageAlt ?? '' }] : []}
        index={0}
        open={lightbox}
        onClose={() => setLightbox(false)}
        onIndexChange={() => {}}
      />
    </>
  );
}

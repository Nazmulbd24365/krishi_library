import { useState } from 'react';
import { Images } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { GalleryAlbum, GalleryImage } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { Badge, EmptyState, ErrorState, Skeleton, SmartImage } from '@/components/ui';
import { Lightbox } from '@/components/media';
import { ShareButton } from '@/components/ShareButton';

export default function GalleryPage() {
  const { t, pick } = useI18n();
  usePageTitle('গ্যালারি | Gallery');
  const { data: albums, loading, error, refetch } = useFetch<GalleryAlbum[]>('/gallery-albums', { pageSize: 50 });
  const [albumId, setAlbumId] = useState<string | null>(null);
  const { data: images } = useFetch<GalleryImage[]>('/gallery-images', { pageSize: 100, albumId: albumId ?? undefined });

  const activeAlbum = albums?.find((a) => a.id === albumId);
  const pool: GalleryImage[] = images && images.length ? images : (albums ?? []).flatMap((a) => a.images ?? []);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxImages = pool.map((i) => ({ src: i.imageUrl, alt: i.altText ?? '', caption: pick(i.captionBn, i.captionEn) }));

  return (
    <>
      <PageHeader eyebrow={t('nav.gallery')} title={t('gallery.title')} subtitle={t('gallery.subtitle')}>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAlbumId(null)}
            className={`rounded-full px-4 py-1.5 text-sm ${!albumId ? 'bg-farm-700 text-white' : 'bg-white text-farm-700'}`}
          >
            {t('common.all')}
          </button>
          {(albums ?? []).map((a) => (
            <button
              key={a.id}
              onClick={() => setAlbumId(a.id)}
              className={`rounded-full px-4 py-1.5 text-sm ${albumId === a.id ? 'bg-farm-700 text-white' : 'bg-white text-farm-700'}`}
            >
              {pick(a.titleBn, a.titleEn)}
            </button>
          ))}
        </div>
      </PageHeader>

      <section className="section">
        <div className="shell">
          {activeAlbum && (
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-farm-900">{pick(activeAlbum.titleBn, activeAlbum.titleEn)}</h2>
              <p className="text-sm text-farm-600">{pick(activeAlbum.descriptionBn, activeAlbum.descriptionEn)}</p>
            </div>
          )}
          {loading && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
            </div>
          )}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && pool.length === 0 && <EmptyState icon={<Images className="h-10 w-10" />} />}
          {!loading && pool.length > 0 && (
            <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
              {pool.map((img, i) => (
                <div key={img.id} className="group relative break-inside-avoid">
                  <button
                    onClick={() => setLightboxIndex(i)}
                    className="block w-full overflow-hidden rounded-xl"
                    aria-label={img.altText ?? pick(img.captionBn, img.captionEn) ?? t('gallery.title')}
                  >
                    <SmartImage
                      src={img.imageUrl}
                      alt={img.altText ?? pick(img.captionBn, img.captionEn)}
                      className="w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    {(img.captionBn || img.captionEn) && (
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-farm-950/80 to-transparent p-3 text-left text-xs text-white opacity-0 transition group-hover:opacity-100">
                        {pick(img.captionBn, img.captionEn)}
                      </span>
                    )}
                  </button>
                  <div className="absolute right-2 top-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                    <ShareButton
                      size="icon"
                      variant="solid"
                      align="right"
                      title={pick(img.captionBn, img.captionEn) || t('gallery.title')}
                      description={img.altText || t('gallery.subtitle')}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && <Badge className="mt-6" tone="gray">{pool.length} images</Badge>}
        </div>
      </section>

      <Lightbox
        images={lightboxImages}
        index={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
}

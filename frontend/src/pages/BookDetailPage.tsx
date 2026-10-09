import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Book } from '@/types';
import { usePageTitle } from '@/components/PageHeader';
import { Badge, Card, ErrorState, Skeleton, SmartImage } from '@/components/ui';

export default function BookDetailPage() {
  const { id } = useParams();
  const { t, pick } = useI18n();
  const { data: book, loading, error, refetch } = useFetch<Book>(id ? `/books/${id}` : null);
  usePageTitle(pick(book?.nameBn, book?.nameEn) || t('library.bookDetail'));

  const rows: [string, string | number | undefined | null][] = book
    ? [
        [t('common.author'), pick(book.authorBn, book.authorEn)],
        [t('library.isbn'), book.isbn],
        [t('library.publisher'), book.publisher],
        [t('library.pubYear'), book.publicationYear],
        [t('library.language'), book.language === 'bn' ? 'বাংলা' : book.language],
        [t('common.copies'), book.copies],
        [t('common.rack'), book.rackNo],
      ]
    : [];

  return (
    <section className="section">
      <div className="shell">
        <Link to="/library" className="mb-6 inline-flex items-center gap-2 text-sm text-farm-600 hover:text-farm-800">
          <ArrowLeft className="h-4 w-4" /> {t('nav.library')}
        </Link>
        {loading && <Skeleton className="h-72" />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && book && (
          <div className="grid gap-8 md:grid-cols-[280px_1fr]">
            <SmartImage
              src={book.coverImage}
              alt={pick(book.nameBn, book.nameEn)}
              fallbackLabel={t('library.bookDetail')}
              className="h-80 w-full rounded-2xl object-cover shadow-soft"
            />
            <Card className="p-6">
              <h1 className="font-display text-2xl font-bold text-farm-900">{pick(book.nameBn, book.nameEn)}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {book.category && <Badge tone="gold">{pick(book.category.nameBn, book.category.nameEn)}</Badge>}
                <Badge tone={book.isAvailable ? 'farm' : 'red'}>
                  {book.isAvailable ? t('library.available') : t('library.unavailable')}
                </Badge>
              </div>
              <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {rows.map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-farm-50 pb-2 text-sm">
                    <dt className="text-farm-500">{label}</dt>
                    <dd className="font-medium text-farm-800">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
              {book.description && <p className="prose-bn mt-6 text-farm-700">{book.description}</p>}
              {book.keywords && (
                <p className="mt-4 text-xs text-farm-400">
                  {book.keywords.split(',').map((k) => `#${k.trim()}`).join(' ')}
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}

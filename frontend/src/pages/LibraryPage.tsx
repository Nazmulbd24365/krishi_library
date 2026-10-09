import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { useCollection, useFetch } from '@/lib/useApi';
import { useI18n } from '@/i18n';
import type { Book, BookCategory } from '@/types';
import { PageHeader, usePageTitle } from '@/components/PageHeader';
import { Badge, EmptyState, ErrorState, Input, Pagination, Skeleton } from '@/components/ui';

export default function LibraryPage() {
  const { t, pick, isBn } = useI18n();
  usePageTitle('পাঠাগার | Library');
  const { data: categories } = useFetch<BookCategory[]>('/book-categories', { pageSize: 100 });
  const [categoryId, setCategoryId] = useState<string>('');
  const { items, meta, loading, error, refetch, page, setPage, search, setSearch } = useCollection<Book>('books', {
    pageSize: 12,
    filters: categoryId ? { categoryId } : {},
    sort: 'serialNo',
    order: 'asc',
  });

  return (
    <>
      <PageHeader eyebrow={t('nav.library')} title={t('library.title')} subtitle={t('library.subtitle')} />
      <section className="section">
        <div className="shell">
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            {/* Categories */}
            <aside>
              <h2 className="mb-3 font-display font-bold text-farm-900">{t('library.categories')}</h2>
              <div className="flex flex-wrap gap-2 lg:flex-col">
                <button
                  onClick={() => setCategoryId('')}
                  className={`rounded-xl border px-4 py-2 text-left text-sm transition ${
                    !categoryId ? 'border-farm-600 bg-farm-700 text-white' : 'border-farm-200 bg-white text-farm-800 hover:bg-farm-50'
                  }`}
                >
                  {t('library.allBooks')}
                </button>
                {(categories ?? []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`rounded-xl border px-4 py-2 text-left text-sm transition ${
                      categoryId === c.id ? 'border-farm-600 bg-farm-700 text-white' : 'border-farm-200 bg-white text-farm-800 hover:bg-farm-50'
                    }`}
                  >
                    {pick(c.nameBn, c.nameEn)}
                  </button>
                ))}
              </div>
            </aside>

            {/* Books */}
            <div>
              <div className="relative mb-5 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-farm-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('library.search')}
                  className="pl-9"
                  aria-label={t('library.search')}
                />
              </div>

              {loading && (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              )}
              {error && <ErrorState message={error} onRetry={refetch} />}
              {!loading && !error && items.length === 0 && <EmptyState title={t('common.empty')} icon={<BookOpen className="h-10 w-10" />} />}

              {!loading && items.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-farm-100 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-farm-50 text-farm-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">{t('common.serial')}</th>
                        <th className="px-4 py-3 font-semibold">{isBn ? 'বইয়ের নাম' : 'Book Name'}</th>
                        <th className="hidden px-4 py-3 font-semibold sm:table-cell">{t('common.author')}</th>
                        <th className="px-4 py-3 font-semibold">{t('common.copies')}</th>
                        <th className="hidden px-4 py-3 font-semibold md:table-cell">{t('common.rack')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-farm-50">
                      {items.map((b) => (
                        <tr key={b.id} className="transition hover:bg-farm-50/60">
                          <td className="px-4 py-3 text-farm-500">{b.serialNo ?? '—'}</td>
                          <td className="px-4 py-3">
                            <Link to={`/library/${b.id}`} className="font-medium text-farm-900 hover:text-farm-600">
                              {pick(b.nameBn, b.nameEn)}
                            </Link>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              {b.category && <Badge tone="gold">{pick(b.category.nameBn, b.category.nameEn)}</Badge>}
                              {!b.isAvailable && <Badge tone="red">{t('library.unavailable')}</Badge>}
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-farm-600 sm:table-cell">{pick(b.authorBn, b.authorEn) || '—'}</td>
                          <td className="px-4 py-3 text-farm-700">{b.copies}</td>
                          <td className="hidden px-4 py-3 text-farm-600 md:table-cell">{b.rackNo ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination
                page={page}
                totalPages={meta?.totalPages ?? 1}
                onChange={setPage}
                labels={{ previous: t('common.previous'), next: t('common.next'), page: t('common.page'), of: t('common.of') }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

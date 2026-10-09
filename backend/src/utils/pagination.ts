export interface ListQuery {
  page: number;
  pageSize: number;
  search: string;
  sort: string;
  order: 'asc' | 'desc';
}

export function parseListQuery(query: Record<string, unknown>): ListQuery {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10));
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const sort = typeof query.sort === 'string' && query.sort ? query.sort : 'createdAt';
  const order = query.order === 'asc' ? 'asc' : 'desc';
  return { page, pageSize, search, sort, order };
}

export function skipTake(q: ListQuery) {
  return { skip: (q.page - 1) * q.pageSize, take: q.pageSize };
}

export function buildMeta(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

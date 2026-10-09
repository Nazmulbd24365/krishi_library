import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, type ApiMeta } from './api';

export interface AsyncState<T> {
  data: T | null;
  meta?: ApiMeta;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setData: (data: T) => void;
}

/** Fetch a GET endpoint with loading / error state. */
export function useFetch<T>(path: string | null, params?: Record<string, unknown>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const key = JSON.stringify(params ?? {});

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<T>(path, params)
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key, nonce]);

  return { data, meta, loading, error, refetch, setData };
}

/** Debounce a rapidly changing value (e.g. a search box). */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Simple authenticated session hook backed by /auth/me. */
export function useSession() {
  const state = useFetch<{ id: string; name: string; email: string; role: string } | null>('/auth/me');
  return {
    user: state.data,
    loading: state.loading,
    error: state.error,
    refetch: state.refetch,
  };
}

/** Interval helper that pauses when the document is hidden (saves work). */
export function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/** Paginated + searchable collection hook for the generic CRUD resources. */
export function useCollection<T>(
  resource: string,
  opts?: { pageSize?: number; sort?: string; order?: 'asc' | 'desc'; filters?: Record<string, unknown> },
) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const filtersKey = JSON.stringify(opts?.filters ?? {});
  const state = useFetch<T[]>(`/${resource}`, {
    page,
    pageSize: opts?.pageSize ?? 12,
    search: debounced || undefined,
    sort: opts?.sort,
    order: opts?.order,
    ...(opts?.filters ?? {}),
  });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, filtersKey]);

  return {
    ...state,
    items: state.data ?? [],
    page,
    setPage,
    search,
    setSearch,
  };
}

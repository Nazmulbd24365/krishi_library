const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1';

/** Absolute-ish base path of the API, useful for direct download links. */
export const API_BASE = BASE;

export interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;
  constructor(status: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  meta?: ApiMeta;
  message?: string;
  details?: Record<string, string[]>;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<{ data: T; meta?: ApiMeta }> {
  const isForm = init.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers ?? {}),
    },
    ...init,
  });

  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    json = null;
  }

  if (!res.ok || !json || json.success === false) {
    throw new ApiError(res.status, json?.message ?? `Request failed (${res.status})`, json?.details);
  }
  return { data: json.data as T, meta: json.meta };
}

function qs(params?: Record<string, unknown>): string {
  if (!params) return '';
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!usable.length) return '';
  return '?' + usable.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>) => request<T>(`${path}${qs(params)}`),
  post: <T>(path: string, body?: unknown, params?: Record<string, unknown>) =>
    request<T>(`${path}${qs(params)}`, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/** Convenience helpers for the generic CRUD resources. */
export const crud = {
  list: <T>(resource: string, params?: Record<string, unknown>) => api.get<T[]>(`/${resource}`, params),
  one: <T>(resource: string, id: string) => api.get<T>(`/${resource}/${id}`),
  create: <T>(resource: string, body: unknown) => api.post<T>(`/${resource}`, body),
  update: <T>(resource: string, id: string, body: unknown) => api.patch<T>(`/${resource}/${id}`, body),
  remove: (resource: string, id: string) => api.del(`/${resource}/${id}`),
  publish: <T>(resource: string, id: string, active: boolean) => api.patch<T>(`/${resource}/${id}/publish`, { active }),
};

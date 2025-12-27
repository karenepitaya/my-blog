export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: ApiError | null;
};

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

export const getApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_SERVER_API_BASE_URL ??
    '';
  return raw ? raw.replace(/\/$/, '') : DEFAULT_API_BASE_URL;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith('http')
    ? path
    : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  let body: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body,
    signal: options.signal,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  const payload = isJson ? ((await response.json()) as ApiEnvelope<T>) : null;

  if (!response.ok) {
    const message = payload?.error?.message ?? `HTTP ${response.status}`;
    const code = payload?.error?.code ?? 'HTTP_ERROR';
    throw new Error(`${code}: ${message}`);
  }

  if (!payload?.success) {
    const message = payload?.error?.message ?? 'API_ERROR';
    throw new Error(message);
  }

  return payload.data;
}

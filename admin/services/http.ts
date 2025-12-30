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
const AUTH_EVENT = 'admin:unauthorized';

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
    if (
      response.status === 401 &&
      options.token &&
      typeof window !== 'undefined' &&
      (payload?.error?.code === 'INVALID_TOKEN' || payload?.error?.code === 'NO_TOKEN')
    ) {
      try {
        localStorage.removeItem('blog_token');
        localStorage.removeItem('blog_user');
        localStorage.removeItem('system_bios_config');
      } catch (err) {
        // Ignore storage errors to avoid masking auth failures.
      }
      try {
        window.dispatchEvent(new CustomEvent(AUTH_EVENT));
      } catch (err) {
        // Ignore event errors for non-browser environments.
      }
    }
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

import type { Request, Response, CookieOptions } from 'express';

export const ADMIN_AUTH_COOKIE = 'mt_admin_token';
export const AUTHOR_AUTH_COOKIE = 'mt_author_token';

const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});

const parseCookieHeader = (header: string): Record<string, string> => {
  const result: Record<string, string> = {};
  const parts = header.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!key) continue;
    try {
      result[decodeURIComponent(key)] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
};

export const getCookieValue = (req: Request, name: string): string | null => {
  const fromParser = (req as Request & { cookies?: Record<string, unknown> }).cookies?.[name];
  if (typeof fromParser === 'string' && fromParser) return fromParser;
  const raw = req.headers.cookie;
  if (!raw) return null;
  const parsed = parseCookieHeader(raw);
  return parsed[name] ?? null;
};

export const getAuthToken = (req: Request, cookieName: string): string | null => {
  const cookieToken = getCookieValue(req, cookieName);
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (!header) return null;
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
};

export const setAuthCookie = (res: Response, name: string, token: string, maxAgeMs: number) => {
  res.cookie(name, token, { ...baseCookieOptions(), maxAge: maxAgeMs });
};

export const clearAuthCookie = (res: Response, name: string) => {
  res.clearCookie(name, baseCookieOptions());
};

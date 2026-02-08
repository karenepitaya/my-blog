import path from 'node:path';

const DEFAULT_UPLOAD_DIR = 'uploads';
const SAFE_SEGMENT_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export function sanitizeUploadDir(input: unknown): string {
  const raw = String(input ?? '').trim();
  if (!raw) return DEFAULT_UPLOAD_DIR;
  if (raw.includes('..')) return DEFAULT_UPLOAD_DIR;
  if (path.isAbsolute(raw)) return DEFAULT_UPLOAD_DIR;
  if (raw.includes('/') || raw.includes('\\')) return DEFAULT_UPLOAD_DIR;
  if (!SAFE_SEGMENT_RE.test(raw)) return DEFAULT_UPLOAD_DIR;
  return raw;
}

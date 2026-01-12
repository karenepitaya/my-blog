import { CategoryStatus } from '../../types';

export function formatDateShort(value?: string | null): string {
  const raw = String(value ?? '').trim();
  if (!raw) return new Date().toISOString().slice(0, 10);
  return raw.slice(0, 10);
}

export function formatDateTimeShort(value?: string | null): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  // Expect ISO string
  const yyyyMmDd = raw.slice(0, 10);
  const hhMm = raw.length >= 16 ? raw.slice(11, 16) : '';
  return hhMm ? `${yyyyMmDd} ${hhMm}` : yyyyMmDd;
}

export function getDaysLeft(value?: string | null): number | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const ts = Date.parse(raw);
  if (!Number.isFinite(ts)) return null;
  const diffMs = ts - Date.now();
  return diffMs <= 0 ? 0 : Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

const GRADIENTS = [
  'bg-gradient-to-br from-violet-600 to-indigo-600',
  'bg-gradient-to-br from-cyan-500 to-blue-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-pink-500 to-fuchsia-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-rose-500 to-red-600',
];

export function gradientBySeed(seed: string): string {
  const s = String(seed ?? '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length]!;
}

export function isCategoryTrashed(status?: CategoryStatus): boolean {
  return status === CategoryStatus.PENDING_DELETE;
}

import { DEFAULT_SYSTEM_CONFIG } from '../config/defaultSystemConfig';
import { SystemConfigService } from './SystemConfigService';

const ALLOWED_RETENTION_DAYS = [7, 15, 30] as const;

export async function getRecycleBinRetentionDays(): Promise<number> {
  const fallback = Number(DEFAULT_SYSTEM_CONFIG.admin.recycleBinRetentionDays ?? 30);
  const fallbackNormalized = Number.isFinite(fallback) ? Math.floor(fallback) : 30;
  const fallbackAllowed = (ALLOWED_RETENTION_DAYS as readonly number[]).includes(fallbackNormalized)
    ? fallbackNormalized
    : 30;

  try {
    const config = await SystemConfigService.get();
    const raw = Number(config?.admin?.recycleBinRetentionDays);
    const normalized = Number.isFinite(raw) ? Math.floor(raw) : fallbackAllowed;
    return (ALLOWED_RETENTION_DAYS as readonly number[]).includes(normalized) ? normalized : fallbackAllowed;
  } catch {
    return fallbackAllowed;
  }
}

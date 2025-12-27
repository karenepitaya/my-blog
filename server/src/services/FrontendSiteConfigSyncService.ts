import fs from 'node:fs/promises';
import path from 'node:path';
import type { FrontendSiteConfig } from '../interfaces/SystemConfig';
import { logger } from '../utils/logger';

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function escapeString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n');
}

function formatKey(key: string): string {
  return IDENTIFIER_RE.test(key) ? key : `'${escapeString(key)}'`;
}

function formatValue(value: unknown, indent: number): string {
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);

  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `'${escapeString(value)}'`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map(item => `${padInner}${formatValue(item, indent + 1)}`);
    return `[\n${items.join(',\n')}\n${pad}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const lines = entries.map(([key, val]) => `${padInner}${formatKey(key)}: ${formatValue(val, indent + 1)}`);
    return `{\n${lines.join(',\n')}\n${pad}}`;
  }

  return 'undefined';
}

async function pathExists(fsPath: string): Promise<boolean> {
  try {
    await fs.access(fsPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveSiteConfigPath(): Promise<string> {
  const raw = process.env.FRONTEND_SITE_CONFIG_PATH?.trim();
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }

  const cwd = process.cwd();
  const candidateFromRepoRoot = path.resolve(cwd, 'frontend', 'src', 'site.config.ts');
  const candidateFromServerDir = path.resolve(cwd, '..', 'frontend', 'src', 'site.config.ts');

  if (await pathExists(candidateFromRepoRoot)) return candidateFromRepoRoot;
  if (await pathExists(candidateFromServerDir)) return candidateFromServerDir;
  return candidateFromRepoRoot;
}

function buildSiteConfigContent(config: FrontendSiteConfig): string {
  const body = formatValue(config, 0);
  return `import type { SiteConfig } from '~/types'\n\nconst config: SiteConfig = ${body}\n\nexport default config\n`;
}

export const FrontendSiteConfigSyncService = {
  async sync(config: FrontendSiteConfig): Promise<{ path: string }> {
    const target = await resolveSiteConfigPath();
    const content = buildSiteConfigContent(config);

    try {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, content, 'utf8');
      return { path: target };
    } catch (err) {
      logger.error('Frontend site.config.ts sync failed:', err);
      throw err;
    }
  },
};

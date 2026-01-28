/**
 * Export the published SystemConfig.frontend into `frontend/src/site.config.ts` for build-time usage.
 *
 * Route B (发布生效) expects this script to be executed in your deployment pipeline before building the frontend.
 *
 * Usage:
 *   ts-node src/scripts/exportFrontendSiteConfig.ts --help
 *   ts-node src/scripts/exportFrontendSiteConfig.ts
 *   ts-node src/scripts/exportFrontendSiteConfig.ts --out ../frontend/src/site.config.ts
 *
 * Notes:
 *   - Uses MongoDB connection from `src/scripts/scriptEnv.ts` (`server/.env`).
 *   - By default, resolves `frontend/src/site.config.ts` relative to the current working directory.
 */

import process from 'node:process';
import mongoose from 'mongoose';
import { loadScriptEnv } from './scriptEnv';
import { SystemConfigService } from '../services/SystemConfigService';
import { FrontendSiteConfigSyncService } from '../services/FrontendSiteConfigSyncService';

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag) || argv.includes(flag.replace(/^--/, '-'));
}

function getFlagValue(argv: string[], flag: string): string | undefined {
  const eq = argv.find(a => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);

  const index = argv.indexOf(flag);
  if (index !== -1 && index + 1 < argv.length) return argv[index + 1];

  return undefined;
}

function printHelp(): void {
  console.log(`
Usage:
  ts-node src/scripts/exportFrontendSiteConfig.ts [--out <path>]

Options:
  --out       Output file path (overrides FRONTEND_SITE_CONFIG_PATH)
  -h, --help  Show help
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (hasFlag(argv, '--help') || hasFlag(argv, '-h')) {
    printHelp();
    return;
  }

  const out = getFlagValue(argv, '--out');
  if (out && out.trim()) {
    process.env.FRONTEND_SITE_CONFIG_PATH = out.trim();
  }

  const { mongoUri } = loadScriptEnv();
  await mongoose.connect(mongoUri);

  try {
    const { frontend } = await SystemConfigService.get({ bypassCache: true });
    const result = await FrontendSiteConfigSyncService.sync(frontend);
    console.log(`Frontend site config exported: ${result.path}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Export frontend site config failed:', err);
  process.exit(1);
});


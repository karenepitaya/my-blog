// DOC: docs/scripts.md#init

import { spawn } from 'node:child_process';
import readline from 'node:readline';
import process from 'node:process';
import { loadScriptEnv } from './scriptEnv';

type ResetMode = 'drop' | 'delete-only';

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag) || argv.includes(flag.replace(/^--/, '-'));
}

function printHelp(): void {
  console.log(`
Usage:
  ts-node src/scripts/init.ts [--reset-db [--delete-only]] [--create-admin] [--yes]

Examples:
  ts-node src/scripts/init.ts --create-admin
  ts-node src/scripts/init.ts --reset-db
  ts-node src/scripts/init.ts --reset-db --delete-only

Notes:
  - --reset-db (default) will DROP collections (documents + indexes).
  - --delete-only keeps indexes; it does NOT remove unique indexes left from old schema.
`);
}

async function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function runScript(scriptName: string, scriptArgs: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['-r', 'ts-node/register', `src/scripts/${scriptName}.ts`, ...scriptArgs],
      {
        stdio: 'inherit',
        env: process.env,
      }
    );

    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} exited with code ${code}`));
    });
  });
}

async function main() {
  const argv = process.argv.slice(2);

  if (hasFlag(argv, '--help') || hasFlag(argv, '-h')) {
    printHelp();
    return;
  }

  const needResetDb = hasFlag(argv, '--reset-db');
  const needCreateAdmin = hasFlag(argv, '--create-admin');
  const resetMode: ResetMode = hasFlag(argv, '--delete-only') ? 'delete-only' : 'drop';
  const skipConfirm = hasFlag(argv, '--yes');

  if (!needResetDb && !needCreateAdmin) {
    printHelp();
    return;
  }

  if (needResetDb) {
    const { dbName } = loadScriptEnv();
    const confirmToken =
      resetMode === 'drop'
        ? `DROP ${dbName ?? ''}`.trim()
        : `DELETE ${dbName ?? ''}`.trim();

    console.log('----------------------------------------');
    console.log(`Reset DB requested. Mode: ${resetMode}`);
    console.log(`Target database: ${dbName ?? '(unknown; check your env)'}`);
    console.log('----------------------------------------');

    if (!skipConfirm) {
      const answer = await ask(
        `Type "${confirmToken}" to continue (anything else to abort): `
      );

      if (answer !== confirmToken) {
        console.log('Aborted.');
        process.exit(0);
      }
    } else {
      console.log('⚠️  --yes provided: skipping init confirmation prompt.');
    }

    const clearArgs = ['--yes', ...(resetMode === 'delete-only' ? ['--delete-only'] : [])];
    await runScript('clearDatabase', clearArgs);
  }

  if (needCreateAdmin) {
    await runScript('createAdmin');
  }

  console.log('Init completed.');
}

main().catch(err => {
  console.error('Init failed:', err);
  process.exit(1);
});

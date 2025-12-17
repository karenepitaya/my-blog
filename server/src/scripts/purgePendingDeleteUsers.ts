/**
 * Purge users whose deletion grace period has expired.
 *
 * Usage:
 *   ts-node src/scripts/purgePendingDeleteUsers.ts
 *   ts-node src/scripts/purgePendingDeleteUsers.ts --yes
 *
 * Notes:
 * - This performs HARD DELETE (MongoDB deleteMany).
 * - It only targets users with status=PENDING_DELETE and deleteScheduledAt <= now.
 * - If you later add articles/comments owned by users, consider adding a retention strategy.
 */

import mongoose from 'mongoose';
import readline from 'node:readline';
import process from 'node:process';
import { loadScriptEnv } from './scriptEnv';
import { UserModel } from '../models/UserModel';

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag) || argv.includes(flag.replace(/^--/, '-'));
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

async function main() {
  const argv = process.argv.slice(2);
  const skipConfirm = hasFlag(argv, '--yes');

  const { mongoUri, dbName } = loadScriptEnv();
  await mongoose.connect(mongoUri);

  try {
    const now = new Date();

    const candidates = await UserModel.countDocuments({
      status: 'PENDING_DELETE',
      deleteScheduledAt: { $lte: now },
    }).exec();

    if (candidates === 0) {
      console.log('No users to purge.');
      return;
    }

    console.log('----------------------------------------');
    console.log(`Target database: ${dbName}`);
    console.log(`Users to purge: ${candidates}`);
    console.log('----------------------------------------');

    if (!skipConfirm) {
      const token = `PURGE ${dbName}`.trim();
      const answer = await ask(`Type "${token}" to continue (anything else to abort): `);
      if (answer !== token) {
        console.log('Aborted. No changes were made.');
        return;
      }
    } else {
      console.log('--yes provided: skipping confirmation prompt.');
    }

    const result = await UserModel.deleteMany({
      status: 'PENDING_DELETE',
      deleteScheduledAt: { $lte: now },
    }).exec();

    console.log(`Purged users: ${result.deletedCount ?? 0}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Purge failed:');
  console.error(err);
  process.exit(1);
});

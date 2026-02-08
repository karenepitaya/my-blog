// DOC: docs/scripts.md#purge-pending-delete-categories

import mongoose from 'mongoose';
import readline from 'node:readline';
import process from 'node:process';
import { loadScriptEnv } from './scriptEnv';
import { CategoryModel } from '../models/CategoryModel';
import { ArticleRepository } from '../repositories/ArticleRepository';

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

    const ids = await CategoryModel.find({
      status: 'PENDING_DELETE',
      deleteScheduledAt: { $lte: now },
    })
      .select({ _id: 1 })
      .lean()
      .exec();

    if (ids.length === 0) {
      console.log('No categories to purge.');
      return;
    }

    const categoryObjectIds = ids.map(item => item._id);
    const categoryIds = categoryObjectIds.map(id => String(id));

    console.log('----------------------------------------');
    console.log(`Target database: ${dbName}`);
    console.log(`Categories to purge: ${categoryIds.length}`);
    console.log('----------------------------------------');

    if (!skipConfirm) {
      const token = `PURGE_CATEGORIES ${dbName}`.trim();
      const answer = await ask(`Type "${token}" to continue (anything else to abort): `);
      if (answer !== token) {
        console.log('Aborted. No changes were made.');
        return;
      }
    } else {
      console.log('--yes provided: skipping confirmation prompt.');
    }

    const detachedArticles = await ArticleRepository.removeCategoriesFromAllArticles(categoryIds);

    const result = await CategoryModel.deleteMany({
      _id: { $in: categoryObjectIds },
    }).exec();

    console.log(`Detached articles: ${detachedArticles}`);
    console.log(`Purged categories: ${result.deletedCount ?? 0}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Purge failed:');
  console.error(err);
  process.exit(1);
});

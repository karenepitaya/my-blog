// DOC: docs/scripts.md#purge-pending-delete-articles

import mongoose from 'mongoose';
import readline from 'node:readline';
import process from 'node:process';
import { loadScriptEnv } from './scriptEnv';
import { ArticleModel } from '../models/ArticleModel';
import { ArticleContentModel } from '../models/ArticleContentModel';
import { ArticleStatuses } from '../interfaces/Article';

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

    const ids = await ArticleModel.find({
      status: ArticleStatuses.PENDING_DELETE,
      deleteScheduledAt: { $lte: now },
    })
      .select({ _id: 1 })
      .lean()
      .exec();

    if (ids.length === 0) {
      console.log('No articles to purge.');
      return;
    }

    const articleIds = ids.map(item => item._id);

    console.log('----------------------------------------');
    console.log(`Target database: ${dbName}`);
    console.log(`Articles to purge: ${articleIds.length}`);
    console.log('----------------------------------------');

    if (!skipConfirm) {
      const token = `PURGE_ARTICLES ${dbName}`.trim();
      const answer = await ask(`Type "${token}" to continue (anything else to abort): `);
      if (answer !== token) {
        console.log('Aborted. No changes were made.');
        return;
      }
    } else {
      console.log('--yes provided: skipping confirmation prompt.');
    }

    const contentResult = await ArticleContentModel.deleteMany({
      articleId: { $in: articleIds },
    }).exec();

    const articleResult = await ArticleModel.deleteMany({
      _id: { $in: articleIds },
    }).exec();

    console.log(`Purged article contents: ${contentResult.deletedCount ?? 0}`);
    console.log(`Purged articles: ${articleResult.deletedCount ?? 0}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Purge failed:');
  console.error(err);
  process.exit(1);
});

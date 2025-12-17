/**
 * /src/scripts/clearDatabase.ts
 * 清空 MongoDB 数据库脚本（交互式）
 *
 * 默认行为：DROP 所有集合（删除文档 + 删除索引）。
 * 可选行为：仅删除文档（保留索引）。
 *
 * 设计目标：
 * - 更安全：需要输入明确的确认口令（例如：DROP myblog）
 * - 更直观：明确展示目标库、集合与文档数
 * - 可控：支持 --delete-only（只删文档）与 --yes（跳过确认，危险）
 */

import { MongoClient } from 'mongodb';
import readline from 'node:readline';
import process from 'node:process';
import { loadScriptEnv } from './scriptEnv';

type Mode = 'drop' | 'delete-only';

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

function parseMode(argv: string[]): Mode {
  return hasFlag(argv, '--delete-only') ? 'delete-only' : 'drop';
}

function printHelp(): void {
  console.log(`
Usage:
  ts-node src/scripts/clearDatabase.ts [--delete-only] [--yes]

Behavior:
  (default)     Drop all collections (documents + indexes)
  --delete-only Delete documents only (keep indexes)

Safety:
  By default, requires typing an explicit confirmation token:
    DROP <dbName>     (default mode)
    DELETE <dbName>   (--delete-only)

  --yes skips the confirmation prompt (dangerous).
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

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (hasFlag(argv, '--help') || hasFlag(argv, '-h')) {
    printHelp();
    return;
  }

  const mode = parseMode(argv);
  const skipConfirm = hasFlag(argv, '--yes');

  const { mongoUri } = loadScriptEnv();
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();

    console.log('Connected to MongoDB.');
    console.log(`Target database: ${db.databaseName}`);
    console.log(
      `Mode: ${
        mode === 'drop'
          ? 'DROP collections (documents + indexes)'
          : 'DELETE documents only (keep indexes)'
      }`
    );
    console.log('----------------------------------------');

    const collections = await db
      .listCollections({}, { nameOnly: true })
      .toArray();

    if (collections.length === 0) {
      console.log('Database is empty. No collections found.');
      return;
    }

    let totalDocs = 0;
    const stats: { name: string; count: number }[] = [];

    for (const col of collections) {
      const collection = db.collection(col.name);
      const count = await collection.countDocuments();
      stats.push({ name: col.name, count });
      totalDocs += count;
    }

    console.log('Database statistics:');
    for (const s of stats) {
      console.log(`- ${s.name}: ${s.count} documents`);
    }
    console.log(`Total documents: ${totalDocs}`);
    console.log('----------------------------------------');

    const confirmToken =
      mode === 'drop' ? `DROP ${db.databaseName}` : `DELETE ${db.databaseName}`;

    if (!skipConfirm) {
      const answer = await ask(
        `Type "${confirmToken}" to continue (anything else to abort): `
      );

      if (answer !== confirmToken) {
        console.log('Aborted. No changes were made.');
        return;
      }
    } else {
      console.log('⚠️  --yes provided: skipping confirmation prompt.');
    }

    console.log(mode === 'drop' ? 'Dropping collections...' : 'Deleting documents...');
    console.log('----------------------------------------');

    for (const s of stats) {
      if (mode === 'drop') {
        try {
          await db.dropCollection(s.name);
          console.log(`Collection "${s.name}": dropped (documents + indexes)`);
        } catch (err: any) {
          if (err?.codeName === 'NamespaceNotFound') {
            console.log(`Collection "${s.name}": already dropped`);
          } else {
            throw err;
          }
        }
      } else {
        const collection = db.collection(s.name);
        const result = await collection.deleteMany({});
        console.log(
          `Collection "${s.name}": deleted ${result.deletedCount ?? 0} documents`
        );
      }
    }

    console.log('----------------------------------------');
    console.log('Database cleanup completed successfully.');
  } catch (err) {
    console.error('Database error occurred:');
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Fatal error:');
  console.error(err);
  process.exitCode = 1;
});

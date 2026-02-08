// DOC: docs/scripts.md#create-admin

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'node:readline';
import process from 'node:process';
import { UserModel } from '../models/UserModel';
import { loadScriptEnv } from './scriptEnv';

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
  ts-node src/scripts/createAdmin.ts [--username <name>] [--password <pwd>] [--yes]

Options:
  --username   Admin username (fallback: ADMIN_USERNAME env)
  --password   Admin password (fallback: ADMIN_PASSWORD env; interactive prompt if missing)
  --yes        Skip confirmation prompt (dangerous)
  -h, --help   Show help
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

async function askSecret(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error('Password required in non-interactive mode (use --password or ADMIN_PASSWORD).');
  }

  return new Promise(resolve => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(question);
    stdin.setEncoding('utf8');
    stdin.resume();
    stdin.setRawMode(true);

    let input = '';

    const onData = (char: string) => {
      if (char === '\u0003') {
        stdout.write('\n');
        process.exit(130);
      }

      if (char === '\r' || char === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        stdout.write('\n');
        resolve(input);
        return;
      }

      if (char === '\u007f') {
        if (input.length > 0) {
          input = input.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }

      input += char;
      stdout.write('*');
    };

    stdin.on('data', onData);
  });
}

function normalizeUsername(value: string): string {
  return value.trim();
}

function validateUsername(value: string): void {
  if (value.length < 3 || value.length > 30) {
    throw new Error('Username must be between 3 and 30 characters.');
  }
}

function validatePassword(value: string): void {
  if (value.length < 8 || value.length > 100) {
    throw new Error('Password must be between 8 and 100 characters.');
  }
}

async function main() {
  const argv = process.argv.slice(2);

  if (hasFlag(argv, '--help') || hasFlag(argv, '-h')) {
    printHelp();
    return;
  }

  const { mongoUri, dbName, adminUsername, adminPassword } = loadScriptEnv();

  const skipConfirm = hasFlag(argv, '--yes');

  const usernameFromArgs = getFlagValue(argv, '--username');
  const passwordFromArgs = getFlagValue(argv, '--password');

  const username =
    normalizeUsername(usernameFromArgs ?? adminUsername ?? (await ask('Admin username: ')));

  let plainPassword = passwordFromArgs ?? adminPassword;
  if (!plainPassword) {
    plainPassword = await askSecret('Admin password (hidden): ');
  }

  validateUsername(username);
  validatePassword(plainPassword);

  await mongoose.connect(mongoUri);

  try {
    const existingAdmin = await UserModel.findOne({ role: 'admin' })
      .select({ username: 1, role: 1 })
      .lean();

    if (existingAdmin) {
      if (existingAdmin.username === username) {
        console.log(`Admin "${username}" already exists. Nothing to do.`);
        return;
      }

      throw new Error(
        `Admin already exists ("${existingAdmin.username}"). ` +
          'This system supports exactly one admin; refusing to create another.'
      );
    }

    const existingUser = await UserModel.findOne({ username }).select({ username: 1, role: 1 }).lean();
    if (existingUser) {
      throw new Error(
        `Username "${username}" is already taken by a(n) "${existingUser.role}" user; cannot create admin.`
      );
    }

    if (!skipConfirm) {
      console.log(`Target database: ${dbName}`);
      console.log('This will CREATE an admin user.');
      const token = `CREATE ${username}`;
      const answer = await ask(`Type "${token}" to continue (anything else to abort): `);
      if (answer !== token) {
        console.log('Aborted. No changes were made.');
        return;
      }
    } else {
      console.log('⚠️  --yes provided: skipping confirmation prompt.');
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await UserModel.create({
      username,
      passwordHash,
      role: 'admin',
      isActive: true,
      status: 'ACTIVE',
    });

    console.log('Admin created successfully.');
    console.log('username:', username);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Failed to create admin:');
  console.error(err);
  process.exit(1);
});

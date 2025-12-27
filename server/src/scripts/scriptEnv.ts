import path from 'node:path';
import dotenv from 'dotenv';

export type ScriptEnv = {
  mongoUri: string;
  dbName: string;
  adminUsername?: string | undefined;
  adminPassword?: string | undefined;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

export function loadScriptEnv(): ScriptEnv {
  const envPath = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: envPath });

  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  const mongoUriFromEnv = process.env.MONGO_URI;
  if (mongoUriFromEnv) {
    const dbName = process.env.MONGO_DBNAME ?? '(from URI)';
    return { mongoUri: mongoUriFromEnv, dbName, adminUsername, adminPassword };
  }

  const dbName = required('MONGO_DBNAME');

  const mongoUri =
    `mongodb://${required('MONGO_USERNAME')}:${required('MONGO_PASSWORD')}` +
    `@${required('MONGO_HOST')}:${required('MONGO_PORT')}/${dbName}` +
    `?authSource=${dbName}`;

  return { mongoUri, dbName, adminUsername, adminPassword };
}

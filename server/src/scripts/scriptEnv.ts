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

function optional(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// Build MongoDB connection URI
// Supports both authenticated and non-authenticated modes
function buildMongoUri(dbName: string): string {
  const host = optional('MONGO_HOST', '127.0.0.1');
  const port = optional('MONGO_PORT', '27017');
  
  const username = process.env.MONGO_USERNAME?.trim() || '';
  const password = process.env.MONGO_PASSWORD?.trim() || '';
  
  // Non-authenticated mode (empty username)
  if (!username) {
    return `mongodb://${host}:${port}/${dbName}`;
  }
  
  // Authenticated mode
  const authSource = process.env.MONGO_AUTH_SOURCE || dbName;
  return `mongodb://${username}:${password}@${host}:${port}/${dbName}?authSource=${authSource}`;
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
  const mongoUri = buildMongoUri(dbName);

  return { mongoUri, dbName, adminUsername, adminPassword };
}

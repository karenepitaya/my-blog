import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const localEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config();
}

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
function buildMongoUri(): string {
  const host = optional('MONGO_HOST', '127.0.0.1');
  const port = optional('MONGO_PORT', '27017');
  const dbName = required('MONGO_DBNAME');
  
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

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  MONGO_URI: buildMongoUri(),
  JWT_SECRET: required('JWT_SECRET'),
};

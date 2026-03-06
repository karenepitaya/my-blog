import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Load .env first, then .env.local (which overrides .env)
const envPath = path.resolve(__dirname, '../../.env');
const envLocalPath = path.resolve(__dirname, '../../.env.local');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
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

// Check if authentication should be enabled
// Default: true (security first!)
function isAuthEnabled(): boolean {
  const authEnabled = process.env.MONGO_AUTH_ENABLED?.toLowerCase();
  return authEnabled !== 'false' && authEnabled !== '0';
}

// Build MongoDB connection URI
// SECURITY: Authentication is REQUIRED by default
function buildMongoUri(): string {
  const host = optional('MONGO_HOST', '127.0.0.1');
  const port = optional('MONGO_PORT', '27017');
  const dbName = required('MONGO_DBNAME');

  const username = process.env.MONGO_USERNAME?.trim() || '';
  const password = process.env.MONGO_PASSWORD?.trim() || '';

  const authEnabled = isAuthEnabled();

  // Security check: auth is required by default
  if (authEnabled) {
    if (!username) {
      throw new Error(
        `MONGO_USERNAME is required for security reasons.\n` +
        `Set MONGO_USERNAME and MONGO_PASSWORD in your .env file.\n` +
        `If you MUST disable authentication (not recommended), set MONGO_AUTH_ENABLED=false`
      );
    }
    if (!password) {
      throw new Error(
        `MONGO_PASSWORD is required when MONGO_USERNAME is set.\n` +
        `Set MONGO_PASSWORD in your .env file.`
      );
    }

    // Authenticated mode
    const authSource = process.env.MONGO_AUTH_SOURCE || dbName;
    return `mongodb://${username}:${password}@${host}:${port}/${dbName}?authSource=${authSource}`;
  }

  // Unauthenticated mode (explicitly disabled via MONGO_AUTH_ENABLED=false)
  console.warn('⚠️  WARNING: MongoDB authentication is DISABLED. This is insecure and should only be used in isolated environments.');
  return `mongodb://${host}:${port}/${dbName}`;
}

export const env = {
  HOST: process.env.HOST || '127.0.0.1',
  PORT: Number(process.env.PORT) || 3000,
  MONGO_URI: buildMongoUri(),
  JWT_SECRET: required('JWT_SECRET'),
};

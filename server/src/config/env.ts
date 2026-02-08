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

export const env = {
  PORT: Number(process.env.PORT) || 3000,

  MONGO_URI:
    `mongodb://${required('MONGO_USERNAME')}:${required('MONGO_PASSWORD')}` +
    `@${required('MONGO_HOST')}:${required('MONGO_PORT')}/${required('MONGO_DBNAME')}` +
    `?authSource=${required('MONGO_DBNAME')}`,

  JWT_SECRET: required('JWT_SECRET'),
};

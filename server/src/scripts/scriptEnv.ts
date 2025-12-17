import dotenv from 'dotenv';

export type ScriptEnv = {
  mongoUri: string;
  dbName: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

export function loadScriptEnv(): ScriptEnv {
  dotenv.config({ quiet: true });

  const mongoUriFromEnv = process.env.MONGO_URI;
  if (mongoUriFromEnv) {
    const dbName = process.env.MONGO_DBNAME ?? '(from URI)';
    return { mongoUri: mongoUriFromEnv, dbName };
  }

  const dbName = required('MONGO_DBNAME');

  const mongoUri =
    `mongodb://${required('MONGO_USERNAME')}:${required('MONGO_PASSWORD')}` +
    `@${required('MONGO_HOST')}:${required('MONGO_PORT')}/${dbName}` +
    `?authSource=${dbName}`;

  return { mongoUri, dbName };
}


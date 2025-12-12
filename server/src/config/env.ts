import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/myblog',
  JWT_SECRET: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET',
};

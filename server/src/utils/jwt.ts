import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const Jwt = {
  sign(payload: Record<string, any>) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  },

  verify(token: string) {
    return jwt.verify(token, env.JWT_SECRET);
  }
};

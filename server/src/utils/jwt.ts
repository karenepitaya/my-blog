import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const Jwt = {
  sign(
    payload: Record<string, any>,
    options?: jwt.SignOptions
  ) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d', ...options });
  },

  verify(token: string, options?: jwt.VerifyOptions) {
    return jwt.verify(token, env.JWT_SECRET, options);
  }
};

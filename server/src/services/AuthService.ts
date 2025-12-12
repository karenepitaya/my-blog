import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { Jwt } from '../utils/jwt';

export const AuthService = {
  async login(username: string, password: string) {
    const user = await UserRepository.findByUsername(username);
    if (!user) {
      throw { status: 401, code: 'AUTH_FAILED', message: 'Invalid username or password' };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw { status: 401, code: 'AUTH_FAILED', message: 'Invalid username or password' };
    }

    const token = Jwt.sign({
      userId: user._id,
      role: user.role
    });

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    };
  },
};

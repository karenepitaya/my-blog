import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { Jwt } from '../utils/jwt';
import { canUserLogin, getEffectiveUserStatus } from '../utils/userStatus';
import { UserStatuses } from '../interfaces/User';

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

    if (!canUserLogin(user)) {
      const status = getEffectiveUserStatus(user);
      throw {
        status: 403,
        code: 'ACCOUNT_DISABLED',
        message:
          status === UserStatuses.BANNED
            ? 'Account is banned'
            : status === UserStatuses.PENDING_DELETE
              ? 'Account is pending deletion'
              : 'Account is disabled',
      };
    }

    await UserRepository.updateById(String(user._id), { lastLoginAt: new Date() });

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
        avatarUrl: user.avatarUrl,
        status: getEffectiveUserStatus(user),
      }
    };
  },
};

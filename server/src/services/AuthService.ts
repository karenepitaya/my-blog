import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { Jwt } from '../utils/jwt';
import { canUserLogin, getEffectiveUserStatus } from '../utils/userStatus';
import { UserStatuses } from '../interfaces/User';
import type { SignOptions } from 'jsonwebtoken';

export const AuthService = {
  async loginAuthor(username: string, password: string) {
    return AuthService.loginWithPolicy(username, password, {
      expectedRole: 'author',
      audience: 'author',
      expiresIn: '7d',
    });
  },

  async loginAdmin(username: string, password: string) {
    return AuthService.loginWithPolicy(username, password, {
      expectedRole: 'admin',
      audience: 'admin',
      expiresIn: '2h',
    });
  },

  async loginWithPolicy(
    username: string,
    password: string,
    policy: {
      expectedRole: 'admin' | 'author';
      audience: 'admin' | 'author';
      expiresIn: NonNullable<SignOptions['expiresIn']>;
    }
  ) {
    const user = await UserRepository.findByUsername(username);
    if (!user) {
      throw { status: 401, code: 'AUTH_FAILED', message: 'Invalid username or password' };
    }

    if (user.role !== policy.expectedRole) {
      throw {
        status: 403,
        code: 'ROLE_NOT_ALLOWED',
        message:
          policy.expectedRole === 'admin'
            ? 'Admin login required'
            : 'Author login required',
      };
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

    const token = Jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      { audience: policy.audience, expiresIn: policy.expiresIn }
    );

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

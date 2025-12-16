import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';

export const AdminUserService = {
  async createAuthor(input: { username: string; password: string }) {
    const username = input.username.trim();

    const existing = await UserRepository.findByUsername(username);
    if (existing) {
      throw { status: 409, code: 'USERNAME_EXISTS', message: 'Username already exists' };
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await UserRepository.createAuthor({
      username,
      passwordHash,
      isActive: true,
    });

    return {
      id: user._id,
      username: user.username,
      role: user.role,
      isActive: user.isActive ?? true,
      avatarUrl: user.avatarUrl ?? null,
      bio: user.bio ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
};


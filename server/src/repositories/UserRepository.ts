import { UserModel } from '../models/UserModel';
import { User } from '../interfaces/User';

export const UserRepository = {
  async findByUsername(username: string): Promise<User | null> {
    return UserModel.findOne({ username });
  },

  async findById(id: string): Promise<User | null> {
    return UserModel.findById(id);
  },

  async createUser(data: {
    username: string;
    passwordHash: string;
    role: 'admin' | 'author';
  }): Promise<User> {
    const user = new UserModel(data);
    return user.save();
  },

  async listAll(): Promise<User[]> {
    return UserModel.find();
  }
};

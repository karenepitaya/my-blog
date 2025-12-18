import { UserModel } from '../models/UserModel';
import { User } from '../interfaces/User';

export const UserRepository = {
  async findByUsername(username: string): Promise<User | null> {
    return UserModel.findOne({ username }).exec();
  },

  async findById(id: string): Promise<User | null> {
    return UserModel.findById(id).exec();
  },

  async createUser(data: {
    username: string;
    passwordHash: string;
    role: 'admin' | 'author';
    isActive?: boolean;
    status?: User['status'];
  }): Promise<User> {
    const user = new UserModel(data);
    return user.save();
  },

  async createAuthor(data: {
    username: string;
    passwordHash: string;
    isActive?: boolean;
    status?: User['status'];
  }): Promise<User> {
    return UserRepository.createUser({ ...data, role: 'author' });
  },

  async listAll(): Promise<User[]> {
    return UserModel.find().exec();
  },

  async count(filter: Record<string, unknown>): Promise<number> {
    return UserModel.countDocuments(filter).exec();
  },

  async list(filter: Record<string, unknown>, options: {
    skip?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
  }): Promise<User[]> {
    const query = UserModel.find(filter);

    if (options.sort) query.sort(options.sort);
    if (typeof options.skip === 'number') query.skip(options.skip);
    if (typeof options.limit === 'number') query.limit(options.limit);

    return query.exec();
  },

  async updateById(
    id: string,
    update: Record<string, unknown>
  ): Promise<User | null> {
    return UserModel.findByIdAndUpdate(id, update, { new: true }).exec();
  },

  async deleteById(id: string): Promise<User | null> {
    return UserModel.findByIdAndDelete(id).exec();
  },
};

import { Schema, model } from 'mongoose';
import { User } from '../interfaces/User';

const userSchema = new Schema<User>(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'author'], required: true },

    avatarUrl: { type: String, default: null },
    bio: { type: String, default: null },
  },
  { timestamps: true }
);

export const UserModel = model<User>('User', userSchema);

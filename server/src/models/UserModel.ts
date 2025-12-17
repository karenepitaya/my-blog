import { Schema, model } from 'mongoose';
import { User } from '../interfaces/User';

const userSchema = new Schema<User>(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'author'], required: true },

    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'BANNED', 'PENDING_DELETE'],
      default: 'ACTIVE',
      index: true,
    },
    bannedAt: { type: Date, default: null },
    bannedReason: { type: String, default: null },
    deleteScheduledAt: { type: Date, default: null, index: true },
    lastLoginAt: { type: Date, default: null },

    adminRemark: { type: String, default: null },
    adminTags: { type: [String], default: [] },

    avatarUrl: { type: String, default: null },
    bio: { type: String, default: null },
  },
  { timestamps: true }
);

export const UserModel = model<User>('User', userSchema);

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
    displayName: { type: String, default: null },
    email: { type: String, default: null },
    roleTitle: { type: String, default: null },
    emojiStatus: { type: String, default: null },

    preferences: {
      aiConfig: {
        vendorId: { type: String, default: null },
        apiKey: { type: String, default: null },
        baseUrl: { type: String, default: null },
        model: { type: String, default: null },
      },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isNew) return;
  if (this.role !== 'admin') return;

  const existing = await this.model('User').findOne({ role: 'admin' }).select({ _id: 1 }).lean();
  if (existing) {
    throw new Error('Only one admin account is allowed.');
  }
});

export const UserModel = model<User>('User', userSchema);

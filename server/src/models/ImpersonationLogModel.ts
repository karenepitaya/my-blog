import { Schema, model } from 'mongoose';

export interface ImpersonationLog {
  adminId: string;
  authorId: string;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const impersonationLogSchema = new Schema<ImpersonationLog>(
  {
    adminId: { type: String, required: true, index: true },
    authorId: { type: String, required: true, index: true },
    reason: { type: String, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

export const ImpersonationLogModel = model<ImpersonationLog>(
  'ImpersonationLog',
  impersonationLogSchema
);


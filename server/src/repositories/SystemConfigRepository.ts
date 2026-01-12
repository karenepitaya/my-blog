import { Types } from 'mongoose';
import { SystemConfigModel } from '../models/SystemConfigModel';
import type { SystemConfig } from '../interfaces/SystemConfig';
import { DEFAULT_SYSTEM_CONFIG } from '../config/defaultSystemConfig';

const SYSTEM_KEY = 'system';

export const SystemConfigRepository = {
  async get(): Promise<SystemConfig | null> {
    const record = await SystemConfigModel.findOne({ key: SYSTEM_KEY }).lean().exec();
    if (!record) return null;
    return {
      ...(record as unknown as SystemConfig),
      oss: (record as any).oss ?? DEFAULT_SYSTEM_CONFIG.oss,
    };
  },

  async upsert(
    input: { admin: SystemConfig['admin']; frontend: SystemConfig['frontend']; oss: SystemConfig['oss'] },
    actorId?: string
  ) {
    const update: Record<string, unknown> = {
      key: SYSTEM_KEY,
      admin: input.admin,
      frontend: input.frontend,
      oss: input.oss,
    };

    if (actorId && Types.ObjectId.isValid(actorId)) {
      update.updatedBy = new Types.ObjectId(actorId);
    }

    return SystemConfigModel.findOneAndUpdate({ key: SYSTEM_KEY }, update, {
      new: true,
      upsert: true,
    })
      .lean()
      .exec();
  },
};

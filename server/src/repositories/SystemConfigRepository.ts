import { Types } from 'mongoose';
import { SystemConfigModel } from '../models/SystemConfigModel';
import type { SystemConfig } from '../interfaces/SystemConfig';

const SYSTEM_KEY = 'system';

export const SystemConfigRepository = {
  async get(): Promise<SystemConfig | null> {
    return SystemConfigModel.findOne({ key: SYSTEM_KEY }).lean().exec();
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

import { Types } from 'mongoose';
import { SystemConfigModel } from '../models/SystemConfigModel';
import type { SystemConfig } from '../interfaces/SystemConfig';
import { DEFAULT_SYSTEM_CONFIG } from '../config/defaultSystemConfig';

export const SYSTEM_CONFIG_KEYS = {
  published: 'system',
  draft: 'system_draft',
} as const;

export const SystemConfigRepository = {
  async getByKey(key: string): Promise<SystemConfig | null> {
    const record = await SystemConfigModel.findOne({ key }).lean().exec();
    if (!record) return null;
    return {
      ...(record as unknown as SystemConfig),
      oss: (record as any).oss ?? DEFAULT_SYSTEM_CONFIG.oss,
    };
  },

  async get(): Promise<SystemConfig | null> {
    return SystemConfigRepository.getByKey(SYSTEM_CONFIG_KEYS.published);
  },

  async upsert(
    input: { admin: SystemConfig['admin']; frontend: SystemConfig['frontend']; oss: SystemConfig['oss'] },
    actorId?: string
  ) {
    return SystemConfigRepository.upsertByKey(SYSTEM_CONFIG_KEYS.published, input, actorId);
  },

  async upsertByKey(
    key: string,
    input: { admin: SystemConfig['admin']; frontend: SystemConfig['frontend']; oss: SystemConfig['oss'] },
    actorId?: string
  ) {
    const update: Record<string, unknown> = {
      key,
      admin: input.admin,
      frontend: input.frontend,
      oss: input.oss,
    };

    if (actorId && Types.ObjectId.isValid(actorId)) {
      update.updatedBy = new Types.ObjectId(actorId);
    }

    return SystemConfigModel.findOneAndUpdate({ key }, update, {
      new: true,
      upsert: true,
    })
      .lean()
      .exec();
  },
};

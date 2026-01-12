import { ImpersonationLogModel, type ImpersonationLog } from '../models/ImpersonationLogModel';

export const ImpersonationLogRepository = {
  async create(input: Omit<ImpersonationLog, 'createdAt' | 'updatedAt'>) {
    const doc = new ImpersonationLogModel(input);
    return doc.save();
  },
};


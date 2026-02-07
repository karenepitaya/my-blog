import type { Request, Response, NextFunction } from 'express';
import { AuthorProfileService } from '../services/AuthorProfileService';
import { pickDefined, toOptionalEnum } from './utils';

type UpdateProfileBody = {
  avatarUrl?: string | null;
  bio?: string | null;
  displayName?: string | null;
  email?: string | null;
  roleTitle?: string | null;
  emojiStatus?: string | null;
};

type ChangePasswordBody = { currentPassword?: string; newPassword?: string };

type AiConfigBody = {
  vendorId?: string | null;
  apiKey?: string | null;
  baseUrl?: string | null;
  model?: string | null;
  prompt?: string | null;
};

type FetchAiModelsBody = {
  vendorId?: string | null;
  apiKey?: string | null;
  baseUrl?: string | null;
};

type ProxyAiRequestBody = {
  vendorId?: string | null;
  apiKey?: string | null;
  baseUrl?: string | null;
  model?: string | null;
  prompt?: string;
  messages?: unknown;
  temperature?: number;
  responseFormat?: 'json_object' | 'text';
};

type AiProxyMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const VALID_AI_ROLES = new Set<AiProxyMessage['role']>(['system', 'user', 'assistant']);

const normalizeAiMessages = (input: unknown): AiProxyMessage[] | undefined => {
  if (!Array.isArray(input)) return undefined;
  const items = input.filter((item): item is AiProxyMessage => {
    if (!item || typeof item !== 'object') return false;
    const record = item as { role?: unknown; content?: unknown };
    return (
      typeof record.content === 'string' &&
      typeof record.role === 'string' &&
      VALID_AI_ROLES.has(record.role as AiProxyMessage['role'])
    );
  });
  return items.length > 0 ? items : undefined;
};

const getBody = <T>(req: Request) => (req.validated?.body ?? req.body) as T;

export const AuthorProfileController = {
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const profile = await AuthorProfileService.me(userId);
      return res.success(profile);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = getBody<UpdateProfileBody>(req);
      const profile = await AuthorProfileService.updateProfile({
        userId,
        ...pickDefined({
          avatarUrl: body?.avatarUrl,
          bio: body?.bio,
          displayName: body?.displayName,
          email: body?.email,
          roleTitle: body?.roleTitle,
          emojiStatus: body?.emojiStatus,
        }),
      });
      return res.success(profile);
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = getBody<ChangePasswordBody>(req);
      const currentPassword = body?.currentPassword;
      const newPassword = body?.newPassword;
      if (!currentPassword || !newPassword) {
        return res.error(400, 'PASSWORD_REQUIRED', 'Password is required');
      }
      const result = await AuthorProfileService.changePassword({
        userId,
        currentPassword,
        newPassword,
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async updateAiConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = getBody<AiConfigBody>(req);
      const profile = await AuthorProfileService.updateAiConfig({
        userId,
        ...pickDefined({
          vendorId: body?.vendorId,
          apiKey: body?.apiKey,
          baseUrl: body?.baseUrl,
          model: body?.model,
          prompt: body?.prompt,
        }),
      });
      return res.success(profile);
    } catch (err) {
      next(err);
    }
  },

  async fetchAiModels(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = getBody<FetchAiModelsBody>(req);
      const result = await AuthorProfileService.fetchAiModels({
        userId,
        ...pickDefined({
          vendorId: body?.vendorId,
          apiKey: body?.apiKey,
          baseUrl: body?.baseUrl,
        }),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async proxyAiRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = getBody<ProxyAiRequestBody>(req);
      const messages = normalizeAiMessages(body?.messages);
      const responseFormat = toOptionalEnum(body?.responseFormat, ['json_object', 'text'] as const);
      const result = await AuthorProfileService.proxyAiRequest({
        userId,
        ...pickDefined({
          vendorId: body?.vendorId,
          apiKey: body?.apiKey,
          baseUrl: body?.baseUrl,
          model: body?.model,
          prompt: body?.prompt,
          messages,
          temperature: body?.temperature,
          responseFormat,
        }),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};

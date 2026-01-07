import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { getEffectiveUserStatus } from '../utils/userStatus';

function toAuthorProfileDto(user: any) {
  return {
    id: String(user._id),
    username: user.username,
    role: user.role,
    status: getEffectiveUserStatus(user),
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    roleTitle: user.roleTitle ?? null,
    emojiStatus: user.emojiStatus ?? null,
    preferences: toPreferencesDto(user.preferences),
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toPreferencesDto(preferences: any) {
  if (!preferences || typeof preferences !== 'object') return undefined;
  const aiConfig = preferences.aiConfig ?? {};
  return {
    aiConfig: {
      vendorId: aiConfig.vendorId ?? null,
      apiKey: aiConfig.apiKey ?? null,
      baseUrl: aiConfig.baseUrl ?? null,
      model: aiConfig.model ?? null,
      prompt: aiConfig.prompt ?? null,
    },
  };
}

async function getAuthorOrThrow(userId: string) {
  const user = await UserRepository.findById(userId);
  if (!user) throw { status: 401, code: 'NOT_AUTHENTICATED', message: 'User not authenticated' };
  if (user.role !== 'author') throw { status: 403, code: 'FORBIDDEN', message: 'Author token required' };
  return user as any;
}

const AI_VENDOR_DEFAULTS: Record<string, string> = {
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  doubao: 'https://ark.cn-beijing.volces.com/api/v3',
  deepseek: 'https://api.deepseek.com',
  minimax: 'https://api.minimax.chat/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  glm: 'https://open.bigmodel.cn/api/paas/v4',
};

const normalizeNullable = (value?: string | null) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
};

const normalizeVendorId = (value?: string | null) => {
  if (!value) return '';
  return String(value).trim().toLowerCase();
};

const inferVendorId = (baseUrl: string) => {
  const lowered = baseUrl.toLowerCase();
  if (lowered.includes('generativelanguage.googleapis.com')) return 'gemini';
  if (lowered.includes('dashscope.aliyuncs.com')) return 'qwen';
  if (lowered.includes('volces.com')) return 'doubao';
  if (lowered.includes('deepseek.com')) return 'deepseek';
  if (lowered.includes('minimax')) return 'minimax';
  if (lowered.includes('bigmodel.cn')) return 'glm';
  return '';
};

const withTimeout = async (promise: Promise<Response>, timeoutMs: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeout = new Promise<Response>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const parseModelList = (payload: any, vendorId: string) => {
  const candidates = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.models)
      ? payload.models
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

  const result = candidates
    .map((item: any) => String(item?.id ?? item?.name ?? item?.model ?? '').trim())
    .filter(Boolean)
    .map((name: string) => (vendorId === 'gemini' ? name.replace(/^models\//, '') : name));

  return Array.from(new Set(result));
};

const buildModelsUrl = (baseUrl: string) => {
  const clean = baseUrl.replace(/\/+$/, '');
  return clean.endsWith('/models') ? clean : `${clean}/models`;
};

type AiProxyMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const buildChatCompletionsUrl = (baseUrl: string) => {
  const clean = baseUrl.replace(/\/+$/, '');
  return clean.endsWith('/chat/completions') ? clean : `${clean}/chat/completions`;
};

const buildGeminiGenerateUrl = (baseUrl: string, model: string, apiKey: string) => {
  const clean = baseUrl.replace(/\/+$/, '');
  const normalizedModel = model.replace(/^models\//, '');
  const key = encodeURIComponent(apiKey);
  if (clean.includes(':generateContent')) return `${clean}?key=${key}`;
  if (clean.endsWith('/models')) {
    return `${clean}/${normalizedModel}:generateContent?key=${key}`;
  }
  if (clean.includes('/models/')) {
    const prefix = clean.split('/models/')[0];
    return `${prefix}/models/${normalizedModel}:generateContent?key=${key}`;
  }
  return `${clean}/models/${normalizedModel}:generateContent?key=${key}`;
};

const normalizeMessages = (messages?: AiProxyMessage[], prompt?: string | null) => {
  const normalized = Array.isArray(messages)
    ? messages
        .map(message => ({
          role: message.role,
          content: String(message.content ?? '').trim(),
        }))
        .filter(message => message.content)
    : [];

  if (normalized.length > 0) return normalized;

  const fallback = String(prompt ?? '').trim();
  return fallback ? [{ role: 'user', content: fallback }] : [];
};

const extractOpenAiContent = (payload: any) => {
  const content = payload?.choices?.[0]?.message?.content ?? payload?.choices?.[0]?.text ?? '';
  return typeof content === 'string' ? content : '';
};

const extractGeminiContent = (payload: any) => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((part: any) => part?.text ?? '').join('');
  }
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === 'string' ? text : '';
};

export const AuthorProfileService = {
  async me(userId: string) {
    const user = await getAuthorOrThrow(userId);
    return toAuthorProfileDto(user);
  },

  async updateProfile(input: {
    userId: string;
    avatarUrl?: string | null;
    bio?: string | null;
    displayName?: string | null;
    email?: string | null;
    roleTitle?: string | null;
    emojiStatus?: string | null;
  }) {
    await getAuthorOrThrow(input.userId);

    const update: Record<string, unknown> = {};

    const applyNullable = (
      field: 'avatarUrl' | 'bio' | 'displayName' | 'email' | 'roleTitle' | 'emojiStatus',
      rawValue: string | null | undefined,
      maxLength: number,
      errorCode: string
    ) => {
      if (rawValue === undefined) return;
      if (rawValue === null) {
        update[field] = null;
        return;
      }
      const value = String(rawValue).trim();
      if (!value) {
        update[field] = null;
        return;
      }
      if (value.length > maxLength) {
        throw { status: 400, code: errorCode, message: `${field} is too long` };
      }
      update[field] = value;
    };

    applyNullable('avatarUrl', input.avatarUrl, 2048, 'INVALID_AVATAR_URL');
    applyNullable('bio', input.bio, 500, 'INVALID_BIO');
    applyNullable('displayName', input.displayName, 80, 'INVALID_DISPLAY_NAME');
    applyNullable('email', input.email, 200, 'INVALID_EMAIL');
    applyNullable('roleTitle', input.roleTitle, 120, 'INVALID_ROLE_TITLE');
    applyNullable('emojiStatus', input.emojiStatus, 16, 'INVALID_EMOJI_STATUS');

    if (Object.keys(update).length === 0) {
      return AuthorProfileService.me(input.userId);
    }

    const updated = await UserRepository.updateById(input.userId, update);
    if (!updated) throw { status: 401, code: 'NOT_AUTHENTICATED', message: 'User not authenticated' };
    return toAuthorProfileDto(updated);
  },

  async updateAiConfig(input: {
    userId: string;
    vendorId?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
    model?: string | null;
    prompt?: string | null;
  }) {
    const user = await getAuthorOrThrow(input.userId);
    const preferences = (user as any).preferences ?? {};
    const aiConfig = { ...(preferences.aiConfig ?? {}) } as Record<string, unknown>;

    if (input.vendorId !== undefined) {
      const vendorId = normalizeNullable(input.vendorId);
      aiConfig.vendorId = vendorId;
    }

    if (input.apiKey !== undefined) {
      if (input.apiKey === null) {
        aiConfig.apiKey = null;
      } else {
        const apiKey = String(input.apiKey).trim();
        aiConfig.apiKey = apiKey ? apiKey : null;
      }
    }

    if (input.baseUrl !== undefined) {
      if (input.baseUrl === null) {
        aiConfig.baseUrl = null;
      } else {
        const baseUrl = String(input.baseUrl).trim();
        aiConfig.baseUrl = baseUrl ? baseUrl : null;
      }
    }

    if (input.model !== undefined) {
      if (input.model === null) {
        aiConfig.model = null;
      } else {
        const model = String(input.model).trim();
        aiConfig.model = model ? model : null;
      }
    }

    if (input.prompt !== undefined) {
      if (input.prompt === null) {
        aiConfig.prompt = null;
      } else {
        const prompt = String(input.prompt).trim();
        aiConfig.prompt = prompt ? prompt : null;
      }
    }

    const updated = await UserRepository.updateById(input.userId, {
      preferences: {
        ...preferences,
        aiConfig,
      },
    });
    if (!updated) throw { status: 401, code: 'NOT_AUTHENTICATED', message: 'User not authenticated' };
    return toAuthorProfileDto(updated);
  },

  async fetchAiModels(input: {
    userId: string;
    vendorId?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
  }) {
    const user = await getAuthorOrThrow(input.userId);
    const preferences = (user as any).preferences ?? {};
    const stored = (preferences.aiConfig ?? {}) as Record<string, any>;

    const vendorId = normalizeVendorId(input.vendorId ?? stored.vendorId ?? '');
    const apiKey = normalizeNullable(input.apiKey ?? stored.apiKey);
    const baseUrlInput = normalizeNullable(input.baseUrl ?? stored.baseUrl);
    const resolvedBaseUrl = baseUrlInput ?? AI_VENDOR_DEFAULTS[vendorId] ?? '';
    const inferredVendor = vendorId || inferVendorId(resolvedBaseUrl);
    const finalVendorId = inferredVendor || vendorId;

    if (!apiKey) {
      throw { status: 400, code: 'API_KEY_REQUIRED', message: 'API key is required' };
    }
    if (!resolvedBaseUrl) {
      throw { status: 400, code: 'BASE_URL_REQUIRED', message: 'Base URL is required' };
    }

    const isGemini = finalVendorId === 'gemini' || inferVendorId(resolvedBaseUrl) === 'gemini';
    const baseUrl = resolvedBaseUrl.replace(/\/+$/, '');
    const requestUrl = isGemini
      ? `${buildModelsUrl(baseUrl)}?key=${encodeURIComponent(apiKey)}`
      : buildModelsUrl(baseUrl);

    const headers: Record<string, string> = isGemini
      ? { Accept: 'application/json' }
      : { Accept: 'application/json', Authorization: `Bearer ${apiKey}` };

    const startedAt = Date.now();
    const response = await withTimeout(fetch(requestUrl, { method: 'GET', headers }), 12000);
    const latencyMs = Date.now() - startedAt;

    const text = await response.text();
    let payload: any = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch (err) {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload?.error?.message ??
        payload?.message ??
        `${response.status} ${response.statusText}`;
      throw { status: response.status, code: 'AI_PROXY_FAILED', message };
    }

    const models = parseModelList(payload, isGemini ? 'gemini' : finalVendorId);
    if (models.length === 0) {
      throw { status: 404, code: 'NO_MODELS', message: 'No models found from provider' };
    }

    return { models, latencyMs };
  },

  async proxyAiRequest(input: {
    userId: string;
    vendorId?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
    model?: string | null;
    prompt?: string | null;
    messages?: AiProxyMessage[];
    temperature?: number;
    responseFormat?: 'json_object' | 'text';
  }) {
    const user = await getAuthorOrThrow(input.userId);
    const preferences = (user as any).preferences ?? {};
    const stored = (preferences.aiConfig ?? {}) as Record<string, any>;

    const vendorId = normalizeVendorId(input.vendorId ?? stored.vendorId ?? '');
    const apiKey = normalizeNullable(input.apiKey ?? stored.apiKey);
    const baseUrlInput = normalizeNullable(input.baseUrl ?? stored.baseUrl);
    const modelInput = normalizeNullable(input.model ?? stored.model);
    const resolvedBaseUrl = baseUrlInput ?? AI_VENDOR_DEFAULTS[vendorId] ?? '';
    const inferredVendor = vendorId || inferVendorId(resolvedBaseUrl);
    const finalVendorId = inferredVendor || vendorId;
    const isGemini = finalVendorId === 'gemini' || inferVendorId(resolvedBaseUrl) === 'gemini';
    const normalizedModel = modelInput
      ? isGemini
        ? modelInput.replace(/^models\//, '')
        : modelInput
      : null;

    if (!apiKey) {
      throw { status: 400, code: 'API_KEY_REQUIRED', message: 'API key is required' };
    }
    if (!resolvedBaseUrl) {
      throw { status: 400, code: 'BASE_URL_REQUIRED', message: 'Base URL is required' };
    }
    if (!normalizedModel) {
      throw { status: 400, code: 'MODEL_REQUIRED', message: 'Model is required' };
    }

    const messages = normalizeMessages(input.messages, input.prompt);
    const hasPrompt = messages.some(message => message.role !== 'system');
    if (messages.length === 0 || !hasPrompt) {
      throw { status: 400, code: 'PROMPT_REQUIRED', message: 'Prompt is required' };
    }

    const temperature =
      typeof input.temperature === 'number' && !Number.isNaN(input.temperature)
        ? input.temperature
        : undefined;

    const startedAt = Date.now();

    if (isGemini) {
      const systemMessages = messages.filter(message => message.role === 'system');
      const systemInstruction =
        systemMessages.length > 0 ? systemMessages.map(message => message.content).join('\n') : undefined;
      const contents = messages
        .filter(message => message.role !== 'system')
        .map(message => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        }));

      if (contents.length === 0) {
        throw { status: 400, code: 'PROMPT_REQUIRED', message: 'Prompt is required' };
      }

      const payload: Record<string, unknown> = { contents };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      if (temperature !== undefined) {
        payload.generationConfig = { temperature };
      }

      const requestUrl = buildGeminiGenerateUrl(resolvedBaseUrl, normalizedModel, apiKey);
      const response = await withTimeout(
        fetch(requestUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        }),
        20000
      );
      const latencyMs = Date.now() - startedAt;

      const text = await response.text();
      let responsePayload: any = null;
      try {
        responsePayload = text ? JSON.parse(text) : null;
      } catch (err) {
        responsePayload = null;
      }

      if (!response.ok) {
        const message =
          responsePayload?.error?.message ??
          responsePayload?.message ??
          `${response.status} ${response.statusText}`;
        throw { status: response.status, code: 'AI_PROXY_FAILED', message };
      }

      const content = extractGeminiContent(responsePayload);
      if (!content) {
        throw { status: 502, code: 'AI_EMPTY_RESPONSE', message: 'AI returned empty response' };
      }

      return { content, vendorId: finalVendorId || 'gemini', model: normalizedModel, latencyMs };
    }

    const payload: Record<string, unknown> = {
      model: normalizedModel,
      messages,
      stream: false,
    };
    if (temperature !== undefined) {
      payload.temperature = temperature;
    }
    if (input.responseFormat === 'json_object') {
      payload.response_format = { type: 'json_object' };
    }

    const requestUrl = buildChatCompletionsUrl(resolvedBaseUrl);
    const response = await withTimeout(
      fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      }),
      20000
    );
    const latencyMs = Date.now() - startedAt;

    const text = await response.text();
    let responsePayload: any = null;
    try {
      responsePayload = text ? JSON.parse(text) : null;
    } catch (err) {
      responsePayload = null;
    }

    if (!response.ok) {
      const message =
        responsePayload?.error?.message ??
        responsePayload?.message ??
        `${response.status} ${response.statusText}`;
      throw { status: response.status, code: 'AI_PROXY_FAILED', message };
    }

    const content = extractOpenAiContent(responsePayload);
    if (!content) {
      throw { status: 502, code: 'AI_EMPTY_RESPONSE', message: 'AI returned empty response' };
    }

    return { content, vendorId: finalVendorId || null, model: normalizedModel, latencyMs };
  },

  async changePassword(input: { userId: string; currentPassword: string; newPassword: string }) {
    const user = await getAuthorOrThrow(input.userId);

    const currentPassword = String(input.currentPassword ?? '');
    const newPassword = String(input.newPassword ?? '');

    if (!currentPassword || !newPassword) {
      throw { status: 400, code: 'PASSWORD_REQUIRED', message: 'Password is required' };
    }
    if (newPassword.length < 6 || newPassword.length > 100) {
      throw { status: 400, code: 'INVALID_PASSWORD', message: 'Invalid password' };
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw { status: 401, code: 'AUTH_FAILED', message: 'Invalid password' };

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await UserRepository.updateById(input.userId, { passwordHash });

    return { changed: true, changedAt: new Date().toISOString() };
  },
};

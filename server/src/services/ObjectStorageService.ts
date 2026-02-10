type OssConfig = {
  provider: 'oss' | 'minio';
  endpoint?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  customDomain?: string;
};

type UploadInput = {
  config: OssConfig;
  key: string;
  body: Buffer;
  mimeType: string;
};

type MinioClient = {
  putObject: (bucket: string, key: string, body: Buffer, meta: Record<string, string>) => Promise<unknown>;
};

type MinioClientConstructor = new (input: {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey?: string;
  secretKey?: string;
  region?: string;
}) => MinioClient;

type OssClient = {
  put: (key: string, body: Buffer, options: { headers: Record<string, string> }) => Promise<unknown>;
};

type OssClientConstructor = new (input: {
  region?: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  bucket?: string;
  endpoint?: string;
  secure?: boolean;
}) => OssClient;

function normalizeEndpoint(endpoint: string) {
  const trimmed = endpoint.trim().replace(/\/+$/, '');
  if (!trimmed) return { protocol: 'https', host: '' };
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const url = new URL(trimmed);
    return { protocol: url.protocol.replace(':', ''), host: url.host };
  }
  const host = trimmed.split('/')[0];
  return { protocol: 'https', host };
}

function normalizeCustomDomain(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
}

function resolvePublicBase(config: OssConfig) {
  const custom = normalizeCustomDomain(String(config.customDomain ?? ''));
  if (custom) return custom;

  const endpoint = normalizeEndpoint(String(config.endpoint ?? ''));
  if (!endpoint.host || !config.bucket) return '';

  if (config.provider === 'oss') {
    return `${endpoint.protocol}://${config.bucket}.${endpoint.host}`;
  }
  return `${endpoint.protocol}://${endpoint.host}/${config.bucket}`;
}

function resolveMinioClient(config: OssConfig) {
  const endpointRaw = String(config.endpoint ?? '').trim();
  if (!endpointRaw) return null;
  const endpoint = normalizeEndpoint(endpointRaw);
  if (!endpoint.host) return null;
  const accessKey = String(config.accessKey ?? '').trim();
  const secretKey = String(config.secretKey ?? '').trim();
  if (!accessKey || !secretKey) return null;
  const url = new URL(`${endpoint.protocol}://${endpoint.host}`);
  const port = url.port ? Number(url.port) : endpoint.protocol === 'https' ? 443 : 80;
  const useSSL = endpoint.protocol === 'https';
  const { Client: MinioClient } = require('minio') as { Client: MinioClientConstructor };
  return new MinioClient({
    endPoint: url.hostname,
    port,
    useSSL,
    accessKey,
    secretKey,
    region: config.region || 'us-east-1',
  });
}

function resolveOssClient(config: OssConfig) {
  const endpoint = normalizeEndpoint(String(config.endpoint ?? ''));
  const OSS = require('ali-oss') as OssClientConstructor;
  const options: {
    region?: string;
    accessKeyId?: string;
    accessKeySecret?: string;
    bucket?: string;
    endpoint?: string;
    secure?: boolean;
  } = {
    secure: endpoint.protocol === 'https',
  };
  if (config.region) options.region = config.region;
  if (config.accessKey) options.accessKeyId = config.accessKey;
  if (config.secretKey) options.accessKeySecret = config.secretKey;
  if (config.bucket) options.bucket = config.bucket;
  if (endpoint.host) options.endpoint = endpoint.host;
  return new OSS(options);
}

export const ObjectStorageService = {
  async uploadBuffer(input: UploadInput): Promise<{ url: string }> {
    const { config, key, body, mimeType } = input;
    if (!config.bucket || !config.endpoint || !config.accessKey || !config.secretKey) {
      throw new Error('OSS_CONFIG_INCOMPLETE');
    }

    if (config.provider === 'oss') {
      const client = resolveOssClient(config);
      await client.put(key, body, { headers: { 'Content-Type': mimeType } });
    } else if (config.provider === 'minio') {
      const client = resolveMinioClient(config);
      if (!client) throw new Error('MINIO_ENDPOINT_INVALID');
      await client.putObject(config.bucket, key, body, { 'Content-Type': mimeType });
    } else {
      throw new Error('UNSUPPORTED_STORAGE_PROVIDER');
    }

    const base = resolvePublicBase(config);
    if (!base) throw new Error('OSS_PUBLIC_BASE_MISSING');
    return { url: `${base}/${key}`.replace(/([^:]\/)\/+/g, '$1') };
  },
};

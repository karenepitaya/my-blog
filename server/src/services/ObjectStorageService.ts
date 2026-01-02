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

function resolvePublicBase(config: OssConfig) {
  const custom = String(config.customDomain ?? '').trim().replace(/\/+$/, '');
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
  const url = new URL(`${endpoint.protocol}://${endpoint.host}`);
  const port = url.port ? Number(url.port) : endpoint.protocol === 'https' ? 443 : 80;
  const useSSL = endpoint.protocol === 'https';
  const { Client: MinioClient } = require('minio') as { Client: new (input: any) => any };
  return new MinioClient({
    endPoint: url.hostname,
    port,
    useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region: config.region || 'us-east-1',
  });
}

function resolveOssClient(config: OssConfig) {
  const endpoint = normalizeEndpoint(String(config.endpoint ?? ''));
  const OSS = require('ali-oss') as any;
  return new OSS({
    region: config.region || undefined,
    accessKeyId: config.accessKey,
    accessKeySecret: config.secretKey,
    bucket: config.bucket,
    endpoint: endpoint.host || undefined,
    secure: endpoint.protocol === 'https',
  });
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

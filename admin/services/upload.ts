import { ApiEnvelope, getApiBaseUrl } from './http';
import { UserRole } from '../types';

export type UploadPurpose =
  | 'avatar'
  | 'article_cover'
  | 'favicon'
  | 'ui_icon'
  | 'audio'
  | 'video'
  | 'misc';

export type UploadResult = {
  id: string;
  url: string;
  storage: 'local' | 'oss' | 'minio';
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  purpose: UploadPurpose;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type Session = {
  token: string;
  role: UserRole;
};

const getUploadPath = (role: UserRole) => (role === UserRole.ADMIN ? '/admin/upload' : '/uploads');

export const UploadService = {
  async uploadImage(session: Session, file: File, purpose?: UploadPurpose): Promise<UploadResult> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${getUploadPath(session.role)}`;

    const formData = new FormData();
    formData.append('file', file);
    if (purpose) formData.append('purpose', purpose);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
      body: formData,
    });

    const payload = (await response.json()) as ApiEnvelope<UploadResult>;

    if (!response.ok || !payload?.success) {
      const message = payload?.error?.message ?? `HTTP ${response.status}`;
      const code = payload?.error?.code ?? 'UPLOAD_ERROR';
      throw new Error(`${code}: ${message}`);
    }

    return payload.data;
  },
};

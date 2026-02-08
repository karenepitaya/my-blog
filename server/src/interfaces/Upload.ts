export const UploadPurposes = {
  AVATAR: 'avatar',
  ARTICLE_COVER: 'article_cover',
  CATEGORY_COVER: 'category_cover',
  FAVICON: 'favicon',
  CHARACTER_AVATAR: 'character_avatar',
  UI_ICON: 'ui_icon',
  AUDIO: 'audio',
  VIDEO: 'video',
  MISC: 'misc',
} as const;

export type UploadPurpose = typeof UploadPurposes[keyof typeof UploadPurposes];
export type UploadStorage = 'local' | 'oss' | 'minio';

export interface Upload {
  _id: string;

  url: string;
  storage: UploadStorage;
  storageKey: string;

  fileName: string;
  mimeType: string;
  size: number;

  purpose: UploadPurpose;

  uploadedBy: string;

  createdAt: Date;
  updatedAt: Date;
}

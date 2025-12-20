export const UploadPurposes = {
  AVATAR: 'avatar',
  ARTICLE_COVER: 'article_cover',
  MISC: 'misc',
} as const;

export type UploadPurpose = typeof UploadPurposes[keyof typeof UploadPurposes];

export interface Upload {
  _id: string;

  url: string;
  storage: 'local';
  storageKey: string;

  fileName: string;
  mimeType: string;
  size: number;

  purpose: UploadPurpose;

  uploadedBy: string; // userId

  createdAt: Date;
  updatedAt: Date;
}

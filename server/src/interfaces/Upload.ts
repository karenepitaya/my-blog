export interface Upload {
  _id: string;

  url: string;
  fileName: string;
  mimeType: string;

  uploadedBy: string;  // userId

  createdAt: Date;
}

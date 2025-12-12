export interface Tag {
  _id: string;
  name: string;
  slug: string;

  createdBy: string;  // userId

  createdAt: Date;
}

export interface Tag {
  _id: string;

  name: string;
  slug: string;
  color?: string | null;
  effect?: 'glow' | 'pulse' | 'none';
  description?: string | null;

  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
}

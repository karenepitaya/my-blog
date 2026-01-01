export const CategoryStatuses = {
  ACTIVE: 'ACTIVE',
  PENDING_DELETE: 'PENDING_DELETE',
} as const;

export type CategoryStatus = typeof CategoryStatuses[keyof typeof CategoryStatuses];

export interface Category {
  _id: string;
  ownerId: string;

  name: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;

  status: CategoryStatus;
  deletedAt?: Date | null;
  deletedByRole?: 'admin' | 'author' | null;
  deletedBy?: string | null;
  deleteScheduledAt?: Date | null;

  adminRemark?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

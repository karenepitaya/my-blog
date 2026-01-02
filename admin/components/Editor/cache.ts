export type EditorCacheRecord = {
  id: string;
  schemaVersion: number;
  updatedAt: number;
  articleId?: string | null;
  title: string;
  summary: string;
  slug: string;
  tags: string[];
  categoryId?: string | null;
  coverImageUrl?: string | null;
  coverUploadId?: string | null;
  coverAsset?: CachedAsset | null;
  readingTimeMinutes?: number | null;
  content: string;
  uploadedAssets?: Record<string, string>;
  localAssets?: Record<string, CachedAsset>;
};

export type CachedAsset = {
  blob: Blob;
  name: string;
  type: string;
  size: number;
  lastModified: number;
};

const DB_NAME = 'admin_editor_cache';
const STORE_NAME = 'drafts';
const DB_VERSION = 1;

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const saveDraft = async (record: EditorCacheRecord) => {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(record);
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const loadDraft = async (id: string) => {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const request = tx.objectStore(STORE_NAME).get(id);
  return new Promise<EditorCacheRecord | null>((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as EditorCacheRecord) || null);
    request.onerror = () => reject(request.error);
  });
};

export const clearDraft = async (id: string) => {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

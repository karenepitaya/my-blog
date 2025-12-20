import { UserRepository } from '../repositories/UserRepository';

const ACTIVE_AUTHOR_CACHE_TTL_MS = 60 * 1000;

let activeAuthorCache:
  | {
      ids: string[];
      fetchedAt: number;
    }
  | undefined;

export async function getActiveAuthorIdsCached(): Promise<string[]> {
  const now = Date.now();
  if (activeAuthorCache && now - activeAuthorCache.fetchedAt < ACTIVE_AUTHOR_CACHE_TTL_MS) {
    return activeAuthorCache.ids;
  }

  const ids = await UserRepository.listActiveAuthorIds();
  activeAuthorCache = { ids, fetchedAt: now };
  return ids;
}

export async function isAuthorPubliclyVisible(authorId: string): Promise<boolean> {
  const ids = await getActiveAuthorIdsCached();
  return ids.includes(authorId);
}


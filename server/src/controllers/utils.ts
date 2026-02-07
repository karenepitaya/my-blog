export type PaginationDefaults = {
  page: number;
  pageSize: number;
};

export function normalizePagination(
  query: Record<string, unknown>,
  defaults: PaginationDefaults = { page: 1, pageSize: 20 }
): { page: number; pageSize: number } {
  const rawPage = Number(query.page ?? defaults.page);
  const rawPageSize = Number(query.pageSize ?? defaults.pageSize);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : defaults.page;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.floor(rawPageSize) : defaults.pageSize;
  return { page, pageSize };
}

export function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function toOptionalEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (typeof value !== 'string') return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export function pickDefined<T extends Record<string, unknown>>(
  input: T
): Partial<{ [K in keyof T]: Exclude<T[K], undefined> }> {
  const output: Partial<{ [K in keyof T]: Exclude<T[K], undefined> }> = {};
  (Object.keys(input) as Array<keyof T>).forEach((key) => {
    const value = input[key];
    if (value !== undefined) {
      output[key] = value as Exclude<T[typeof key], undefined>;
    }
  });
  return output;
}

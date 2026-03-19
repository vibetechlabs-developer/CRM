// Small runtime guards for dealing with inconsistent API payload shapes.
// Many endpoints are either a plain list `[...]` or DRF paginated `{ results: [...] }`.

export function normalizeListResponse<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const maybeResults = (payload as any).results;
    if (Array.isArray(maybeResults)) return maybeResults as T[];
  }
  return [];
}

export function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}


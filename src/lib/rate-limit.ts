import "server-only";

const hits = new Map<string, number[]>();

/**
 * Sliding-window limiter kept in process memory. Good enough for one instance;
 * use a shared store once the app runs on many.
 */
export function isRateLimited(key: string, limit = 20, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

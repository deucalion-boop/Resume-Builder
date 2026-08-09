import { createHash } from "node:crypto";

type Bucket = { count: number; resetAt: number };
type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
  source: "upstash" | "memory";
};

const buckets = new Map<string, Bucket>();
const FIXED_WINDOW_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then redis.call("PEXPIRE", KEYS[1], ARGV[1]) end
local ttl = redis.call("PTTL", KEYS[1])
return { current, ttl }
`;

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, limit, remaining: Math.max(0, limit - 1), resetAt, retryAfter: 0, source: "memory" };
  }
  current.count += 1;
  const allowed = current.count <= limit;
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
    retryAfter: allowed ? 0 : Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    source: "memory",
  };
}

function safeRedisKey(key: string) {
  return `resume-builder:rate:${createHash("sha256").update(key).digest("hex")}`;
}

/**
 * Atomic, distributed fixed-window limiter for serverless deployments.
 * Local/test environments intentionally fall back to memory. Production fails
 * closed when Upstash is configured but unavailable, preventing an outage from
 * silently disabling abuse controls.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.VERCEL_ENV === "production") {
      const resetAt = Date.now() + windowMs;
      return { allowed: false, limit, remaining: 0, resetAt, retryAfter: Math.ceil(windowMs / 1000), source: "memory" };
    }
    return memoryRateLimit(key, limit, windowMs);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(["EVAL", FIXED_WINDOW_SCRIPT, 1, safeRedisKey(key), windowMs]),
      cache: "no-store",
      signal: AbortSignal.timeout(2_500),
    });
    const payload = await response.json() as { result?: [number, number]; error?: string };
    if (!response.ok || payload.error || !Array.isArray(payload.result)) throw new Error(payload.error ?? `Upstash returned ${response.status}`);
    const [count, ttl] = payload.result.map(Number);
    const resetAt = Date.now() + Math.max(0, ttl);
    const allowed = count <= limit;
    return {
      allowed,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt,
      retryAfter: allowed ? 0 : Math.max(1, Math.ceil(ttl / 1000)),
      source: "upstash",
    };
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "rate_limit_unavailable", message: error instanceof Error ? error.message : "Unknown error" }));
    if (process.env.NODE_ENV === "production") {
      const resetAt = Date.now() + windowMs;
      return { allowed: false, limit, remaining: 0, resetAt, retryAfter: Math.ceil(windowMs / 1000), source: "memory" };
    }
    return memoryRateLimit(key, limit, windowMs);
  }
}

export function requestFingerprint(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") || "unknown";
}

export function resetRateLimitForTests() {
  if (process.env.NODE_ENV === "test") buckets.clear();
}

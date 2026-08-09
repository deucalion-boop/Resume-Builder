import { describe, expect, it } from "vitest";
import { rateLimit, requestFingerprint } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("rejects calls above the fixed-window limit", async () => {
    const key = `test-${crypto.randomUUID()}`;
    expect((await rateLimit(key, 2, 60_000)).allowed).toBe(true);
    expect((await rateLimit(key, 2, 60_000)).allowed).toBe(true);
    expect((await rateLimit(key, 2, 60_000)).allowed).toBe(false);
  });

  it("returns quota metadata and extracts the trusted proxy address", async () => {
    const result = await rateLimit(`test-${crypto.randomUUID()}`, 3, 10_000);
    expect(result).toMatchObject({ allowed: true, limit: 3, remaining: 2, retryAfter: 0, source: "memory" });
    expect(result.resetAt).toBeGreaterThan(Date.now());
    const request = new Request("https://example.com", { headers: { "x-forwarded-for": "203.0.113.8, 10.0.0.1" } });
    expect(requestFingerprint(request)).toBe("203.0.113.8");
  });
});

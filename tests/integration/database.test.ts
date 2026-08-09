import { describe, expect, it } from "vitest";

describe.skipIf(!process.env.TEST_DATABASE_URL)("Prisma integration", () => {
  it("connects to the isolated test database", async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const { prisma } = await import("@/lib/prisma");
    await expect(prisma.user.count()).resolves.toBeGreaterThanOrEqual(0);
  });
});

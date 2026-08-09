import { describe, expect, it } from "vitest";
import { resumePatchSchema, slugSchema } from "@/lib/validation/resume";
import { demoResume } from "@/lib/demo-data";

describe("resume validation", () => {
  it("accepts the complete demo resume payload", () => {
    expect(resumePatchSchema.safeParse(demoResume).success).toBe(true);
  });
  it("rejects unsafe public slugs", () => {
    expect(slugSchema.safeParse("../admin").success).toBe(false);
    expect(slugSchema.safeParse("maya-product-designer").success).toBe(true);
  });
  it("rejects invalid accent colors and oversized content", () => {
    expect(resumePatchSchema.safeParse({ ...demoResume, accentColor: "javascript:alert(1)" }).success).toBe(false);
    expect(resumePatchSchema.safeParse({ ...demoResume, summary: "x".repeat(4001) }).success).toBe(false);
  });
});

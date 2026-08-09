import { describe, expect, it } from "vitest";
import { safeRedirectPath, sameOrigin } from "@/lib/http";

describe("HTTP security helpers", () => {
  it("accepts only same-scheme same-host mutation origins", () => {
    expect(sameOrigin(new Request("https://app.example.com/api/profile", { headers: { origin: "https://app.example.com" } }))).toBe(true);
    expect(sameOrigin(new Request("https://app.example.com/api/profile", { headers: { origin: "http://app.example.com" } }))).toBe(false);
    expect(sameOrigin(new Request("https://app.example.com/api/profile", { headers: { origin: "https://evil.example" } }))).toBe(false);
  });

  it("blocks protocol-relative and backslash open redirects", () => {
    expect(safeRedirectPath("/resumes/one?tab=edit")).toBe("/resumes/one?tab=edit");
    expect(safeRedirectPath("//evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("https://evil.example")).toBe("/dashboard");
  });
});

import { describe, expect, it } from "vitest";
import { moderationActionSchema, settingsSchema, userActionSchema, userListSchema } from "@/features/admin/shared/schemas";

const defaultPlatformSettings = {
  applicationName: "Resumly", supportEmail: "support@example.com", logoUrl: "", faviconUrl: "",
  registrationEnabled: true, maintenanceMode: false, enabledOAuthProviders: ["google", "github"],
  uploadLimitMb: 5, accountRetentionDays: 30, allowedImageTypes: ["image/jpeg"], availableFonts: ["Inter"],
  colorThemes: ["#6D5DFB"], enabledSections: ["personal"], announcement: "",
  privacyPolicyUrl: "", termsUrl: "", seoTitle: "Resume Builder", seoDescription: "Build a professional resume.",
};

describe("administrator input validation", () => {
  it("normalizes and caps user pagination", () => {
    const parsed = userListSchema.parse({ page: "2", pageSize: "100", q: "  admin  " });
    expect(parsed).toMatchObject({ page: 2, pageSize: 100, q: "admin", role: "ALL", status: "ALL" });
    expect(() => userListSchema.parse({ pageSize: 101 })).toThrow();
  });

  it("requires reasons for account and moderation actions", () => {
    expect(userActionSchema.safeParse({ action: "suspend", reason: "" }).success).toBe(false);
    expect(userActionSchema.safeParse({ action: "set_role", role: "ADMIN", reason: "Approved by owner" }).success).toBe(true);
    expect(moderationActionSchema.safeParse({ action: "disable_link", reason: "Spam report confirmed" }).success).toBe(true);
  });

  it("rejects unsafe or unsupported platform settings", () => {
    expect(settingsSchema.safeParse(defaultPlatformSettings).success).toBe(true);
    expect(settingsSchema.safeParse({ ...defaultPlatformSettings, logoUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...defaultPlatformSettings, uploadLimitMb: 500 }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...defaultPlatformSettings, accountRetentionDays: 0 }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...defaultPlatformSettings, colorThemes: ["red"] }).success).toBe(false);
  });
});

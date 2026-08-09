import "server-only";

import { prisma } from "@/lib/prisma";
import type { z } from "zod";
import type { settingsSchema } from "@/features/admin/shared/schemas";
import { writeAdminAudit } from "@/features/admin/shared/server/audit";

export type PlatformSettings = z.infer<typeof settingsSchema>;

export const defaultPlatformSettings: PlatformSettings = {
  applicationName: "Resumly",
  supportEmail: "support@example.com",
  logoUrl: "",
  faviconUrl: "",
  registrationEnabled: true,
  maintenanceMode: false,
  enabledOAuthProviders: ["google", "github"],
  uploadLimitMb: 5,
  accountRetentionDays: 30,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  availableFonts: ["Inter", "Georgia", "Arial"],
  colorThemes: ["#0877C9", "#1597D4", "#0E7490", "#0F766E"],
  enabledSections: ["personal", "summary", "experience", "education", "skills", "projects", "certifications", "languages", "awards", "interests", "references"],
  announcement: "",
  privacyPolicyUrl: "",
  termsUrl: "",
  seoTitle: "Resumly — Build a resume that gets noticed",
  seoDescription: "Create polished, ATS-friendly resumes with smart guidance and beautiful templates.",
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const record = await prisma.systemSetting.findUnique({ where: { key: "platform" } });
  if (!record) return defaultPlatformSettings;
  const value = record.value as Partial<PlatformSettings>;
  return { ...defaultPlatformSettings, ...value };
}

export async function updatePlatformSettings(request: Request, actorId: string, value: PlatformSettings) {
  await prisma.systemSetting.upsert({
    where: { key: "platform" },
    create: { key: "platform", value, description: "Global Resume Builder platform configuration.", updatedById: actorId },
    update: { value, updatedById: actorId },
  });
  await writeAdminAudit({
    request, actorId, category: "SETTINGS", severity: value.maintenanceMode ? "WARNING" : "INFO",
    action: "settings.platform.update", summary: "Updated global platform settings.",
    targetType: "SystemSetting", targetId: "platform",
    metadata: { registrationEnabled: value.registrationEnabled, maintenanceMode: value.maintenanceMode, uploadLimitMb: value.uploadLimitMb },
  });
  return value;
}

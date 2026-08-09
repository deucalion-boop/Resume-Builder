import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/features/admin/settings/server/settings-service";

export async function GET() {
  const [settings, configuredTemplates] = await Promise.all([
    getPlatformSettings().catch(() => null),
    prisma.templateConfiguration.findMany({ where: { enabled: true }, orderBy: { position: "asc" }, select: { key: true, name: true } }).catch(() => []),
  ]);
  const resolvedSettings = settings ?? {
    applicationName: "Resumly", announcement: "", uploadLimitMb: 5,
    allowedImageTypes: ["image/jpeg", "image/png", "image/webp"], availableFonts: ["Inter", "Georgia", "Arial"],
    colorThemes: ["#0877C9", "#1597D4", "#0E7490"], enabledSections: [],
  };
  const templates = configuredTemplates.length ? configuredTemplates : [
    { key: "clarity", name: "Clarity" }, { key: "modern", name: "Modern" }, { key: "executive", name: "Executive" },
  ];
  return Response.json({
    applicationName: resolvedSettings.applicationName,
    announcement: resolvedSettings.announcement,
    uploadLimitMb: resolvedSettings.uploadLimitMb,
    allowedImageTypes: resolvedSettings.allowedImageTypes,
    availableFonts: resolvedSettings.availableFonts,
    colorThemes: resolvedSettings.colorThemes,
    enabledSections: resolvedSettings.enabledSections,
    templates,
  }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}

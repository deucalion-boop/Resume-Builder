import { NextResponse } from "next/server";
import { settingsSchema } from "@/features/admin/shared/schemas";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { getPlatformSettings, updatePlatformSettings } from "@/features/admin/settings/server/settings-service";

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    return NextResponse.json({ ok: true, data: await getPlatformSettings() });
  } catch (error) {
    return adminRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireAdminRequest(request, true);
    const input = settingsSchema.parse(await request.json());
    return NextResponse.json({ ok: true, data: await updatePlatformSettings(request, profile.id, input) });
  } catch (error) {
    return adminRouteError(error);
  }
}

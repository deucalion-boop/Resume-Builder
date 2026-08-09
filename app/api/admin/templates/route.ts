import { NextResponse } from "next/server";
import { templateActionSchema } from "@/features/admin/shared/schemas";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { getTemplateConfigurations, setTemplateAvailability } from "@/features/admin/moderation/server/moderation-service";

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    return NextResponse.json({ ok: true, data: await getTemplateConfigurations() });
  } catch (error) {
    return adminRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireAdminRequest(request, true);
    const input = templateActionSchema.parse(await request.json());
    return NextResponse.json({ ok: true, data: await setTemplateAvailability(request, profile.id, input.key, input.enabled) });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_TEMPLATE") {
      return NextResponse.json({ ok: false, error: { code: "LAST_TEMPLATE", message: "At least one template must remain enabled." } }, { status: 409 });
    }
    return adminRouteError(error);
  }
}

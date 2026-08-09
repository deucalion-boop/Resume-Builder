import { NextResponse } from "next/server";
import { idSchema, moderationActionSchema } from "@/features/admin/shared/schemas";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { getModerationDetail, performModerationAction } from "@/features/admin/moderation/server/moderation-service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const id = idSchema.parse((await params).id);
    return NextResponse.json({ ok: true, data: await getModerationDetail(id) });
  } catch (error) {
    return adminRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await requireAdminRequest(request, true);
    const id = idSchema.parse((await params).id);
    const action = moderationActionSchema.parse(await request.json());
    return NextResponse.json(await performModerationAction(request, profile.id, id, action));
  } catch (error) {
    return adminRouteError(error);
  }
}

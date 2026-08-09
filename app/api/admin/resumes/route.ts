import { NextResponse } from "next/server";
import { moderationListSchema } from "@/features/admin/shared/schemas";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { listModerationResumes } from "@/features/admin/moderation/server/moderation-service";

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    const input = moderationListSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json({ ok: true, data: await listModerationResumes(input) });
  } catch (error) {
    return adminRouteError(error);
  }
}

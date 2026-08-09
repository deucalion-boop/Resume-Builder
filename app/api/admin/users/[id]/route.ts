import { NextResponse } from "next/server";
import { idSchema, userActionSchema } from "@/features/admin/shared/schemas";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { getAdminUserDetail, performUserAction } from "@/features/admin/users/server/users-service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    const id = idSchema.parse((await params).id);
    return NextResponse.json({ ok: true, data: await getAdminUserDetail(id) });
  } catch (error) {
    return adminRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await requireAdminRequest(request, true);
    const id = idSchema.parse((await params).id);
    const action = userActionSchema.parse(await request.json());
    return NextResponse.json(await performUserAction(request, profile.id, id, action));
  } catch (error) {
    return adminRouteError(error);
  }
}

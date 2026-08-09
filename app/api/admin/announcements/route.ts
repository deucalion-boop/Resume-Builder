import { NextResponse } from "next/server";
import { z } from "zod";
import { announcementSchema, idSchema } from "@/features/admin/shared/schemas";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { deleteAnnouncement, saveAnnouncement } from "@/features/admin/support/server/support-service";

export async function POST(request: Request) {
  try {
    const { profile } = await requireAdminRequest(request, true);
    const input = announcementSchema.parse(await request.json());
    return NextResponse.json({ ok: true, data: await saveAnnouncement(request, profile.id, input) });
  } catch (error) {
    return adminRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile } = await requireAdminRequest(request, true);
    const { id } = z.object({ id: idSchema }).parse(await request.json());
    await deleteAnnouncement(request, profile.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminRouteError(error);
  }
}

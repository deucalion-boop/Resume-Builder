import { NextResponse } from "next/server";
import { idSchema, ticketActionSchema } from "@/features/admin/shared/schemas";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { getSupportTicket, performTicketAction } from "@/features/admin/support/server/support-service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminRequest(request);
    return NextResponse.json({ ok: true, data: await getSupportTicket(idSchema.parse((await params).id)) });
  } catch (error) {
    return adminRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await requireAdminRequest(request, true);
    const id = idSchema.parse((await params).id);
    const action = ticketActionSchema.parse(await request.json());
    return NextResponse.json(await performTicketAction(request, profile.id, id, action));
  } catch (error) {
    return adminRouteError(error);
  }
}

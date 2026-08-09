import { NextResponse } from "next/server";
import { faqSchema } from "@/features/admin/shared/schemas";
import { requireAdminRequest } from "@/features/admin/shared/server/admin-auth";
import { adminRouteError } from "@/features/admin/shared/server/route";
import { deleteFaq, saveFaq } from "@/features/admin/support/server/support-service";

export async function POST(request: Request) {
  try {
    const { profile } = await requireAdminRequest(request, true);
    const input = faqSchema.parse(await request.json());
    return NextResponse.json({ ok: true, data: await saveFaq(request, profile.id, input) });
  } catch (error) {
    return adminRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile } = await requireAdminRequest(request, true);
    const input = faqSchema.pick({ id: true }).required().parse(await request.json());
    await deleteFaq(request, profile.id, input.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminRouteError(error);
  }
}

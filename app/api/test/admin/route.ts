import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createSchema = z.object({ email: z.email(), password: z.string().min(16).max(200) });
const deleteSchema = z.object({ id: z.uuid() });

function authorized(request: Request) {
  return process.env.E2E_ADMIN_TEST === "1"
    && Boolean(process.env.E2E_ADMIN_SECRET)
    && request.headers.get("x-e2e-secret") === process.env.E2E_ADMIN_SECRET;
}

export async function POST(request: Request) {
  if (!authorized(request)) return new Response(null, { status: 404 });
  const input = createSchema.parse(await request.json());
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({ email: input.email, password: input.password, email_confirm: true, user_metadata: { full_name: "E2E Administrator" } });
  if (error || !data.user) return Response.json({ ok: false }, { status: 500 });
  try {
    await prisma.user.create({ data: { id: data.user.id, email: input.email, name: "E2E Administrator", role: "ADMIN", status: "ACTIVE", emailVerifiedAt: new Date(), authProvider: "email" } });
    return Response.json({ ok: true, id: data.user.id }, { status: 201 });
  } catch {
    await supabase.auth.admin.deleteUser(data.user.id);
    return Response.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!authorized(request)) return new Response(null, { status: 404 });
  const { id } = deleteSchema.parse(await request.json());
  await prisma.user.deleteMany({ where: { id } });
  await createSupabaseAdminClient().auth.admin.deleteUser(id);
  return Response.json({ ok: true });
}

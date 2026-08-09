import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { listResumesPage } from "@/services/resume-service";

const querySchema = z.object({
  q: z.string().max(120).default(""),
  sort: z.enum(["updated", "created", "name"]).default("updated"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  template: z.enum(["clarity", "modern", "executive"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Authentication required.", 401);
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid resume filters.", 400, parsed.error.flatten());
  return Response.json({ ok: true, ...(await listResumesPage(user.id, { query: parsed.data.q, ...parsed.data })) });
}

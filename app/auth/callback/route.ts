import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { safeRedirectPath } from "@/lib/http";
import type { EmailOtpType } from "@supabase/supabase-js";

const emailOtpTypes = new Set<EmailOtpType>(["email", "signup", "invite", "magiclink", "recovery", "email_change"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const requestedType = url.searchParams.get("type");
  const next = url.searchParams.get("next") || "/dashboard";
  const providerError = url.searchParams.get("error_code");
  if (providerError) return NextResponse.redirect(new URL("/auth-error?message=expired-or-used", url.origin));
  if (!code && (!tokenHash || !requestedType || !emailOtpTypes.has(requestedType as EmailOtpType))) {
    return NextResponse.redirect(new URL("/auth-error?message=invalid", url.origin));
  }
  const supabase = await createSupabaseServerClient();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/auth-error?message=expired-or-used", url.origin));
  } else {
    const type = requestedType as EmailOtpType;
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash!, type });
    if (error) return NextResponse.redirect(new URL("/auth-error?message=expired-or-used", url.origin));
  }
  const { data } = await supabase.auth.getUser();
  const authenticatedUserId = data.user?.id;
  if (!authenticatedUserId) return NextResponse.redirect(new URL("/auth-error?message=session", url.origin));
  let safeNext = requestedType === "recovery" ? "/reset-password" : safeRedirectPath(next);
  if (authenticatedUserId && safeNext === "/dashboard") {
    const profile = await prisma.user.findUnique({ where: { id: authenticatedUserId }, select: { role: true, mustChangePassword: true } });
    if (profile?.mustChangePassword) safeNext = "/change-password";
    else if (profile?.role === "ADMIN") safeNext = "/admin";
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}

import { NextResponse } from "next/server";

export function apiError(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export function safeRedirectPath(candidate: string | null | undefined, fallback = "/dashboard") {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\") || /[\u0000-\u001F\u007F]/.test(candidate)) return fallback;
  try {
    const base = new URL("https://redirect-validation.invalid");
    const resolved = new URL(candidate, base);
    if (resolved.origin !== base.origin) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}

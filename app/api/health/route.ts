import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      database: "reachable",
      latencyMs: Math.round(performance.now() - startedAt),
      release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? process.env.npm_package_version ?? "development",
      timestamp: new Date().toISOString(),
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({
      status: "degraded",
      database: "unreachable",
      timestamp: new Date().toISOString(),
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}

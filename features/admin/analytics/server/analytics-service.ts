import "server-only";

import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function startOfUtcDay(date: Date) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

async function getStorageBytes() {
  try {
    const supabase = createSupabaseAdminClient();
    let bytes = 0;
    let cursor: string | undefined;
    do {
      const { data, error } = await supabase.storage.from("resume-photos").listV2({ limit: 1000, cursor, with_delimiter: false });
      if (error) return null;
      for (const file of data.objects) bytes += Number(file.metadata?.size ?? 0);
      cursor = data.hasNext ? data.nextCursor : undefined;
    } while (cursor);
    return bytes;
  } catch {
    return null;
  }
}

export async function getAdminAnalytics() {
  const now = new Date();
  const since30 = startOfUtcDay(new Date(now.getTime() - 29 * 86_400_000));
  const since7 = startOfUtcDay(new Date(now.getTime() - 6 * 86_400_000));
  const queryStarted = performance.now();
  const [totalUsers, activeUsers, newUsers30, newUsers7, totalResumes, publicResumes, events, templates, recentUsers, recentResumes, storageBytes] = await Promise.all([
    prisma.user.count({ where: { status: { not: "DELETED" } } }),
    prisma.user.count({ where: { status: "ACTIVE", lastActiveAt: { gte: since30 } } }),
    prisma.user.count({ where: { createdAt: { gte: since30 } } }),
    prisma.user.count({ where: { createdAt: { gte: since7 } } }),
    prisma.resume.count(),
    prisma.resume.count({ where: { isPublic: true } }),
    prisma.resumeEvent.findMany({ where: { createdAt: { gte: since30 } }, select: { type: true, dayKey: true, createdAt: true } }),
    prisma.resume.groupBy({ by: ["template"], _count: { _all: true }, orderBy: { _count: { template: "desc" } } }),
    prisma.user.findMany({ where: { createdAt: { gte: since30 } }, select: { createdAt: true } }),
    prisma.resume.findMany({ where: { createdAt: { gte: since30 } }, select: { createdAt: true } }),
    getStorageBytes(),
  ]);
  const databaseLatencyMs = Math.round(performance.now() - queryStarted);
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(since30); date.setUTCDate(date.getUTCDate() + index);
    return { day: date.toISOString().slice(0, 10), users: 0, resumes: 0, views: 0, downloads: 0 };
  });
  const byDay = new Map(days.map(day => [day.day, day]));
  for (const user of recentUsers) {
    const point = byDay.get(user.createdAt.toISOString().slice(0, 10)); if (point) point.users += 1;
  }
  for (const resume of recentResumes) {
    const point = byDay.get(resume.createdAt.toISOString().slice(0, 10)); if (point) point.resumes += 1;
  }
  for (const event of events) {
    const point = byDay.get(event.dayKey); if (!point) continue;
    if (event.type === "VIEW") point.views += 1; else point.downloads += 1;
  }
  const views = events.filter(event => event.type === "VIEW").length;
  const downloads = events.filter(event => event.type === "DOWNLOAD").length;
  const weekly = Array.from({ length: 5 }, (_, index) => {
    const slice = days.slice(Math.max(0, 30 - (index + 1) * 7), 30 - index * 7);
    return {
      label: index === 0 ? "This week" : `${index} week${index === 1 ? "" : "s"} ago`,
      views: slice.reduce((sum, day) => sum + day.views, 0),
      downloads: slice.reduce((sum, day) => sum + day.downloads, 0),
      users: slice.reduce((sum, day) => sum + day.users, 0),
    };
  }).reverse();
  return {
    totals: {
      totalUsers, activeUsers, newUsers30, newUsers7, totalResumes, publicResumes, views, downloads,
      conversionRate: views ? Number((downloads / views * 100).toFixed(1)) : 0,
      storageBytes, databaseLatencyMs,
    },
    days, weekly,
    templates: templates.map(item => ({ template: item.template, count: item._count._all })),
    generatedAt: new Date().toISOString(),
  };
}

export function analyticsToCsv(data: Awaited<ReturnType<typeof getAdminAnalytics>>) {
  const header = "date,new_users,new_resumes,public_views,pdf_downloads";
  const rows = data.days.map(day => `${day.day},${day.users},${day.resumes},${day.views},${day.downloads}`);
  return [header, ...rows].join("\n");
}

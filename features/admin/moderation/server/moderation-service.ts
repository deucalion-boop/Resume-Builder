import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAdminAudit } from "@/features/admin/shared/server/audit";
import type { z } from "zod";
import type { moderationActionSchema, moderationListSchema } from "@/features/admin/shared/schemas";

type ModerationListInput = z.infer<typeof moderationListSchema>;
type ModerationAction = z.infer<typeof moderationActionSchema>;

export async function listModerationResumes(input: ModerationListInput) {
  const where: Prisma.ResumeWhereInput = {
    AND: [
      { OR: [{ isPublic: true }, { reports: { some: {} } }, { moderationHiddenAt: { not: null } }] },
      ...(input.q ? [{ OR: [
        { title: { contains: input.q, mode: "insensitive" as const } },
        { slug: { contains: input.q, mode: "insensitive" as const } },
        { user: { email: { contains: input.q, mode: "insensitive" as const } } },
      ] }] : []),
      ...(input.status === "ALL" ? [] : [{ reports: { some: { status: input.status } } }]),
    ],
  };
  const orderBy: Prisma.ResumeOrderByWithRelationInput[] = input.sort === "views"
    ? [{ events: { _count: "desc" } }, { updatedAt: "desc" }]
    : input.sort === "reports" ? [{ reports: { _count: "desc" } }, { updatedAt: "desc" }]
    : [{ updatedAt: "desc" }];
  const [rows, total] = await prisma.$transaction([
    prisma.resume.findMany({
      where, orderBy, skip: (input.page - 1) * input.pageSize, take: input.pageSize,
      select: {
        id: true, title: true, slug: true, isPublic: true, status: true, template: true,
        moderationHiddenAt: true, moderationReason: true, updatedAt: true,
        user: { select: { id: true, email: true, name: true, status: true } },
        reports: { orderBy: { createdAt: "desc" }, take: 5 },
        events: { where: { createdAt: { gte: new Date(Date.now() - 86_400_000) } }, select: { type: true } },
        _count: { select: { reports: true, events: true } },
      },
    }),
    prisma.resume.count({ where }),
  ]);
  const items = rows.map(row => {
    const views24h = row.events.filter(event => event.type === "VIEW").length;
    const downloads24h = row.events.filter(event => event.type === "DOWNLOAD").length;
    const suspicious = views24h >= 100 || downloads24h >= 30 || (views24h >= 20 && downloads24h / views24h > .8);
    return { ...row, events: undefined, views24h, downloads24h, suspicious };
  }).filter(row => input.suspicious === "ALL" || row.suspicious);
  return { items, pagination: { page: input.page, pageSize: input.pageSize, total, pages: Math.max(1, Math.ceil(total / input.pageSize)) } };
}

export async function getModerationDetail(id: string) {
  const resume = await prisma.resume.findUnique({
    where: { id },
    select: {
      id: true, title: true, slug: true, isPublic: true, status: true, template: true,
      moderationHiddenAt: true, moderationReason: true, createdAt: true, updatedAt: true,
      user: { select: { id: true, email: true, name: true, status: true } },
      reports: { orderBy: { createdAt: "desc" } },
      moderation: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true, email: true } } } },
      events: { orderBy: { createdAt: "desc" }, take: 250, select: { type: true, dayKey: true, createdAt: true, visitorHash: true } },
    },
  });
  if (!resume) throw new Error("NOT_FOUND");
  return resume;
}

export async function performModerationAction(request: Request, actorId: string, resumeId: string, action: ModerationAction) {
  const resume = await prisma.resume.findUnique({ where: { id: resumeId }, select: { id: true, title: true, slug: true } });
  if (!resume) throw new Error("NOT_FOUND");
  let summary = "";
  let metadata: Prisma.InputJsonValue | undefined;

  if (action.action === "disable_link") {
    await prisma.resume.update({ where: { id: resumeId }, data: { isPublic: false, status: "DRAFT", moderationHiddenAt: new Date(), moderationReason: action.reason } });
    summary = `Disabled the public link for “${resume.title}”.`;
  } else if (action.action === "regenerate_link") {
    const slug = `${resume.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
    await prisma.resume.update({ where: { id: resumeId }, data: { slug, moderationHiddenAt: null, moderationReason: null } });
    summary = `Regenerated the public link for “${resume.title}”.`;
    metadata = { previousSlug: resume.slug, newSlug: slug };
  } else if (action.action === "remove_content") {
    await prisma.resume.update({ where: { id: resumeId }, data: { isPublic: false, status: "ARCHIVED", archivedAt: new Date(), moderationHiddenAt: new Date(), moderationReason: action.reason } });
    summary = `Removed “${resume.title}” from public access and archived it for owner review.`;
  } else {
    const report = await prisma.resumeReport.findFirst({ where: { id: action.reportId, resumeId } });
    if (!report) throw new Error("NOT_FOUND");
    await prisma.resumeReport.update({ where: { id: report.id }, data: { status: action.status } });
    summary = `Marked report ${report.id} as ${action.status.toLowerCase().replace("_", " ")}.`;
    metadata = { reportId: report.id, status: action.status };
  }

  await prisma.resumeModerationAction.create({
    data: { resumeId, actorId, action: action.action, reason: action.reason, metadata },
  });
  await writeAdminAudit({
    request, actorId, category: "RESUME", severity: action.action === "regenerate_link" ? "INFO" : "WARNING",
    action: `resume.${action.action}`, summary, targetType: "Resume", targetId: resumeId,
    metadata: { reason: action.reason, ...(metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {}) },
  });
  return { ok: true, summary };
}

export async function getTemplateConfigurations() {
  const defaults = [
    { key: "clarity", name: "Clarity", description: "Clean ATS-first single column.", position: 0 },
    { key: "modern", name: "Modern", description: "Contemporary presentation with restrained color.", position: 1 },
    { key: "executive", name: "Executive", description: "Traditional leadership-focused layout.", position: 2 },
  ];
  await Promise.all(defaults.map(item => prisma.templateConfiguration.upsert({ where: { key: item.key }, create: item, update: {} })));
  return prisma.templateConfiguration.findMany({ orderBy: { position: "asc" } });
}

export async function setTemplateAvailability(request: Request, actorId: string, key: string, enabled: boolean) {
  if (!enabled) {
    const enabledCount = await prisma.templateConfiguration.count({ where: { enabled: true } });
    const target = await prisma.templateConfiguration.findUnique({ where: { key } });
    if (target?.enabled && enabledCount <= 1) throw new Error("LAST_TEMPLATE");
  }
  const template = await prisma.templateConfiguration.update({ where: { key }, data: { enabled } });
  await writeAdminAudit({
    request, actorId, category: "SETTINGS", action: "template.availability",
    summary: `${enabled ? "Enabled" : "Disabled"} the ${template.name} template.`,
    targetType: "TemplateConfiguration", targetId: template.id, metadata: { key, enabled },
  });
  return template;
}

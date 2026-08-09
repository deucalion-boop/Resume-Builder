import "server-only";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { defaultSections } from "@/lib/demo-data";
import type { ResumeDraft, ResumeSummary } from "@/types/resume";
import { getPlatformSettings } from "@/features/admin/settings/server/settings-service";

const resumeInclude = {
  personalInfo: true,
  sections: { orderBy: { position: "asc" as const } },
  experience: { orderBy: { position: "asc" as const } },
  education: { orderBy: { position: "asc" as const } },
  skills: { orderBy: { position: "asc" as const } },
  projects: { orderBy: { position: "asc" as const } },
  certifications: { orderBy: { position: "asc" as const } },
  languages: { orderBy: { position: "asc" as const } },
  awards: { orderBy: { position: "asc" as const } },
  interests: { orderBy: { position: "asc" as const } },
  references: { orderBy: { position: "asc" as const } },
} satisfies Prisma.ResumeInclude;

type ResumeRecord = Prisma.ResumeGetPayload<{ include: typeof resumeInclude }>;

function year(value: Date | null) {
  return value ? String(value.getUTCFullYear()) : "";
}

function toDraft(resume: ResumeRecord): ResumeDraft {
  const info = resume.personalInfo;
  return {
    id: resume.id,
    title: resume.title,
    slug: resume.slug,
    template: resume.template as ResumeDraft["template"],
    fontFamily: resume.fontFamily as ResumeDraft["fontFamily"],
    accentColor: resume.accentColor,
    spacing: resume.spacing as ResumeDraft["spacing"],
    paperSize: resume.paperSize as ResumeDraft["paperSize"],
    isPublic: resume.isPublic,
    revision: resume.revision,
    status: resume.status,
    updatedAt: resume.updatedAt.toISOString(),
    completion: resume.completion,
    personal: {
      firstName: info?.firstName ?? "",
      lastName: info?.lastName ?? "",
      jobTitle: info?.jobTitle ?? "",
      email: info?.email ?? "",
      phone: info?.phone ?? "",
      location: [info?.city, info?.country].filter(Boolean).join(", "),
      website: info?.website ?? "",
      linkedin: info?.linkedin ?? "",
      photoUrl: info?.photoUrl ?? undefined,
    },
    summary: resume.summary,
    experience: resume.experience.map((item) => ({
      id: item.id, company: item.company, role: item.role, location: item.location ?? "",
      startDate: year(item.startDate), endDate: item.current ? "Present" : year(item.endDate),
      description: item.description ?? "",
    })),
    education: resume.education.map((item) => ({
      id: item.id, school: item.school, degree: [item.degree, item.field].filter(Boolean).join(", "),
      location: item.location ?? "", startDate: year(item.startDate), endDate: year(item.endDate),
      description: item.description ?? "",
    })),
    skills: resume.skills.map((item) => item.name),
    projects: resume.projects.map((item) => ({ id: item.id, name: item.name, url: item.url ?? "", description: item.description ?? "" })),
    certifications: resume.certifications.map((item) => ({ id: item.id, name: item.name, issuer: item.issuer, date: year(item.issueDate) })),
    languages: resume.languages.map((item) => ({ id: item.id, name: item.name, proficiency: item.proficiency })),
    awards: resume.awards.map((item) => ({ id: item.id, title: item.title, issuer: item.issuer ?? "", date: year(item.awardedAt) })),
    interests: resume.interests.map((item) => item.name),
    references: resume.references.map((item) => ({ id: item.id, name: item.name, relationship: item.relationship ?? "", email: item.email ?? "" })),
    sections: resume.sections.map((item) => ({ id: item.key as ResumeDraft["sections"][number]["id"], label: item.label, visible: item.isVisible })),
  };
}

export async function ensureUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  await prisma.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email ?? `${user.id}@unknown.local`, name },
    update: { email: user.email ?? undefined, name: name ?? undefined },
  });
}

export async function listResumes(userId: string, query = "", sort = "updated") {
  const rows = await prisma.resume.findMany({
    where: { userId, ...(query ? { title: { contains: query, mode: "insensitive" } } : {}) },
    orderBy: sort === "name" ? { title: "asc" } : sort === "created" ? { createdAt: "desc" } : { updatedAt: "desc" },
    include: { _count: { select: { events: true } }, events: { select: { type: true } } },
  });
  return rows.map((resume): ResumeSummary => ({
    id: resume.id, title: resume.title, slug: resume.slug,
    template: resume.template as ResumeSummary["template"], updatedAt: resume.updatedAt.toISOString(),
    completion: resume.completion, isPublic: resume.isPublic, status: resume.status,
    views: resume.events.filter((event) => event.type === "VIEW").length,
    downloads: resume.events.filter((event) => event.type === "DOWNLOAD").length,
  }));
}

export async function listResumesPage(userId: string, options: { query?: string; sort?: string; status?: string; template?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize || 12));
  const where: Prisma.ResumeWhereInput = {
    userId,
    ...(options.query ? { title: { contains: options.query, mode: "insensitive" } } : {}),
    ...(options.status === "ARCHIVED" ? { archivedAt: { not: null } } : options.status ? { status: options.status as "DRAFT" | "PUBLISHED" } : { archivedAt: null }),
    ...(options.template ? { template: options.template } : {}),
  };
  const orderBy: Prisma.ResumeOrderByWithRelationInput = options.sort === "name" ? { title: "asc" } : options.sort === "created" ? { createdAt: "desc" } : { updatedAt: "desc" };
  const [rows, total] = await prisma.$transaction([
    prisma.resume.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { events: { select: { type: true } } } }),
    prisma.resume.count({ where }),
  ]);
  return {
    items: rows.map((resume): ResumeSummary => ({ id: resume.id, title: resume.title, slug: resume.slug, template: resume.template as ResumeSummary["template"], updatedAt: resume.updatedAt.toISOString(), completion: resume.completion, isPublic: resume.isPublic, status: resume.status, views: resume.events.filter(event => event.type === "VIEW").length, downloads: resume.events.filter(event => event.type === "DOWNLOAD").length })),
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  };
}

export async function getResume(userId: string, id: string) {
  const resume = await prisma.resume.findFirst({ where: { id, userId }, include: resumeInclude });
  return resume ? toDraft(resume) : null;
}

export async function getPublicResume(slug: string) {
  const resume = await prisma.resume.findFirst({ where: { slug, isPublic: true }, include: resumeInclude });
  if (!resume) return null;
  return toDraft(resume);
}

export async function getPublicResumeOwner(slug: string) {
  return prisma.resume.findFirst({ where: { slug, isPublic: true }, select: { id: true, userId: true } });
}

export async function recordResumeEvent(resumeId: string, type: "VIEW" | "DOWNLOAD", visitorHash?: string) {
  const dayKey = new Date().toISOString().slice(0, 10);
  if (visitorHash) {
    await prisma.resumeEvent.upsert({
      where: { resumeId_type_visitorHash_dayKey: { resumeId, type, visitorHash, dayKey } },
      create: { resumeId, type, visitorHash, dayKey },
      update: {},
    });
  } else {
    await prisma.resumeEvent.create({ data: { resumeId, type, dayKey } });
  }
}

export async function getDashboardAnalytics(userId: string) {
  const since = new Date(); since.setUTCDate(since.getUTCDate() - 29); since.setUTCHours(0, 0, 0, 0);
  const [resumeCount, events, recent] = await Promise.all([
    prisma.resume.count({ where: { userId, archivedAt: null } }),
    prisma.resumeEvent.findMany({ where: { resume: { userId }, createdAt: { gte: since } }, select: { type: true, dayKey: true, visitorHash: true } }),
    prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, updatedAt: true } }),
  ]);
  const days = Array.from({ length: 30 }, (_, offset) => {
    const date = new Date(since); date.setUTCDate(date.getUTCDate() + offset);
    const day = date.toISOString().slice(0, 10);
    return { day, views: 0, downloads: 0 };
  });
  const byDay = new Map(days.map(day => [day.day, day]));
  for (const event of events) {
    const point = byDay.get(event.dayKey); if (!point) continue;
    if (event.type === "VIEW") point.views += 1; else point.downloads += 1;
  }
  const views = events.filter(event => event.type === "VIEW").length;
  const downloads = events.filter(event => event.type === "DOWNLOAD").length;
  return { resumeCount, views, downloads, conversion: views ? Math.round(downloads / views * 100) : 0, days, recent: recent.map(item => ({ ...item, updatedAt: item.updatedAt.toISOString() })) };
}

function slugify(title: string) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${crypto.randomUUID().slice(0, 7)}`;
}

export async function createResume(userId: string, title: string, template: string) {
  const [configuredTemplate, settings] = await Promise.all([
    prisma.templateConfiguration.findUnique({ where: { key: template } }),
    getPlatformSettings(),
  ]);
  if (configuredTemplate && !configuredTemplate.enabled) throw new Error("This template is not currently available.");
  const availableSections = new Set(settings.enabledSections);
  const resume = await prisma.resume.create({
    data: {
      userId, title, template, slug: slugify(title),
      personalInfo: { create: {} },
      sections: { create: defaultSections.filter(section => availableSections.has(section.id)).map((section, position) => ({ key: section.id, label: section.label, position, isVisible: section.visible })) },
    },
    select: { id: true },
  });
  return resume.id;
}

export async function duplicateResume(userId: string, id: string) {
  const source = await getResume(userId, id);
  if (!source) throw new Error("Resume not found.");
  const duplicateId = await createResume(userId, `${source.title} copy`, source.template);
  await saveResumeBasics(userId, duplicateId, { ...source, title: `${source.title} copy`, revision: 0, isPublic: false });
  return duplicateId;
}

export async function deleteResume(userId: string, id: string) {
  const result = await prisma.resume.deleteMany({ where: { id, userId } });
  if (!result.count) throw new Error("Resume not found.");
}

export async function manageResume(userId: string, id: string, operation:
  | { operation: "rename"; title: string }
  | { operation: "archive"; archived: boolean }
  | { operation: "slug"; slug: string }
  | { operation: "visibility"; isPublic: boolean }) {
  const data = operation.operation === "rename" ? { title: operation.title }
    : operation.operation === "archive" ? { archivedAt: operation.archived ? new Date() : null, status: operation.archived ? "ARCHIVED" as const : "DRAFT" as const, isPublic: false }
    : operation.operation === "slug" ? { slug: operation.slug }
    : { isPublic: operation.isPublic, status: operation.isPublic ? "PUBLISHED" as const : "DRAFT" as const };
  const result = await prisma.resume.updateMany({ where: { id, userId }, data });
  if (!result.count) throw new Error("Resume not found.");
}

export async function saveResumeBasics(userId: string, id: string, data: {
  title: string; template: string; fontFamily: string; accentColor: string; spacing: string;
  revision: number; paperSize: string;
  isPublic: boolean; summary: string; completion: number; personal: ResumeDraft["personal"]; sections: ResumeDraft["sections"];
  experience: ResumeDraft["experience"]; education: ResumeDraft["education"]; skills: ResumeDraft["skills"];
  projects: ResumeDraft["projects"]; certifications: ResumeDraft["certifications"]; languages: ResumeDraft["languages"];
  awards: ResumeDraft["awards"]; interests: ResumeDraft["interests"]; references: ResumeDraft["references"];
}) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.resume.updateMany({
      where: { id, userId, revision: data.revision },
      data: {
        title: data.title, template: data.template, fontFamily: data.fontFamily,
        accentColor: data.accentColor, spacing: data.spacing, paperSize: data.paperSize,
        isPublic: data.isPublic, status: data.isPublic ? "PUBLISHED" : "DRAFT",
        summary: data.summary, completion: data.completion, lastSavedAt: new Date(),
        revision: { increment: 1 },
      },
    });
    if (!claimed.count) {
      const exists = await tx.resume.count({ where: { id, userId } });
      if (!exists) throw new Error("Resume not found.");
      throw new Error("VERSION_CONFLICT");
    }
    const [city, ...countryParts] = data.personal.location.split(",");
    await tx.resume.update({
      where: { id },
      data: {
        personalInfo: {
          upsert: {
            create: {
              firstName: data.personal.firstName, lastName: data.personal.lastName, jobTitle: data.personal.jobTitle,
              email: data.personal.email, phone: data.personal.phone, city: city.trim(),
              country: countryParts.join(",").trim(), website: data.personal.website,
              linkedin: data.personal.linkedin, photoUrl: data.personal.photoUrl,
            },
            update: {
              firstName: data.personal.firstName, lastName: data.personal.lastName, jobTitle: data.personal.jobTitle,
              email: data.personal.email, phone: data.personal.phone, city: city.trim(),
              country: countryParts.join(",").trim(), website: data.personal.website,
              linkedin: data.personal.linkedin, photoUrl: data.personal.photoUrl,
            },
          },
        },
      },
    });
    await tx.resumeSection.deleteMany({ where: { resumeId: id } });
    await tx.resumeSection.createMany({
      data: data.sections.map((section, position) => ({
        resumeId: id, key: section.id, label: section.label, isVisible: section.visible, position,
      })),
    });
    const parseYear = (value: string) => {
      const match = value.match(/\b(19|20)\d{2}\b/);
      return match ? new Date(`${match[0]}-01-01T00:00:00.000Z`) : null;
    };
    await tx.workExperience.deleteMany({ where: { resumeId: id } });
    if (data.experience.length) await tx.workExperience.createMany({ data: data.experience.map((item, position) => ({
      resumeId: id, company: item.company, role: item.role, location: item.location || null,
      startDate: parseYear(item.startDate), endDate: item.endDate.toLowerCase() === "present" ? null : parseYear(item.endDate),
      current: item.endDate.toLowerCase() === "present", description: item.description || null, position,
    })) });
    await tx.education.deleteMany({ where: { resumeId: id } });
    if (data.education.length) await tx.education.createMany({ data: data.education.map((item, position) => ({
      resumeId: id, school: item.school, degree: item.degree, location: item.location || null,
      startDate: parseYear(item.startDate), endDate: parseYear(item.endDate), description: item.description || null, position,
    })) });
    await tx.skill.deleteMany({ where: { resumeId: id } });
    if (data.skills.length) await tx.skill.createMany({ data: data.skills.map((name, position) => ({ resumeId: id, name, position })) });
    await tx.project.deleteMany({ where: { resumeId: id } });
    if (data.projects.length) await tx.project.createMany({ data: data.projects.map((item, position) => ({ resumeId: id, name: item.name, url: item.url || null, description: item.description || null, technologies: [], position })) });
    await tx.certification.deleteMany({ where: { resumeId: id } });
    if (data.certifications.length) await tx.certification.createMany({ data: data.certifications.map((item, position) => ({ resumeId: id, name: item.name, issuer: item.issuer, issueDate: parseYear(item.date), position })) });
    await tx.language.deleteMany({ where: { resumeId: id } });
    if (data.languages.length) await tx.language.createMany({ data: data.languages.map((item, position) => ({ resumeId: id, name: item.name, proficiency: item.proficiency, position })) });
    await tx.award.deleteMany({ where: { resumeId: id } });
    if (data.awards.length) await tx.award.createMany({ data: data.awards.map((item, position) => ({ resumeId: id, title: item.title, issuer: item.issuer || null, awardedAt: parseYear(item.date), position })) });
    await tx.interest.deleteMany({ where: { resumeId: id } });
    if (data.interests.length) await tx.interest.createMany({ data: data.interests.map((name, position) => ({ resumeId: id, name, position })) });
    await tx.reference.deleteMany({ where: { resumeId: id } });
    if (data.references.length) await tx.reference.createMany({ data: data.references.map((item, position) => ({ resumeId: id, name: item.name, relationship: item.relationship || null, email: item.email || null, position })) });
    return { success: true, savedAt: new Date().toISOString(), revision: data.revision + 1 };
  });
}

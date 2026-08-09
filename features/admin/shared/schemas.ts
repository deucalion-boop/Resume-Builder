import { z } from "zod";

export const idSchema = z.cuid();
const publicUrlSchema = z.url().refine(value => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS URL.");
export const paginationSchema = z.object({
  q: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
});

export const userListSchema = paginationSchema.extend({
  status: z.enum(["ALL", "ACTIVE", "SUSPENDED", "DELETED"]).default("ALL"),
  role: z.enum(["ALL", "USER", "ADMIN"]).default("ALL"),
  provider: z.enum(["ALL", "email", "google", "github"]).default("ALL"),
  sort: z.enum(["newest", "oldest", "name", "activity", "resumes"]).default("newest"),
});

export const userActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("suspend"), reason: z.string().trim().min(5).max(500) }),
  z.object({ action: z.literal("reactivate"), reason: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("delete"), reason: z.string().trim().min(5).max(500) }),
  z.object({ action: z.literal("restore"), reason: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("force_reset") }),
  z.object({ action: z.literal("revoke_sessions"), reason: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("set_role"), role: z.enum(["USER", "ADMIN"]), reason: z.string().trim().min(3).max(500) }),
]);

export const moderationListSchema = paginationSchema.extend({
  status: z.enum(["ALL", "OPEN", "REVIEWING", "RESOLVED", "DISMISSED"]).default("ALL"),
  suspicious: z.enum(["ALL", "YES"]).default("ALL"),
  sort: z.enum(["newest", "views", "downloads", "reports"]).default("newest"),
});

export const moderationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("disable_link"), reason: z.string().trim().min(5).max(500) }),
  z.object({ action: z.literal("regenerate_link"), reason: z.string().trim().min(5).max(500) }),
  z.object({ action: z.literal("remove_content"), reason: z.string().trim().min(5).max(500) }),
  z.object({ action: z.literal("set_report_status"), reportId: idSchema, status: z.enum(["REVIEWING", "RESOLVED", "DISMISSED"]), reason: z.string().trim().min(3).max(500) }),
]);

export const settingsSchema = z.object({
  applicationName: z.string().trim().min(2).max(60),
  supportEmail: z.email(),
  logoUrl: publicUrlSchema.or(z.literal("")),
  faviconUrl: publicUrlSchema.or(z.literal("")),
  registrationEnabled: z.boolean(),
  maintenanceMode: z.boolean(),
  enabledOAuthProviders: z.array(z.enum(["google", "github"])).max(2),
  uploadLimitMb: z.number().int().min(1).max(20),
  accountRetentionDays: z.number().int().min(1).max(365),
  allowedImageTypes: z.array(z.enum(["image/jpeg", "image/png", "image/webp"])).min(1),
  availableFonts: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  colorThemes: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(1).max(20),
  enabledSections: z.array(z.string().trim().min(1).max(40)).min(1),
  announcement: z.string().trim().max(500),
  privacyPolicyUrl: publicUrlSchema.or(z.literal("")),
  termsUrl: publicUrlSchema.or(z.literal("")),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(170),
});

export const templateActionSchema = z.object({
  key: z.enum(["clarity", "modern", "executive"]),
  enabled: z.boolean(),
});

export const securityResolveSchema = z.object({ eventId: idSchema, resolved: z.boolean() });

export const ticketListSchema = paginationSchema.extend({
  status: z.enum(["ALL", "OPEN", "IN_PROGRESS", "WAITING_ON_USER", "RESOLVED", "CLOSED"]).default("ALL"),
  type: z.enum(["ALL", "FEEDBACK", "CONTACT", "ACCOUNT_RECOVERY", "TECHNICAL_ERROR", "ABUSE_REPORT"]).default("ALL"),
});

export const ticketActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update"), status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_USER", "RESOLVED", "CLOSED"]), priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]) }),
  z.object({ action: z.literal("note"), body: z.string().trim().min(2).max(4000), internal: z.boolean().default(true) }),
]);

export const faqSchema = z.object({
  id: idSchema.optional(),
  question: z.string().trim().min(5).max(240),
  answer: z.string().trim().min(5).max(5000),
  category: z.string().trim().min(2).max(80),
  published: z.boolean(),
});

export const announcementSchema = z.object({
  id: idSchema.optional(),
  title: z.string().trim().min(2).max(120),
  message: z.string().trim().min(2).max(1000),
  kind: z.enum(["info", "success", "warning", "critical"]),
  active: z.boolean(),
  endsAt: z.iso.datetime().nullable(),
});

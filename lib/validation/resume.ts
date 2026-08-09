import { z } from "zod";

const personalSchema = z.object({
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  jobTitle: z.string().trim().max(120),
  email: z.union([z.email(), z.literal("")]),
  phone: z.string().trim().max(40),
  location: z.string().trim().max(120),
  website: z.string().trim().max(200),
  linkedin: z.string().trim().max(200),
  photoUrl: z.string().optional(),
});

const datedEntry = {
  id: z.string(),
  startDate: z.string().max(30),
  endDate: z.string().max(30),
  description: z.string().max(6000),
};

export const resumePatchSchema = z.object({
  revision: z.number().int().min(0),
  title: z.string().trim().min(1).max(120),
  template: z.enum(["clarity", "modern", "executive"]),
  fontFamily: z.enum(["Inter", "Manrope", "Georgia"]),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  spacing: z.enum(["compact", "comfortable", "spacious"]),
  paperSize: z.enum(["A4", "LETTER"]),
  isPublic: z.boolean(),
  summary: z.string().max(4000),
  completion: z.number().int().min(0).max(100),
  personal: personalSchema,
  sections: z.array(z.object({
    id: z.enum(["personal", "summary", "experience", "education", "skills", "projects", "certifications", "languages", "awards", "interests", "references"]),
    label: z.string().min(1).max(80),
    visible: z.boolean(),
  })).max(20),
  experience: z.array(z.object({
    ...datedEntry,
    company: z.string().max(200),
    role: z.string().max(200),
    location: z.string().max(200),
  })).max(50),
  education: z.array(z.object({
    ...datedEntry,
    school: z.string().max(200),
    degree: z.string().max(240),
    location: z.string().max(200),
  })).max(30),
  skills: z.array(z.string().trim().min(1).max(100)).max(100),
  projects: z.array(z.object({ id: z.string(), name: z.string().max(200), url: z.string().max(500), description: z.string().max(6000) })).max(50),
  certifications: z.array(z.object({ id: z.string(), name: z.string().max(200), issuer: z.string().max(200), date: z.string().max(30) })).max(50),
  languages: z.array(z.object({ id: z.string(), name: z.string().max(100), proficiency: z.string().max(100) })).max(50),
  awards: z.array(z.object({ id: z.string(), title: z.string().max(200), issuer: z.string().max(200), date: z.string().max(30) })).max(50),
  interests: z.array(z.string().trim().min(1).max(100)).max(100),
  references: z.array(z.object({ id: z.string(), name: z.string().max(200), relationship: z.string().max(200), email: z.union([z.email(), z.literal("")]) })).max(30),
});

export const resumeIdSchema = z.string().cuid();
export const slugSchema = z.string().trim().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const resumeManageSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("rename"), title: z.string().trim().min(1).max(120) }),
  z.object({ operation: z.literal("archive"), archived: z.boolean() }),
  z.object({ operation: z.literal("slug"), slug: slugSchema }),
  z.object({ operation: z.literal("visibility"), isPublic: z.boolean() }),
]);

export const createResumeSchema = z.object({
  title: z.string().trim().min(1).max(120).default("Untitled resume"),
  template: z.enum(["clarity", "modern", "executive"]).default("clarity"),
});

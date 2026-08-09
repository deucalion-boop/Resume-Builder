export type ResumeSectionKey =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "awards"
  | "interests"
  | "references";

export type ResumeSection = {
  id: ResumeSectionKey;
  label: string;
  visible: boolean;
};

export type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type EducationItem = {
  id: string;
  school: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ResumeDraft = {
  id: string;
  title: string;
  slug: string;
  template: "clarity" | "modern" | "executive";
  fontFamily: "Inter" | "Manrope" | "Georgia";
  accentColor: string;
  spacing: "compact" | "comfortable" | "spacious";
  paperSize: "A4" | "LETTER";
  isPublic: boolean;
  revision: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: string;
  completion: number;
  personal: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    photoUrl?: string;
  };
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: { id: string; name: string; url: string; description: string }[];
  certifications: { id: string; name: string; issuer: string; date: string }[];
  languages: { id: string; name: string; proficiency: string }[];
  awards: { id: string; title: string; issuer: string; date: string }[];
  interests: string[];
  references: { id: string; name: string; relationship: string; email: string }[];
  sections: ResumeSection[];
};

export type ResumeSummary = Pick<
  ResumeDraft,
  "id" | "title" | "slug" | "template" | "updatedAt" | "completion" | "isPublic"
> & { views: number; downloads: number; status: ResumeDraft["status"] };

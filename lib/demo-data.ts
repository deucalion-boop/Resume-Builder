import type { ResumeDraft, ResumeSummary } from "@/types/resume";

export const defaultSections: ResumeDraft["sections"] = [
  { id: "personal", label: "Personal information", visible: true },
  { id: "summary", label: "Professional summary", visible: true },
  { id: "experience", label: "Work experience", visible: true },
  { id: "education", label: "Education", visible: true },
  { id: "skills", label: "Skills", visible: true },
  { id: "projects", label: "Projects", visible: true },
  { id: "certifications", label: "Certifications", visible: false },
  { id: "languages", label: "Languages", visible: false },
  { id: "awards", label: "Awards", visible: false },
  { id: "interests", label: "Interests", visible: false },
  { id: "references", label: "References", visible: false },
];

export const demoResume: ResumeDraft = {
  id: "demo-resume",
  title: "Senior Product Designer",
  slug: "maya-chen-product-designer",
  template: "clarity",
  fontFamily: "Inter",
  accentColor: "#0877C9",
  spacing: "comfortable",
  paperSize: "A4",
  isPublic: true,
  revision: 0,
  status: "PUBLISHED",
  updatedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
  completion: 82,
  personal: {
    firstName: "Maya",
    lastName: "Chen",
    jobTitle: "Senior Product Designer",
    email: "maya.chen@example.com",
    phone: "+1 415 555 0142",
    location: "San Francisco, CA",
    website: "mayachen.design",
    linkedin: "linkedin.com/in/mayachen",
  },
  summary:
    "Product designer with 7+ years of experience turning complex workflows into clear, human-centered experiences. I partner with cross-functional teams to ship thoughtful products that improve activation, retention, and customer trust.",
  experience: [
    {
      id: "exp-1",
      company: "Northstar Labs",
      role: "Senior Product Designer",
      location: "San Francisco, CA",
      startDate: "2022",
      endDate: "Present",
      description:
        "Led end-to-end design for the company’s analytics platform, increasing trial activation by 28%. Built and launched a shared design system used by six product squads.",
    },
    {
      id: "exp-2",
      company: "Kindred",
      role: "Product Designer",
      location: "Remote",
      startDate: "2019",
      endDate: "2022",
      description:
        "Designed collaborative planning tools for 40k+ teams. Partnered with research and engineering to reduce onboarding time by 35%.",
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "California College of the Arts",
      degree: "BFA, Interaction Design",
      location: "San Francisco, CA",
      startDate: "2014",
      endDate: "2018",
      description: "Honors graduate · Design Student Association",
    },
  ],
  skills: ["Product strategy", "UX research", "Prototyping", "Design systems", "Figma", "Workshop facilitation"],
  projects: [
    { id: "project-1", name: "Constellation Design System", url: "constellation.design", description: "An accessible multi-brand system serving 20+ digital products." },
  ],
  certifications: [{ id: "cert-1", name: "Design Leadership", issuer: "IDEO U", date: "2024" }],
  languages: [{ id: "lang-1", name: "English", proficiency: "Native" }, { id: "lang-2", name: "Mandarin", proficiency: "Professional" }],
  awards: [{ id: "award-1", title: "Product Design Award", issuer: "Awwwards", date: "2023" }],
  interests: ["Ceramics", "Urban cycling", "Editorial design"],
  references: [{ id: "ref-1", name: "Jordan Lee", relationship: "VP of Product, Northstar Labs", email: "jordan@example.com" }],
  sections: defaultSections,
};

export const demoResumes: ResumeSummary[] = [
  { id: "demo-resume", title: "Senior Product Designer", slug: "maya-chen-product-designer", template: "clarity", updatedAt: demoResume.updatedAt, completion: 82, isPublic: true, status: "PUBLISHED", views: 184, downloads: 27 },
  { id: "resume-2", title: "Product Design Lead", slug: "product-design-lead", template: "modern", updatedAt: new Date(Date.now() - 86_400_000).toISOString(), completion: 64, isPublic: false, status: "DRAFT", views: 76, downloads: 12 },
  { id: "resume-3", title: "UX Consultant", slug: "ux-consultant", template: "executive", updatedAt: new Date(Date.now() - 4 * 86_400_000).toISOString(), completion: 91, isPublic: true, status: "PUBLISHED", views: 221, downloads: 44 },
];

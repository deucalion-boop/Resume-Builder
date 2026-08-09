import { Globe, Link as LinkIcon, Mail, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeDraft, ResumeSectionKey } from "@/types/resume";

export function ResumePreview({ resume, scale = 1 }: { resume: ResumeDraft; scale?: number }) {
  const sectionTitle = (title: string) => (
    <h2 className="mb-3 text-[9px] font-bold uppercase tracking-[.2em]" style={{ color: resume.accentColor }}>{title}</h2>
  );
  const sectionMap: Record<ResumeSectionKey, React.ReactNode> = {
    personal: null,
    summary: resume.summary && <section key="summary">{sectionTitle("Profile")}<p className="text-[9px] leading-[1.7] text-zinc-600">{resume.summary}</p></section>,
    experience: resume.experience.length > 0 && <section key="experience">{sectionTitle("Experience")}<div className="space-y-4">{resume.experience.map(item => <article key={item.id}><div className="flex items-start justify-between gap-4"><div><h3 className="text-[10px] font-bold">{item.role}</h3><p className="mt-0.5 text-[8px] font-semibold text-zinc-500">{item.company}{item.location ? ` · ${item.location}` : ""}</p></div><p className="shrink-0 text-[7px] text-zinc-400">{item.startDate} — {item.endDate}</p></div><p className="mt-2 whitespace-pre-line text-[8px] leading-[1.65] text-zinc-600">{item.description}</p></article>)}</div></section>,
    education: resume.education.length > 0 && <section key="education">{sectionTitle("Education")}<div className="space-y-3">{resume.education.map(item => <article key={item.id}><div className="flex justify-between gap-4"><div><h3 className="text-[9px] font-bold">{item.degree}</h3><p className="mt-0.5 text-[8px] text-zinc-500">{item.school} · {item.location}</p></div><p className="shrink-0 text-[7px] text-zinc-400">{item.startDate} — {item.endDate}</p></div>{item.description && <p className="mt-1.5 text-[8px] text-zinc-500">{item.description}</p>}</article>)}</div></section>,
    skills: resume.skills.length > 0 && <section key="skills">{sectionTitle("Skills")}<div className="flex flex-wrap gap-1.5">{resume.skills.map(item => <span key={item} className="rounded px-2 py-1 text-[7px]" style={{ backgroundColor: `${resume.accentColor}12`, color: resume.accentColor }}>{item}</span>)}</div></section>,
    projects: resume.projects.length > 0 && <section key="projects">{sectionTitle("Selected projects")}<div className="space-y-3">{resume.projects.map(item => <article key={item.id}><div className="flex justify-between"><h3 className="text-[9px] font-bold">{item.name}</h3><span className="text-[7px]" style={{ color: resume.accentColor }}>{item.url}</span></div><p className="mt-1 text-[8px] leading-relaxed text-zinc-600">{item.description}</p></article>)}</div></section>,
    certifications: resume.certifications.length > 0 && <section key="certifications">{sectionTitle("Certifications")}<div className="space-y-1.5">{resume.certifications.map(item => <div key={item.id} className="flex justify-between text-[8px]"><span><b>{item.name}</b> · {item.issuer}</span><span className="text-zinc-400">{item.date}</span></div>)}</div></section>,
    languages: resume.languages.length > 0 && <section key="languages">{sectionTitle("Languages")}<div className="grid grid-cols-2 gap-2">{resume.languages.map(item => <p key={item.id} className="text-[8px]"><b>{item.name}</b><br/><span className="text-zinc-500">{item.proficiency}</span></p>)}</div></section>,
    awards: resume.awards.length > 0 && <section key="awards">{sectionTitle("Awards")}<div className="space-y-1">{resume.awards.map(item => <p key={item.id} className="text-[8px]"><b>{item.title}</b> · {item.issuer} <span className="text-zinc-400">{item.date}</span></p>)}</div></section>,
    interests: resume.interests.length > 0 && <section key="interests">{sectionTitle("Interests")}<p className="text-[8px] text-zinc-600">{resume.interests.join(" · ")}</p></section>,
    references: resume.references.length > 0 && <section key="references">{sectionTitle("References")}<div className="space-y-2">{resume.references.map(item => <p key={item.id} className="text-[8px]"><b>{item.name}</b> · {item.relationship}<br/><span className="text-zinc-500">{item.email}</span></p>)}</div></section>,
  };
  const visibleSections = resume.sections.filter(section => section.visible && section.id !== "personal");
  const spacingClass = resume.spacing === "compact" ? "space-y-4" : resume.spacing === "spacious" ? "space-y-7" : "space-y-5";
  const templateClass = resume.template === "executive" ? "border-t-[8px]" : "";

  return (
    <article
      className={cn("print-sheet relative aspect-[1/1.414] w-[620px] origin-top bg-white text-[#24222c] shadow-2xl", templateClass)}
      style={{ transform: `scale(${scale})`, fontFamily: resume.fontFamily === "Georgia" ? "Georgia, serif" : `${resume.fontFamily}, Arial, sans-serif`, borderColor: resume.accentColor }}
      aria-label={`Preview of ${resume.title}`}
    >
      <div className={cn("h-full p-12", resume.template === "modern" && "grid grid-cols-[.72fr_1.7fr] gap-8")}>
        <header className={cn("pb-6", resume.template === "clarity" && "border-b-2", resume.template === "modern" && "row-span-2 border-r pr-6")} style={{ borderColor: resume.accentColor }}>
          <div className={cn(resume.template === "modern" ? "" : "flex items-end justify-between gap-6")}>
            <div>
              <h1 className="text-[28px] font-bold leading-none tracking-[-.03em]">{resume.personal.firstName} {resume.personal.lastName}</h1>
              <p className="mt-2 text-[9px] font-bold uppercase tracking-[.18em]" style={{ color: resume.accentColor }}>{resume.personal.jobTitle}</p>
            </div>
            <div className={cn("mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[7px] text-zinc-500", resume.template === "modern" ? "flex-col" : "max-w-[260px] justify-end")}>
              {resume.personal.location && <span className="flex items-center gap-1"><MapPin className="size-2.5" />{resume.personal.location}</span>}
              {resume.personal.email && <span className="flex items-center gap-1"><Mail className="size-2.5" />{resume.personal.email}</span>}
              {resume.personal.phone && <span className="flex items-center gap-1"><Phone className="size-2.5" />{resume.personal.phone}</span>}
              {resume.personal.website && <span className="flex items-center gap-1"><Globe className="size-2.5" />{resume.personal.website}</span>}
              {resume.personal.linkedin && <span className="flex items-center gap-1"><LinkIcon className="size-2.5" />{resume.personal.linkedin}</span>}
            </div>
          </div>
        </header>
        <div className={cn("pt-6", spacingClass, resume.template === "modern" && "pt-0")}>
          {visibleSections.map(section => <div key={section.id}>{sectionMap[section.id]}</div>)}
        </div>
      </div>
    </article>
  );
}

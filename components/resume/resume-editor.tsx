"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronRight, Copy, FileText, GripVertical, ImagePlus, LayoutTemplate, Loader2, Palette, Plus, Printer, Redo2, Settings2, Share2, Sparkles, Trash2, Undo2, WifiOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ResumePreview } from "@/components/resume/resume-preview";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ResumeDraft, ResumeSection } from "@/types/resume";
import { manageResumeAction } from "@/app/actions/resumes";

const PdfDownload = dynamic(
  () => import("@/components/resume/pdf-download").then(module => module.PdfDownload),
  { ssr: false, loading: () => <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white"><Loader2 className="size-3.5 animate-spin" />Preparing</span> },
);

function subscribeToConnectivity(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function completionFor(resume: ResumeDraft) {
  const checks = [
    resume.personal.firstName, resume.personal.lastName, resume.personal.jobTitle, resume.personal.email,
    resume.summary.length > 80, resume.experience.length > 0, resume.education.length > 0,
    resume.skills.length >= 3, resume.projects.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function SortableSection({ section, active, onSelect, onToggle }: { section: ResumeSection; active: boolean; onSelect: () => void; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("group flex items-center gap-1 rounded-xl border border-transparent p-1 transition", active && "border-primary/15 bg-primary/8", isDragging && "z-20 bg-card opacity-80 shadow-xl")}>
      <button type="button" className="touch-none p-2 text-muted-foreground/50 hover:text-muted-foreground" aria-label={`Reorder ${section.label}`} {...attributes} {...listeners}><GripVertical className="size-4" /></button>
      <button type="button" onClick={onSelect} className={cn("flex flex-1 items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-medium", !section.visible && "text-muted-foreground/60")}>
        <span>{section.label}</span><ChevronRight className="size-3.5 text-muted-foreground/50" />
      </button>
      <button type="button" onClick={onToggle} aria-label={`${section.visible ? "Hide" : "Show"} ${section.label}`} className={cn("relative mr-1 h-5 w-9 rounded-full transition", section.visible ? "bg-primary" : "bg-secondary")}>
        <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition", section.visible ? "left-[18px]" : "left-0.5")} />
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-foreground">{label}<div className="mt-1.5">{children}</div></label>;
}

const addEntrySchema = z.object({ name: z.string().trim().min(1), secondary: z.string().trim().max(300), tertiary: z.string().trim().max(500), description: z.string().max(6000) });

function AdditionalSectionEditor({ active, resume, update }: { active: ResumeSection["id"]; resume: ResumeDraft; update: (key: keyof ResumeDraft, value: ResumeDraft[keyof ResumeDraft]) => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof addEntrySchema>>({ resolver: zodResolver(addEntrySchema), defaultValues: { name: "", secondary: "", tertiary: "", description: "" } });
  const submit = handleSubmit(values => {
    const id = crypto.randomUUID();
    if (active === "projects") update("projects", [...resume.projects, { id, name: values.name, url: values.secondary, description: values.description }]);
    if (active === "certifications") update("certifications", [...resume.certifications, { id, name: values.name, issuer: values.secondary, date: values.tertiary }]);
    if (active === "languages") update("languages", [...resume.languages, { id, name: values.name, proficiency: values.secondary }]);
    if (active === "awards") update("awards", [...resume.awards, { id, title: values.name, issuer: values.secondary, date: values.tertiary }]);
    if (active === "references") update("references", [...resume.references, { id, name: values.name, relationship: values.secondary, email: values.tertiary }]);
    if (active === "interests") update("interests", [...resume.interests, values.name]);
    reset();
  });
  const rows = active === "projects" ? resume.projects : active === "certifications" ? resume.certifications : active === "languages" ? resume.languages : active === "awards" ? resume.awards : active === "references" ? resume.references : resume.interests.map((name, index) => ({ id: `${index}-${name}`, name }));
  const remove = (id: string) => {
    if (active === "projects") update("projects", resume.projects.filter(x => x.id !== id));
    if (active === "certifications") update("certifications", resume.certifications.filter(x => x.id !== id));
    if (active === "languages") update("languages", resume.languages.filter(x => x.id !== id));
    if (active === "awards") update("awards", resume.awards.filter(x => x.id !== id));
    if (active === "references") update("references", resume.references.filter(x => x.id !== id));
    if (active === "interests") update("interests", resume.interests.filter((_, index) => `${index}-${resume.interests[index]}` !== id));
  };
  return <motion.div key={active} {...panelMotion} className="space-y-3">
    {rows.map((row) => {
      const label = String(("title" in row ? row.title : row.name) || "");
      const secondary = String(("issuer" in row ? row.issuer : "proficiency" in row ? row.proficiency : "relationship" in row ? row.relationship : "url" in row ? row.url : "") || "");
      return <div key={row.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"><GripVertical className="size-4 text-muted-foreground/50" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{label || `Untitled ${active.replace(/s$/, "")}`}</p>{secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}</div><Button variant="ghost" size="icon" onClick={() => {
        if (active === "projects") update("projects", [...resume.projects, { ...(row as ResumeDraft["projects"][number]), id: crypto.randomUUID() }]);
        if (active === "certifications") update("certifications", [...resume.certifications, { ...(row as ResumeDraft["certifications"][number]), id: crypto.randomUUID() }]);
        if (active === "languages") update("languages", [...resume.languages, { ...(row as ResumeDraft["languages"][number]), id: crypto.randomUUID() }]);
        if (active === "awards") update("awards", [...resume.awards, { ...(row as ResumeDraft["awards"][number]), id: crypto.randomUUID() }]);
        if (active === "references") update("references", [...resume.references, { ...(row as ResumeDraft["references"][number]), id: crypto.randomUUID() }]);
      }} aria-label={`Duplicate ${label}`}><Copy className="size-3.5" /></Button><Button variant="danger" size="icon" onClick={() => remove(row.id)} aria-label={`Delete ${label}`}><Trash2 className="size-3.5" /></Button></div>;
    })}
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-dashed border-border p-4"><Field label={active === "awards" ? "Award title" : active === "references" ? "Reference name" : active === "interests" ? "Interest" : active.slice(0, -1) + " name"}><Input {...register("name")} /></Field>{active !== "interests" && <Field label={active === "projects" ? "URL" : active === "languages" ? "Proficiency" : active === "references" ? "Relationship" : "Issuer"}><Input {...register("secondary")} /></Field>}{["certifications", "awards", "references"].includes(active) && <Field label={active === "references" ? "Email" : "Date"}><Input {...register("tertiary")} /></Field>}{active === "projects" && <Field label="Description"><Textarea {...register("description")} /></Field>}{errors.name && <p className="text-xs text-red-500">Enter a name before adding this item.</p>}<Button type="submit" variant="outline" className="w-full"><Plus className="size-4" />Add {active.replace(/s$/, "")}</Button></form>
  </motion.div>;
}

const panelMotion = { initial: { opacity: 0, x: 8 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -8 }, transition: { duration: .18 } };

export function ResumeEditor({ initialResume, demo = false }: { initialResume: ResumeDraft; demo?: boolean }) {
  const [resume, setResume] = useState(initialResume);
  const [active, setActive] = useState<ResumeSection["id"]>("personal");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedAt, setSavedAt] = useState(initialResume.updatedAt);
  const firstRender = useRef(true);
  const revisionRef = useRef(initialResume.revision);
  const abortRef = useRef<AbortController | null>(null);
  const undoRef = useRef<ResumeDraft[]>([]);
  const redoRef = useRef<ResumeDraft[]>([]);
  const [historyAvailability, setHistoryAvailability] = useState({ undo: false, redo: false });
  const online = useSyncExternalStore(subscribeToConnectivity, () => navigator.onLine, () => true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const platform = useQuery({
    queryKey: ["public-platform-config"],
    queryFn: async () => {
      const response = await fetch("/api/config");
      if (!response.ok) throw new Error("Platform configuration is unavailable.");
      return response.json() as Promise<{ uploadLimitMb: number; allowedImageTypes: string[]; availableFonts: string[]; colorThemes: string[]; templates: { key: ResumeDraft["template"]; name: string }[] }>;
    },
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (value: ResumeDraft) => {
      if (demo) {
        localStorage.setItem("resumly-demo-resume", JSON.stringify(value));
        await new Promise(resolve => setTimeout(resolve, 350));
        return { savedAt: new Date().toISOString(), revision: revisionRef.current };
      }
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const response = await fetch(`/api/resumes/${value.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...value, revision: revisionRef.current, completion: completionFor(value) }),
        signal: abortRef.current.signal,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.code === "VERSION_CONFLICT" ? "This resume changed in another tab. Refresh to reconcile your changes." : body.error?.message || "We couldn’t save your latest changes.");
      return body as { savedAt: string; revision: number };
    },
    onSuccess: data => { setSavedAt(data.savedAt); if (data.revision !== undefined) revisionRef.current = data.revision; },
    onError: error => { if (error.name !== "AbortError") toast.error(error.message); },
  });

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const timer = window.setTimeout(() => saveMutation.mutate({ ...resume, completion: completionFor(resume) }), 900);
    return () => window.clearTimeout(timer);
  }, [resume]); // eslint-disable-line react-hooks/exhaustive-deps

  function patch<T extends keyof ResumeDraft>(key: T, value: ResumeDraft[T]) {
    undoRef.current = [...undoRef.current.slice(-49), structuredClone(resume)];
    redoRef.current = []; setHistoryAvailability({ undo: true, redo: false });
    setResume(current => ({ ...current, [key]: value }));
  }
  function patchPersonal(key: keyof ResumeDraft["personal"], value: string) {
    undoRef.current = [...undoRef.current.slice(-49), structuredClone(resume)];
    redoRef.current = []; setHistoryAvailability({ undo: true, redo: false });
    setResume(current => ({ ...current, personal: { ...current.personal, [key]: value } }));
  }
  function undo() {
    const previous = undoRef.current.pop(); if (!previous) return;
    redoRef.current.push(structuredClone(resume)); setResume(previous); setHistoryAvailability({ undo: undoRef.current.length > 0, redo: true });
  }
  function redo() {
    const next = redoRef.current.pop(); if (!next) return;
    undoRef.current.push(structuredClone(resume)); setResume(next); setHistoryAvailability({ undo: true, redo: redoRef.current.length > 0 });
  }
  function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
    const target = index + direction;
    return target < 0 || target >= items.length ? items : arrayMove(items, index, target);
  }
  function dragEnd(event: DragEndEvent) {
    const { active: dragged, over } = event;
    if (!over || dragged.id === over.id) return;
    const oldIndex = resume.sections.findIndex(item => item.id === dragged.id);
    const newIndex = resume.sections.findIndex(item => item.id === over.id);
    patch("sections", arrayMove(resume.sections, oldIndex, newIndex));
  }
  async function uploadPhoto(file?: File) {
    if (!file) return;
    const uploadLimitMb = platform.data?.uploadLimitMb ?? 5;
    const allowedTypes = platform.data?.allowedImageTypes ?? ["image/jpeg", "image/png", "image/webp"];
    if (file.size > uploadLimitMb * 1_000_000 || !allowedTypes.includes(file.type)) return toast.error(`Choose an approved image smaller than ${uploadLimitMb} MB.`);
    if (demo) {
      patchPersonal("photoUrl", URL.createObjectURL(file));
      return toast.success("Profile photo added to this demo.");
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");
      const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      const { error } = await supabase.storage.from("resume-photos").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("resume-photos").getPublicUrl(path);
      patchPersonal("photoUrl", data.publicUrl);
      toast.success("Profile photo uploaded.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed."); }
  }
  function share() {
    const url = `${location.origin}/r/${resume.slug}`;
    navigator.clipboard.writeText(url);
    toast.success(resume.isPublic ? "Public link copied." : "Turn on public sharing to open this link.");
  }

  const activeLabel = resume.sections.find(section => section.id === active)?.label ?? "Resume";
  const completion = completionFor(resume);
  const editorPanel = useMemo(() => {
    if (active === "personal") return (
      <motion.div key="personal" {...panelMotion} className="space-y-5">
        <div>
          <label className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border p-4 transition hover:border-primary/50 hover:bg-primary/5">
            <span className="relative grid size-12 place-items-center overflow-hidden rounded-full bg-secondary text-muted-foreground">{resume.personal.photoUrl ? <Image src={resume.personal.photoUrl} alt="" fill unoptimized className="object-cover" /> : <ImagePlus className="size-5" />}</span>
            <span><b className="block text-sm">Add a profile photo</b><small className="text-[11px] text-muted-foreground">JPG or PNG · Up to 5 MB</small></span>
            <input type="file" accept={(platform.data?.allowedImageTypes ?? ["image/png", "image/jpeg", "image/webp"]).join(",")} className="sr-only" onChange={e => uploadPhoto(e.target.files?.[0])} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3"><Field label="First name"><Input value={resume.personal.firstName} onChange={e => patchPersonal("firstName", e.target.value)} /></Field><Field label="Last name"><Input value={resume.personal.lastName} onChange={e => patchPersonal("lastName", e.target.value)} /></Field></div>
        <Field label="Professional title"><Input value={resume.personal.jobTitle} onChange={e => patchPersonal("jobTitle", e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Email"><Input type="email" value={resume.personal.email} onChange={e => patchPersonal("email", e.target.value)} /></Field><Field label="Phone"><Input value={resume.personal.phone} onChange={e => patchPersonal("phone", e.target.value)} /></Field></div>
        <Field label="Location"><Input value={resume.personal.location} onChange={e => patchPersonal("location", e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Website"><Input value={resume.personal.website} onChange={e => patchPersonal("website", e.target.value)} /></Field><Field label="LinkedIn"><Input value={resume.personal.linkedin} onChange={e => patchPersonal("linkedin", e.target.value)} /></Field></div>
      </motion.div>
    );
    if (active === "summary") return (
      <motion.div key="summary" {...panelMotion}>
        <div className="mb-4 rounded-xl bg-primary/8 p-3 text-xs leading-5 text-muted-foreground"><Sparkles className="mr-2 inline size-3.5 text-primary" />Lead with your strengths, scope, and the impact you create.</div>
        <Field label="Professional summary"><Textarea value={resume.summary} onChange={e => patch("summary", e.target.value)} className="min-h-52" maxLength={4000} /></Field>
        <p className="mt-2 text-right text-[10px] text-muted-foreground">{resume.summary.length} / 4,000</p>
      </motion.div>
    );
    if (active === "experience") return (
      <motion.div key="experience" {...panelMotion} className="space-y-3">
        {resume.experience.map(item => <div key={item.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold">{item.role}</p><p className="mt-1 text-xs text-muted-foreground">{item.company} · {item.startDate}—{item.endDate}</p></div><GripVertical className="size-4 text-muted-foreground/50" /></div><Textarea className="mt-3 min-h-24" value={item.description} onChange={e => patch("experience", resume.experience.map(x => x.id === item.id ? { ...x, description: e.target.value } : x))} /></div>)}
        {resume.experience.map((item, index) => <div key={`fields-${item.id}`} className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4"><Field label="Role"><Input value={item.role} onChange={e => patch("experience", resume.experience.map(x => x.id === item.id ? { ...x, role: e.target.value } : x))} /></Field><Field label="Company"><Input value={item.company} onChange={e => patch("experience", resume.experience.map(x => x.id === item.id ? { ...x, company: e.target.value } : x))} /></Field><Field label="Start date"><Input value={item.startDate} onChange={e => patch("experience", resume.experience.map(x => x.id === item.id ? { ...x, startDate: e.target.value } : x))} /></Field><Field label="End date"><Input value={item.endDate} onChange={e => patch("experience", resume.experience.map(x => x.id === item.id ? { ...x, endDate: e.target.value } : x))} /></Field><div className="col-span-2"><Field label="Location"><Input value={item.location} onChange={e => patch("experience", resume.experience.map(x => x.id === item.id ? { ...x, location: e.target.value } : x))} /></Field></div><div className="col-span-2 flex justify-end gap-1"><Button variant="ghost" size="icon" disabled={!index} onClick={() => patch("experience", moveItem(resume.experience, index, -1))} aria-label="Move experience up"><ArrowUp className="size-3.5" /></Button><Button variant="ghost" size="icon" disabled={index === resume.experience.length - 1} onClick={() => patch("experience", moveItem(resume.experience, index, 1))} aria-label="Move experience down"><ArrowDown className="size-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => patch("experience", [...resume.experience, { ...item, id: crypto.randomUUID() }])} aria-label="Duplicate experience"><Copy className="size-3.5" /></Button><Button variant="danger" size="icon" onClick={() => patch("experience", resume.experience.filter(x => x.id !== item.id))} aria-label="Delete experience"><Trash2 className="size-3.5" /></Button></div></div>)}
        <Button variant="outline" className="w-full" onClick={() => patch("experience", [...resume.experience, { id: crypto.randomUUID(), company: "", role: "", location: "", startDate: "", endDate: "", description: "" }])}><Plus className="size-4" />Add experience</Button>
      </motion.div>
    );
    if (active === "education") return (
      <motion.div key="education" {...panelMotion} className="space-y-3">
        {resume.education.map(item => <div key={item.id} className="rounded-2xl border border-border bg-card p-4"><p className="text-sm font-semibold">{item.degree}</p><p className="mt-1 text-xs text-muted-foreground">{item.school} · {item.startDate}—{item.endDate}</p></div>)}
        {resume.education.map((item, index) => <div key={`fields-${item.id}`} className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4"><div className="col-span-2"><Field label="Degree"><Input value={item.degree} onChange={e => patch("education", resume.education.map(x => x.id === item.id ? { ...x, degree: e.target.value } : x))} /></Field></div><div className="col-span-2"><Field label="School"><Input value={item.school} onChange={e => patch("education", resume.education.map(x => x.id === item.id ? { ...x, school: e.target.value } : x))} /></Field></div><Field label="Start date"><Input value={item.startDate} onChange={e => patch("education", resume.education.map(x => x.id === item.id ? { ...x, startDate: e.target.value } : x))} /></Field><Field label="End date"><Input value={item.endDate} onChange={e => patch("education", resume.education.map(x => x.id === item.id ? { ...x, endDate: e.target.value } : x))} /></Field><div className="col-span-2"><Field label="Location"><Input value={item.location} onChange={e => patch("education", resume.education.map(x => x.id === item.id ? { ...x, location: e.target.value } : x))} /></Field><Field label="Details"><Textarea value={item.description} onChange={e => patch("education", resume.education.map(x => x.id === item.id ? { ...x, description: e.target.value } : x))} /></Field></div><div className="col-span-2 flex justify-end gap-1"><Button variant="ghost" size="icon" disabled={!index} onClick={() => patch("education", moveItem(resume.education, index, -1))}><ArrowUp className="size-3.5" /></Button><Button variant="ghost" size="icon" disabled={index === resume.education.length - 1} onClick={() => patch("education", moveItem(resume.education, index, 1))}><ArrowDown className="size-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => patch("education", [...resume.education, { ...item, id: crypto.randomUUID() }])}><Copy className="size-3.5" /></Button><Button variant="danger" size="icon" onClick={() => patch("education", resume.education.filter(x => x.id !== item.id))}><Trash2 className="size-3.5" /></Button></div></div>)}
        <Button variant="outline" className="w-full" onClick={() => patch("education", [...resume.education, { id: crypto.randomUUID(), school: "", degree: "", location: "", startDate: "", endDate: "", description: "" }])}><Plus className="size-4" />Add education</Button>
      </motion.div>
    );
    if (active === "skills") return (
      <motion.div key="skills" {...panelMotion}><p className="mb-3 text-xs text-muted-foreground">Add the tools and strengths most relevant to the role.</p><div className="flex flex-wrap gap-2">{resume.skills.map(skill => <button key={skill} onClick={() => patch("skills", resume.skills.filter(x => x !== skill))} className="rounded-full bg-primary/10 px-3 py-2 text-xs font-medium text-primary">{skill} ×</button>)}</div><div className="mt-4 flex gap-2"><Input placeholder="Add a skill" onKeyDown={e => { if (e.key === "Enter" && e.currentTarget.value.trim()) { e.preventDefault(); patch("skills", [...resume.skills, e.currentTarget.value.trim()]); e.currentTarget.value = ""; } }} /><Button variant="outline" size="icon"><Plus className="size-4" /></Button></div></motion.div>
    );
    return <AdditionalSectionEditor active={active} resume={resume} update={(key, value) => patch(key, value as never)} />;
  }, [active, resume]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="no-print z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card/90 px-3 backdrop-blur-xl sm:px-5">
        <Link href={demo ? "/demo/dashboard" : "/dashboard"}><Button variant="ghost" size="icon" aria-label="Back to dashboard"><ArrowLeft className="size-4" /></Button></Link>
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <FileText className="hidden size-4 text-primary sm:block" />
        <Input aria-label="Resume title" value={resume.title} onChange={e => patch("title", e.target.value)} className="h-9 max-w-48 border-transparent bg-transparent px-2 font-semibold focus:border-border sm:max-w-64" />
        <div className="hidden items-center gap-1 text-[11px] text-muted-foreground md:flex">
          {!online ? <><WifiOff className="size-3 text-amber-500" />Offline · changes queued</> : saveMutation.isPending ? <><Loader2 className="size-3 animate-spin" />Saving…</> : saveMutation.isError ? <span className="text-red-500">Save failed</span> : <><Check className="size-3 text-emerald-500" />Saved {new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" disabled={!historyAvailability.undo} onClick={undo} aria-label="Undo"><Undo2 className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" disabled={!historyAvailability.redo} onClick={redo} aria-label="Redo"><Redo2 className="size-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden md:inline-flex"><Printer className="size-3.5" />Print</Button>
          <Button variant="outline" size="sm" onClick={share}><Share2 className="size-3.5" /><span className="hidden sm:inline">Share</span></Button>
          <div className="hidden sm:block"><PdfDownload resume={resume} /></div>
          <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(!settingsOpen)} aria-label="Design settings"><Settings2 className="size-4" /></Button>
        </div>
      </header>

      <div className="no-print grid grid-cols-2 border-b border-border bg-card p-1 lg:hidden">
        <button onClick={() => setMobileTab("edit")} className={cn("rounded-lg py-2 text-xs font-semibold", mobileTab === "edit" && "bg-secondary")}>Edit</button>
        <button onClick={() => setMobileTab("preview")} className={cn("rounded-lg py-2 text-xs font-semibold", mobileTab === "preview" && "bg-secondary")}>Preview</button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className={cn("no-print w-[270px] shrink-0 overflow-y-auto border-r border-border bg-card px-3 py-4 max-lg:hidden", mobileTab !== "edit" && "max-lg:hidden")}>
          <div className="mb-4 rounded-xl border border-primary/10 bg-primary/5 px-3 py-3"><div className="flex justify-between text-[11px]"><span className="font-semibold">Resume strength</span><span className="text-primary">{completion}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="animate-progress h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all" style={{ width: `${completion}%` }} /></div></div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Sections</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
            <SortableContext items={resume.sections.map(x => x.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">{resume.sections.map(section => <SortableSection key={section.id} section={section} active={active === section.id} onSelect={() => setActive(section.id)} onToggle={() => patch("sections", resume.sections.map(x => x.id === section.id ? { ...x, visible: !x.visible } : x))} />)}</div>
            </SortableContext>
          </DndContext>
          <p className="mt-5 px-2 text-[10px] leading-4 text-muted-foreground"><GripVertical className="mr-1 inline size-3" />Drag sections to change their order in the resume.</p>
        </aside>

        <section className={cn("no-print w-full shrink-0 overflow-y-auto bg-background/80 lg:w-[410px] lg:border-r lg:border-border", mobileTab !== "edit" && "hidden lg:block")}>
          <div className="sticky top-0 z-10 border-b border-border bg-background/90 px-5 py-4 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-primary">Edit section</p>
            <h2 className="mt-1 text-lg font-semibold">{activeLabel}</h2>
            <label className="mt-3 block text-xs font-semibold lg:hidden">Section
              <select value={active} onChange={event => setActive(event.target.value as ResumeSection["id"])} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm">
                {resume.sections.map(section => <option key={section.id} value={section.id}>{section.label}</option>)}
              </select>
            </label>
          </div>
          <div className="p-5">
            <AnimatePresence mode="wait">{editorPanel}</AnimatePresence>
          </div>
          <div className="block p-5 pt-0 sm:hidden"><PdfDownload resume={resume} /></div>
        </section>

        <main className={cn("dot-grid relative flex min-w-0 flex-1 items-start justify-center overflow-auto bg-[#e3f2f7] p-6 dark:bg-[#041a2a] lg:p-10", mobileTab !== "preview" && "max-lg:hidden")} id="main-content">
          <div className="h-[700px] w-[446px] shrink-0 sm:h-[820px] sm:w-[558px]">
            <ResumePreview resume={resume} scale={.82} />
          </div>
        </main>

        <AnimatePresence>
          {settingsOpen && (
            <motion.aside initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="no-print absolute inset-y-16 right-0 z-30 w-full max-w-[320px] overflow-y-auto border-l border-border bg-card p-5 shadow-2xl">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Make it yours</p><h2 className="mt-1 text-lg font-semibold">Design</h2></div><Button variant="ghost" size="icon" onClick={() => setSettingsOpen(false)}>×</Button></div>
              <div className="mt-7 space-y-7">
                <div><p className="mb-3 flex items-center gap-2 text-xs font-semibold"><LayoutTemplate className="size-4 text-primary" />Template</p><div className="grid grid-cols-3 gap-2">{(platform.data?.templates ?? [{ key: "clarity" as const, name: "Clarity" }, { key: "modern" as const, name: "Modern" }, { key: "executive" as const, name: "Executive" }]).map(item => <button key={item.key} onClick={() => patch("template", item.key)} className={cn("rounded-xl border p-2 text-[10px] font-medium capitalize", resume.template === item.key ? "border-primary bg-primary/5 text-primary" : "border-border")}><span className="mb-2 block aspect-[.72] bg-white shadow-sm"><i className="mt-3 inline-block h-0.5 w-3/4 bg-zinc-300" /></span>{item.name}</button>)}</div></div>
                <div><p className="mb-3 flex items-center gap-2 text-xs font-semibold"><Palette className="size-4 text-primary" />Accent color</p><div className="flex flex-wrap gap-2">{(platform.data?.colorThemes ?? ["#0877C9", "#1597D4", "#0E7490", "#0F766E", "#334155", "#9A3412"]).map(color => <button key={color} aria-label={`Use color ${color}`} onClick={() => patch("accentColor", color)} className={cn("grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-card transition hover:scale-110", resume.accentColor === color && "ring-2 ring-primary")} style={{ backgroundColor: color }}>{resume.accentColor === color && <Check className="size-3.5 text-white" />}</button>)}</div></div>
                <Field label="Font family"><select value={resume.fontFamily} onChange={e => patch("fontFamily", e.target.value as ResumeDraft["fontFamily"])} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">{(platform.data?.availableFonts ?? ["Inter", "Manrope", "Georgia"]).map(font => <option key={font}>{font}</option>)}</select></Field>
                <Field label="Paper size"><select value={resume.paperSize} onChange={e => patch("paperSize", e.target.value as ResumeDraft["paperSize"])} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="A4">A4</option><option value="LETTER">US Letter</option></select></Field>
                <div><p className="mb-3 text-xs font-semibold">Spacing</p><div className="grid grid-cols-3 rounded-xl bg-secondary p-1">{(["compact", "comfortable", "spacious"] as const).map(item => <button key={item} onClick={() => patch("spacing", item)} className={cn("rounded-lg px-2 py-2 text-[10px] font-medium capitalize", resume.spacing === item && "bg-card shadow-sm")}>{item}</button>)}</div></div>
                <div className="rounded-2xl border border-border p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold">Public link</p><p className="mt-1 text-[10px] text-muted-foreground">Anyone with the link can view.</p></div><button onClick={() => patch("isPublic", !resume.isPublic)} className={cn("relative h-6 w-11 rounded-full", resume.isPublic ? "bg-primary" : "bg-secondary")}><span className={cn("absolute top-1 size-4 rounded-full bg-white transition", resume.isPublic ? "left-6" : "left-1")} /></button></div>{resume.isPublic && <><Field label="Custom link"><Input className="mt-3" defaultValue={resume.slug} onBlur={async event => { if (demo || event.target.value === resume.slug) return; try { await manageResumeAction(resume.id, { operation: "slug", slug: event.target.value }); patch("slug", event.target.value); toast.success("Public link updated."); } catch { event.target.value = resume.slug; toast.error("Use lowercase letters, numbers, and hyphens. That link may already be taken."); } }} /></Field><Button variant="outline" size="sm" className="mt-3 w-full" onClick={share}><Copy className="size-3.5" />Copy public link</Button></>}</div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

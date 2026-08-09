"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowUpRight, Archive, Copy, Download, Eye, FilePlus2, FileText, MoreHorizontal, Search, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteResumeAction, duplicateResumeAction, manageResumeAction } from "@/app/actions/resumes";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRelative } from "@/lib/utils";
import type { ResumeSummary } from "@/types/resume";
import { motion, useReducedMotion } from "framer-motion";

export function DashboardView({ resumes, name = "there", demo = false }: { resumes: ResumeSummary[]; name?: string; demo?: boolean }) {
  const reducedMotion = useReducedMotion();
  const [items, setItems] = useState(resumes);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"updated" | "name" | "completion">("updated");
  const [status, setStatus] = useState<"all" | "DRAFT" | "PUBLISHED" | "ARCHIVED">("all");
  const [menu, setMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResumeSummary | null>(null);
  const filtered = useMemo(() => items.filter(item => item.title.toLowerCase().includes(query.toLowerCase()) && (status === "all" || item.status === status)).sort((a, b) => sort === "name" ? a.title.localeCompare(b.title) : sort === "completion" ? b.completion - a.completion : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [items, query, sort, status]);
  const views = items.reduce((sum, item) => sum + item.views, 0);
  const downloads = items.reduce((sum, item) => sum + item.downloads, 0);
  const editHref = (id: string) => demo ? `/demo/resumes/${id}/edit` : `/resumes/${id}/edit`;

  const removeMutation = useMutation({
    mutationFn: deleteResumeAction,
    onMutate: id => { const previous = items; setItems(current => current.filter(item => item.id !== id)); return { previous }; },
    onError: (_error, _id, context) => { if (context?.previous) setItems(context.previous); toast.error("The resume could not be deleted."); },
    onSuccess: () => toast.success("Resume deleted."),
  });
  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => manageResumeAction(id, { operation: "archive", archived }),
    onMutate: ({ id, archived }) => { const previous = items; setItems(current => current.map(item => item.id === id ? { ...item, status: archived ? "ARCHIVED" : "DRAFT" } : item)); return { previous }; },
    onError: (_error, _variables, context) => { if (context?.previous) setItems(context.previous); toast.error("The resume could not be updated."); },
    onSuccess: () => toast.success("Resume status updated."),
  });

  return <div className="mx-auto max-w-7xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-primary">Good morning, {name.split(" ")[0]} ✦</p><h1 className="horizon-rule mt-1 text-3xl font-semibold tracking-tight">Your career story, in progress.</h1><p className="mt-3 text-sm text-muted-foreground">Pick up where you left off or begin something new.</p></div><Link href={demo ? "/demo/resumes/demo-resume/edit" : "/dashboard/resumes?new=true"}><Button size="lg"><FilePlus2 className="size-4" />Create a resume</Button></Link></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">{[{ label: "Total resumes", value: items.length, icon: FileText }, { label: "Total views", value: views, icon: Eye }, { label: "PDF downloads", value: downloads, icon: Download }].map(({ label, value, icon: Icon }, index) => <motion.div key={label} initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reducedMotion ? 0 : index * .05 }}><Card className="p-5 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-xl"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div><div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary/12 to-sky-400/12 text-primary"><Icon className="size-4" /></div></div></Card></motion.div>)}</div>
    {items.length > 0 && <Card className="mt-5 flex items-center gap-5 border-primary/15 bg-gradient-to-r from-primary/9 via-card to-cyan-300/10 p-6"><Sparkles className="size-5 text-primary" /><div className="flex-1"><p className="font-semibold">Your strongest resume is {Math.max(...items.map(item => item.completion))}% complete</p><p className="mt-1 text-xs text-muted-foreground">Focused, measurable achievements make your story easier to trust.</p></div><Link href={editHref(items[0].id)} className="hidden items-center gap-1 text-sm font-semibold text-primary transition hover:gap-2 sm:flex">Continue <ArrowUpRight className="size-4" /></Link></Card>}
    <section className="mt-9"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h2 className="text-lg font-semibold">Your resumes</h2><p className="mt-1 text-xs text-muted-foreground">Search, filter, archive, and manage your work.</p></div><div className="flex flex-wrap gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search resumes" className="min-w-48 pl-9" /></div><select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value as typeof status)} className="h-11 rounded-xl border border-border bg-card px-3 text-xs"><option value="all">All statuses</option><option value="DRAFT">Drafts</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select><select aria-label="Sort resumes" value={sort} onChange={event => setSort(event.target.value as typeof sort)} className="h-11 rounded-xl border border-border bg-card px-3 text-xs"><option value="updated">Recently edited</option><option value="name">Name</option><option value="completion">Completion</option></select></div></div>
      {filtered.length === 0 ? <Card className="mt-5 border-dashed p-12 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/8"><FileText className="size-6 text-primary" /></span><h3 className="mt-4 font-semibold">No resumes match this view</h3><p className="mt-2 text-sm text-muted-foreground">Adjust the filters or create a fresh resume.</p></Card> : <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(resume => <Card key={resume.id} className="group overflow-hidden transition hover:-translate-y-1 hover:border-primary/20 hover:shadow-2xl"><Link href={editHref(resume.id)} className="block bg-gradient-to-br from-[#e2f3f9] to-[#f6fbfd] p-6 dark:from-[#062136] dark:to-[#0b344d]"><div className="mx-auto aspect-[.707] max-w-48 bg-white p-5 text-[#08243a] shadow-lg transition duration-300 group-hover:scale-[1.02]"><div className="border-b border-sky-700 pb-3 text-[10px] font-bold">{resume.title.toUpperCase()}</div>{[90, 76, 94, 68, 86].map((width, index) => <div key={index} className="mt-4 h-1 bg-zinc-200" style={{ width: `${width}%` }} />)}</div></Link><div className="p-5"><div className="flex items-start justify-between"><div><Link href={editHref(resume.id)} className="font-semibold hover:text-primary">{resume.title}</Link><p className="mt-1 text-xs text-muted-foreground">Edited {formatRelative(resume.updatedAt)}</p></div><div className="relative"><Button variant="ghost" size="icon" onClick={() => setMenu(menu === resume.id ? null : resume.id)} aria-label={`Manage ${resume.title}`}><MoreHorizontal className="size-4" /></Button>{menu === resume.id && !demo && <div className="glass absolute right-0 z-20 w-40 rounded-xl p-1.5 shadow-xl"><button onClick={async () => { await duplicateResumeAction(resume.id); location.reload(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-secondary"><Copy className="size-3.5" />Duplicate</button><button onClick={() => { archiveMutation.mutate({ id: resume.id, archived: resume.status !== "ARCHIVED" }); setMenu(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-secondary"><Archive className="size-3.5" />{resume.status === "ARCHIVED" ? "Unarchive" : "Archive"}</button><button onClick={() => { setDeleteTarget(resume); setMenu(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-500 hover:bg-red-500/10"><Trash2 className="size-3.5" />Delete</button></div>}</div></div><div className="mt-4 flex justify-between text-[11px]"><span className="rounded-full bg-secondary px-2 py-1">{resume.status.toLowerCase()}</span><span className="text-muted-foreground"><Eye className="mr-1 inline size-3" />{resume.views} · <Download className="mr-1 inline size-3" />{resume.downloads}</span></div></div></Card>)}</div>}
    </section>
    <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}><AlertDialogContent><AlertDialogTitle>Delete “{deleteTarget?.title}”?</AlertDialogTitle><AlertDialogDescription>This permanently removes the resume, its public link, and analytics. This cannot be undone.</AlertDialogDescription><div className="mt-6 flex justify-end gap-2"><AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel><AlertDialogAction asChild><Button variant="danger" onClick={() => { if (deleteTarget) removeMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}>Delete permanently</Button></AlertDialogAction></div></AlertDialogContent></AlertDialog>
  </div>;
}

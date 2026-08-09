"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Megaphone, Headphones, MessageSquarePlus, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

type Ticket = { id: string; email: string; subject: string; type: string; status: string; priority: string; updatedAt: string | Date; _count: { messages: number } };
type Faq = { id: string; question: string; answer: string; category: string; published: boolean };
type Announcement = { id: string; title: string; message: string; kind: string; active: boolean; endsAt: string | Date | null };
type TicketDetail = Ticket & { messages: { id: string; body: string; isInternal: boolean; createdAt: string; author: { name: string | null; email: string } | null }[] };

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? "The support operation failed.");
  return body;
}

export function SupportCenter({ initialTickets, faqs: initialFaqs, announcements: initialAnnouncements }: { initialTickets: Ticket[]; faqs: Faq[]; announcements: Announcement[] }) {
  const [tab, setTab] = useState<"tickets" | "faq" | "announcements">("tickets");
  const [tickets, setTickets] = useState(initialTickets);
  const [faqs, setFaqs] = useState(initialFaqs);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [faqDraft, setFaqDraft] = useState({ question: "", answer: "", category: "General", published: true });
  const [announcementDraft, setAnnouncementDraft] = useState({ title: "", message: "", kind: "info", active: true });
  const queryClient = useQueryClient();
  const detail = useQuery({
    queryKey: ["admin-ticket", selectedTicket],
    enabled: Boolean(selectedTicket),
    queryFn: async () => (await requestJson(`/api/admin/support/${selectedTicket}`)).data as TicketDetail,
  });
  const ticketMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: object }) => requestJson(`/api/admin/support/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    onMutate: ({ id, payload }) => {
      const previous = tickets;
      if ("status" in payload && "priority" in payload) setTickets(current => current.map(ticket => ticket.id === id ? { ...ticket, status: String(payload.status), priority: String(payload.priority) } : ticket));
      return { previous };
    },
    onError: (error, _variables, context) => { if (context) setTickets(context.previous); toast.error(error.message); },
    onSuccess: body => { toast.success(body.summary); setNote(""); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-ticket"] }); },
  });
  const faqMutation = useMutation({
    mutationFn: async ({ method, payload }: { method: "POST" | "DELETE"; payload: object }) => requestJson("/api/admin/faqs", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    onSuccess: (body, variables) => {
      if (variables.method === "DELETE") setFaqs(current => current.filter(faq => faq.id !== (variables.payload as { id: string }).id));
      else setFaqs(current => [body.data, ...current.filter(faq => faq.id !== body.data.id)]);
      setFaqDraft({ question: "", answer: "", category: "General", published: true }); toast.success("FAQ content updated.");
    },
    onError: error => toast.error(error.message),
  });
  const announcementMutation = useMutation({
    mutationFn: async ({ method, payload }: { method: "POST" | "DELETE"; payload: object }) => requestJson("/api/admin/announcements", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    onSuccess: (body, variables) => {
      if (variables.method === "DELETE") setAnnouncements(current => current.filter(item => item.id !== (variables.payload as { id: string }).id));
      else setAnnouncements(current => [body.data, ...current.filter(item => item.id !== body.data.id)]);
      setAnnouncementDraft({ title: "", message: "", kind: "info", active: true }); toast.success("Announcement updated.");
    },
    onError: error => toast.error(error.message),
  });
  return <Card className="overflow-hidden">
    <div className="flex overflow-x-auto border-b border-border p-3" role="tablist" aria-label="Support center views">{(["tickets", "faq", "announcements"] as const).map(value => <button key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${tab === value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>{value}</button>)}</div>
    {tab === "tickets" && <div className="grid min-h-[560px] lg:grid-cols-[.8fr_1.2fr]">
      <div className="border-b border-border lg:border-b-0 lg:border-r"><div className="border-b border-border p-4"><h2 className="font-semibold">Request queue</h2><p className="text-xs text-muted-foreground">{tickets.length} loaded requests</p></div><div className="max-h-[640px] overflow-y-auto divide-y divide-border">{tickets.map(ticket => <button key={ticket.id} onClick={() => setSelectedTicket(ticket.id)} className={`w-full p-4 text-left hover:bg-secondary/50 ${selectedTicket === ticket.id ? "bg-primary/5" : ""}`}><div className="flex items-start justify-between gap-3"><p className="line-clamp-1 text-sm font-semibold">{ticket.subject}</p><Badge>{ticket.priority}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{ticket.email} · {ticket.type.replaceAll("_", " ")}</p><div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>{ticket._count.messages} messages</span><span>{new Date(ticket.updatedAt).toLocaleDateString()}</span></div></button>)}{!tickets.length && <div className="p-10 text-center text-sm text-muted-foreground">No support requests.</div>}</div></div>
      <div className="p-5">{!selectedTicket ? <div className="grid h-full min-h-72 place-items-center text-center"><div><Headphones className="mx-auto size-10 text-muted-foreground" /><h3 className="mt-4 font-semibold">Select a support request</h3><p className="mt-1 text-sm text-muted-foreground">Messages and internal notes will appear here.</p></div></div> : detail.isLoading ? <p className="text-sm text-muted-foreground">Loading conversation…</p> : detail.data ? <div><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-semibold">{detail.data.subject}</h2><p className="text-xs text-muted-foreground">{detail.data.email}</p></div><div className="flex gap-2"><select aria-label="Ticket priority" className="h-9 rounded-lg border border-border bg-background px-2 text-xs" value={detail.data.priority} onChange={event => ticketMutation.mutate({ id: detail.data.id, payload: { action: "update", status: detail.data.status, priority: event.target.value } })}><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select><select aria-label="Ticket status" className="h-9 rounded-lg border border-border bg-background px-2 text-xs" value={detail.data.status} onChange={event => ticketMutation.mutate({ id: detail.data.id, payload: { action: "update", status: event.target.value, priority: detail.data.priority } })}><option>OPEN</option><option>IN_PROGRESS</option><option>WAITING_ON_USER</option><option>RESOLVED</option><option>CLOSED</option></select></div></div><div className="mt-5 max-h-80 space-y-3 overflow-y-auto">{detail.data.messages.map(message => <div key={message.id} className={`rounded-xl p-3 ${message.isInternal ? "border border-amber-500/20 bg-amber-500/5" : "bg-secondary"}`}><div className="flex justify-between gap-3 text-[10px] text-muted-foreground"><span>{message.author?.name || message.author?.email || detail.data.email}{message.isInternal && " · Internal note"}</span><span>{new Date(message.createdAt).toLocaleString()}</span></div><p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p></div>)}</div><label className="mt-5 block text-sm font-medium">Internal administrator note<Textarea className="mt-1.5" value={note} onChange={event => setNote(event.target.value)} placeholder="Visible only to administrators…" /></label><Button className="mt-3" disabled={note.trim().length < 2 || ticketMutation.isPending} onClick={() => ticketMutation.mutate({ id: detail.data.id, payload: { action: "note", body: note, internal: true } })}><Send className="size-4" />Add internal note</Button></div> : <p className="text-sm text-rose-600">The conversation could not be loaded.</p>}</div>
    </div>}
    {tab === "faq" && <div className="grid gap-6 p-5 lg:grid-cols-[.75fr_1.25fr]"><form className="space-y-4" onSubmit={event => { event.preventDefault(); faqMutation.mutate({ method: "POST", payload: faqDraft }); }}><div className="flex items-center gap-2"><BookOpen className="size-4 text-primary" /><h2 className="font-semibold">Create FAQ</h2></div><label className="block text-sm font-medium">Question<Input className="mt-1.5" value={faqDraft.question} onChange={event => setFaqDraft(current => ({ ...current, question: event.target.value }))} /></label><label className="block text-sm font-medium">Answer<Textarea rows={7} className="mt-1.5" value={faqDraft.answer} onChange={event => setFaqDraft(current => ({ ...current, answer: event.target.value }))} /></label><label className="block text-sm font-medium">Category<Input className="mt-1.5" value={faqDraft.category} onChange={event => setFaqDraft(current => ({ ...current, category: event.target.value }))} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={faqDraft.published} onChange={event => setFaqDraft(current => ({ ...current, published: event.target.checked }))} />Published</label><Button type="submit"><MessageSquarePlus className="size-4" />Save FAQ</Button></form><div className="space-y-3">{faqs.map(faq => <div key={faq.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{faq.question}</p><p className="mt-1 text-xs text-muted-foreground">{faq.category} · {faq.published ? "Published" : "Draft"}</p></div><Button variant="danger" size="icon" aria-label={`Delete ${faq.question}`} onClick={() => faqMutation.mutate({ method: "DELETE", payload: { id: faq.id } })}><Trash2 className="size-4" /></Button></div><p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{faq.answer}</p></div>)}{!faqs.length && <p className="rounded-xl bg-secondary p-8 text-center text-sm text-muted-foreground">No FAQs have been created.</p>}</div></div>}
    {tab === "announcements" && <div className="grid gap-6 p-5 lg:grid-cols-[.75fr_1.25fr]"><form className="space-y-4" onSubmit={event => { event.preventDefault(); announcementMutation.mutate({ method: "POST", payload: { ...announcementDraft, endsAt: null } }); }}><div className="flex items-center gap-2"><Megaphone className="size-4 text-primary" /><h2 className="font-semibold">New announcement</h2></div><label className="block text-sm font-medium">Title<Input className="mt-1.5" value={announcementDraft.title} onChange={event => setAnnouncementDraft(current => ({ ...current, title: event.target.value }))} /></label><label className="block text-sm font-medium">Message<Textarea rows={6} className="mt-1.5" value={announcementDraft.message} onChange={event => setAnnouncementDraft(current => ({ ...current, message: event.target.value }))} /></label><label className="block text-sm font-medium">Type<select className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3" value={announcementDraft.kind} onChange={event => setAnnouncementDraft(current => ({ ...current, kind: event.target.value }))}><option>info</option><option>success</option><option>warning</option><option>critical</option></select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={announcementDraft.active} onChange={event => setAnnouncementDraft(current => ({ ...current, active: event.target.checked }))} />Active</label><Button type="submit"><Megaphone className="size-4" />Publish announcement</Button></form><div className="space-y-3">{announcements.map(item => <div key={item.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.kind} · {item.active ? "Active" : "Inactive"}</p></div><Button variant="danger" size="icon" aria-label={`Delete ${item.title}`} onClick={() => announcementMutation.mutate({ method: "DELETE", payload: { id: item.id } })}><Trash2 className="size-4" /></Button></div><p className="mt-3 text-sm text-muted-foreground">{item.message}</p></div>)}{!announcements.length && <p className="rounded-xl bg-secondary p-8 text-center text-sm text-muted-foreground">No announcements have been published.</p>}</div></div>}
  </Card>;
}

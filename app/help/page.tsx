import Link from "next/link";
import { FileText, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/support/contact-form";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Help & support" };

export default async function HelpPage() {
  const faqs = await prisma.faq.findMany({ where: { published: true }, orderBy: [{ category: "asc" }, { position: "asc" }] }).catch(() => []);
  return <main id="main-content" className="min-h-screen bg-background/55"><header className="border-b border-border bg-background/65 backdrop-blur-xl"><div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5"><Link href="/" className="flex items-center gap-2 font-bold"><FileText className="size-4 text-primary" />Resumly</Link><Link href="/login" className="text-sm font-semibold text-primary">Sign in</Link></div></header><div className="mx-auto max-w-6xl px-5 py-14"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-widest text-primary">Help center</p><h1 className="horizon-rule mt-2 text-4xl font-semibold tracking-tight">How can we help?</h1><p className="mt-3 text-muted-foreground">Browse answers or send a secure request to the support team.</p></div><div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_.8fr]"><section><h2 className="flex items-center gap-2 text-lg font-semibold"><HelpCircle className="size-5 text-primary" />Frequently asked questions</h2><div className="mt-4 space-y-3">{faqs.map(faq => <details key={faq.id} className="group rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-xl"><summary className="cursor-pointer list-none font-semibold">{faq.question}</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{faq.answer}</p></details>)}{!faqs.length && <Card className="p-8 text-center text-sm text-muted-foreground">No published FAQs yet. You can still contact support.</Card>}</div></section><Card className="h-fit p-6"><h2 className="text-lg font-semibold">Contact support</h2><p className="mb-5 mt-1 text-xs text-muted-foreground">Never include passwords, API keys, or other secrets.</p><ContactForm /></Card></div></div></main>;
}

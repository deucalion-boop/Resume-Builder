import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, FileText, LayoutTemplate, ShieldCheck, Sparkles, Star, WandSparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { defaultPlatformSettings, getPlatformSettings } from "@/features/admin/settings/server/settings-service";
import { Reveal } from "@/components/ui/motion";

const features = [
  { icon: WandSparkles, title: "Write with confidence", copy: "Thoughtful prompts and real-time guidance help you tell your story with clarity." },
  { icon: LayoutTemplate, title: "Designed to get read", copy: "Beautiful, ATS-friendly templates that look sharp on screen and on paper." },
  { icon: ShieldCheck, title: "Your work, always safe", copy: "Private by default, saved as you type, and ready whenever inspiration strikes." },
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings().catch(() => defaultPlatformSettings);
  return { title: settings.seoTitle, description: settings.seoDescription, ...(settings.faviconUrl ? { icons: { icon: settings.faviconUrl } } : {}) };
}

export default async function Home() {
  const settings = await getPlatformSettings().catch(() => defaultPlatformSettings);
  const announcement = await prisma.announcement.findFirst({
    where: { active: true, startsAt: { lte: new Date() }, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
    orderBy: { createdAt: "desc" },
  }).catch(() => null);
  return (
    <main id="main-content" className="overflow-hidden">
      {(settings.announcement || announcement) && <div className="bg-primary px-4 py-2 text-center text-xs font-medium text-white" role="status">{announcement?.message || settings.announcement}</div>}
      <div className="relative min-h-screen">
        <div className="horizon-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] opacity-65" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] bg-[radial-gradient(circle_at_72%_18%,rgba(56,189,248,.18),transparent_30%),radial-gradient(circle_at_15%_28%,rgba(21,94,239,.13),transparent_28%)]" />
        <nav className="sticky top-0 z-40 mx-auto flex h-20 max-w-7xl items-center justify-between border-b border-transparent bg-background/70 px-5 backdrop-blur-2xl lg:px-8" aria-label="Main navigation">
          <Link href="/" className="flex shrink-0 items-center" aria-label={`${settings.applicationName} home`}>
            {settings.logoUrl
              ? <Image src={settings.logoUrl} alt="" width={176} height={56} unoptimized className="h-14 w-32 object-contain sm:w-44" />
              : <Image src="/images/BLUE HORIZON.png" alt="Blue Horizon CV" width={1600} height={900} preload className="h-14 w-32 object-cover object-center sm:w-44" />}
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#templates" className="hover:text-foreground">Templates</a>
            <a href="#stories" className="hover:text-foreground">Stories</a>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold hover:bg-secondary sm:block">Sign in</Link>
            <Link href="/register" className="rounded-xl bg-gradient-to-b from-[#159bd3] to-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:brightness-105">Start building</Link>
          </div>
        </nav>

        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:pb-28 lg:pt-24">
          <Reveal className="relative z-10 text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3.5 py-2 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> Your story deserves a great first impression
            </div>
            <h1 className="text-balance text-5xl font-semibold leading-[1.03] tracking-[-.05em] sm:text-6xl lg:text-[72px]">
              A resume that feels <span className="relative bg-gradient-to-r from-blue-700 via-primary to-sky-500 bg-clip-text text-transparent dark:from-blue-300 dark:to-sky-300">like you<svg aria-hidden="true" className="absolute -bottom-2 left-0 w-full text-sky-400" viewBox="0 0 220 14" fill="none"><path d="M3 10C55 3 155 2 217 7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".32"/></svg></span>.
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-balance text-lg leading-8 text-muted-foreground lg:mx-0">
              Build a polished, professional resume without wrestling with formatting. Simple tools, thoughtful guidance, beautiful results.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/register" className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-hover">
                Create my resume <ArrowRight className="size-4" />
              </Link>
              <Link href="/demo/resumes/demo-resume/edit" className="inline-flex h-13 items-center justify-center rounded-xl border border-border bg-card/70 px-6 font-semibold backdrop-blur hover:bg-card">
                Explore the editor
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
              {["Free to get started", "No credit card", "Export anytime"].map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" />{item}</span>)}
            </div>
          </Reveal>

          <Reveal delay={0.08} className="relative mx-auto w-full max-w-2xl lg:mx-0">
            <div className="absolute -inset-12 -z-10 rounded-full bg-primary/10 blur-3xl" />
            <div className="animate-float glass relative rounded-[28px] p-3 sm:p-5">
              <div className="flex items-center justify-between px-2 pb-4">
                <div className="flex gap-1.5"><i className="size-2.5 rounded-full bg-red-300" /><i className="size-2.5 rounded-full bg-amber-300" /><i className="size-2.5 rounded-full bg-emerald-300" /></div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-600">All changes saved</span>
              </div>
              <div className="grid min-h-[450px] overflow-hidden rounded-2xl border border-border bg-background sm:grid-cols-[.65fr_1.35fr]">
                <div className="hidden border-r border-border bg-card p-5 sm:block">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Content</p>
                  <div className="mt-5 space-y-3">
                    {["Personal details", "Professional summary", "Work experience", "Education", "Skills"].map((item, i) => (
                      <div key={item} className={`rounded-lg px-3 py-2.5 text-[11px] font-medium ${i === 1 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>{item}</div>
                    ))}
                  </div>
                  <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full w-4/5 rounded-full bg-primary" /></div>
                  <p className="mt-2 text-[9px] text-muted-foreground">82% complete</p>
                </div>
                <div className="dot-grid bg-[#eaf2ff] p-4 sm:p-7 dark:bg-[#0b1a30]">
                  <div className="mx-auto min-h-[390px] max-w-[310px] bg-white p-7 text-[#26232c] shadow-xl">
                    <div className="border-b-2 border-[#0877c9] pb-4">
                      <h3 className="text-xl font-bold tracking-tight">Maya Chen</h3>
                      <p className="mt-1 text-[9px] font-semibold text-[#0877c9]">SENIOR PRODUCT DESIGNER</p>
                      <p className="mt-2 text-[7px] text-zinc-500">San Francisco, CA · maya@design.co · mayachen.design</p>
                    </div>
                    <div className="mt-5">
                      <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[#0877c9]">Profile</p>
                      <p className="mt-2 text-[7px] leading-[1.7] text-zinc-600">Product designer with 7+ years of experience turning complex workflows into clear, human-centered experiences.</p>
                    </div>
                    <div className="mt-5">
                      <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[#0877c9]">Experience</p>
                      <div className="mt-2 flex justify-between"><div><p className="text-[8px] font-bold">Senior Product Designer</p><p className="text-[7px] text-zinc-500">Northstar Labs</p></div><p className="text-[6px] text-zinc-400">2022 — Present</p></div>
                      <p className="mt-2 text-[7px] leading-[1.7] text-zinc-600">Led end-to-end design for the analytics platform, increasing activation by 28%.</p>
                    </div>
                    <div className="mt-5">
                      <p className="text-[8px] font-bold uppercase tracking-[.18em] text-[#0877c9]">Skills</p>
                      <div className="mt-2 flex flex-wrap gap-1">{["Product strategy", "UX research", "Prototyping", "Figma"].map(x => <span key={x} className="rounded bg-[#eaf2ff] px-1.5 py-1 text-[6px]">{x}</span>)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass absolute -right-2 top-16 hidden rounded-2xl px-4 py-3 text-xs font-semibold shadow-xl sm:flex"><span className="mr-2 text-lg">✨</span> Looking sharp!</div>
          </Reveal>
        </section>
      </div>

      <Reveal><section id="features" className="border-y border-border bg-card/60 px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">Everything you need</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Less formatting. More of what makes you brilliant.</h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-3xl border border-border bg-background p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></div>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section></Reveal>

      <Reveal><section id="stories" className="px-5 py-24">
        <div className="ocean-horizon relative mx-auto max-w-4xl overflow-hidden rounded-[32px] px-7 py-14 text-center text-white shadow-2xl shadow-blue-950/20 sm:px-16">
          <div className="horizon-grid absolute inset-0 opacity-20" />
          <div className="relative">
          <div className="flex justify-center gap-1 text-amber-300">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}</div>
          <blockquote className="mx-auto mt-6 max-w-2xl text-balance text-2xl font-medium leading-relaxed">“I finally have a resume that sounds like me—and I landed three interviews in the first week.”</blockquote>
          <p className="mt-5 text-sm text-white/60">Alex Morgan · Product Manager</p>
          </div>
        </div>
      </section></Reveal>

      <footer className="border-t border-border px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-foreground"><FileText className="size-4 text-primary" /> {settings.applicationName}</div>
          <p>Make your next move with confidence.</p>
          <div className="flex items-center gap-3"><Link href="/help" className="hover:text-foreground">Help</Link>{settings.privacyPolicyUrl && <a href={settings.privacyPolicyUrl} className="hover:text-foreground">Privacy</a>}{settings.termsUrl && <a href={settings.termsUrl} className="hover:text-foreground">Terms</a>}<p>© 2026 {settings.applicationName}</p></div>
        </div>
      </footer>
    </main>
  );
}

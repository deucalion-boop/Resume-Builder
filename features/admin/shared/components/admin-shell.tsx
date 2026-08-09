"use client";

import { Activity, BarChart3, FileSearch, Headphones, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, UserCog, X, FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";
import { PageMotion } from "@/components/ui/motion";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: UserCog },
  { href: "/admin/moderation", label: "Moderation", icon: FileSearch },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "System settings", icon: Settings },
  { href: "/admin/security", label: "Security & audit", icon: ShieldCheck },
  { href: "/admin/support", label: "Support center", icon: Headphones },
];

export function AdminShell({ children, admin }: { children: React.ReactNode; admin: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.replace("/");
  }
  const sidebar = <aside className="flex h-full w-[280px] flex-col border-r border-white/10 bg-[linear-gradient(180deg,#021525_0%,#073651_58%,#03131f_100%)] px-4 py-5 text-white shadow-2xl shadow-slate-950/25">
    <div className="flex items-center justify-between px-2">
      <Link href="/admin" className="flex items-center gap-2.5 font-bold"><span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-sky-700 text-white shadow-lg shadow-blue-950/40"><FileText className="size-4" /></span><span>resumly <span className="rounded-md bg-sky-300/12 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-sky-200">Admin</span></span></Link>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close administrator navigation"><X className="size-4" /></Button>
    </div>
    <nav className="mt-8 space-y-1" aria-label="Administrator">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-white/12 text-white shadow-[inset_3px_0_0_#38bdf8]" : "text-blue-100/65 hover:bg-white/7 hover:text-white")}><Icon className={cn("size-4 transition-transform group-hover:scale-110", active && "text-sky-300")} />{label}</Link>;
      })}
    </nav>
    <div className="mt-6 rounded-2xl border border-sky-300/15 bg-sky-300/7 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-sky-200"><Activity className="size-3.5" />Administrative workspace</div>
      <p className="mt-2 text-[11px] leading-relaxed text-blue-100/55">Privileged actions are validated and recorded in the security audit trail.</p>
    </div>
    <div className="mt-auto border-t border-white/10 pt-4">
      <Link href="/dashboard" className="mb-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-blue-100/55 hover:bg-white/7 hover:text-white">User dashboard <ArrowUpRight className="size-3.5" /></Link>
      <div className="flex items-center gap-3 rounded-xl p-2">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-sky-700 text-xs font-bold text-white ring-2 ring-white/10">{initials(admin.name)}</div>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{admin.name}</p><p className="truncate text-[11px] text-blue-100/55">{admin.email}</p></div>
        <button onClick={signOut} className="rounded-lg p-2 text-blue-100/55 hover:bg-white/7 hover:text-white" aria-label="Sign out"><LogOut className="size-4" /></button>
      </div>
    </div>
  </aside>;
  return <div className="min-h-screen bg-background/55">
    <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
    {open && <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}><div className="h-full w-[280px]" onClick={event => event.stopPropagation()}>{sidebar}</div></div>}
    <div className="lg:pl-[280px]">
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border/80 bg-background/72 px-4 shadow-[0_1px_20px_rgba(15,46,92,.04)] backdrop-blur-2xl sm:px-7">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open administrator navigation"><Menu className="size-5" /></Button>
        <p className="hidden text-xs text-muted-foreground lg:block">Operations, safety, and platform health</p>
        <div className="ml-auto"><ThemeToggle /></div>
      </header>
      <main id="main-content" className="px-4 py-7 sm:px-7 lg:px-10 lg:py-10"><PageMotion>{children}</PageMotion></main>
    </div>
  </div>;
}

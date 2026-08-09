"use client";

import { BarChart3, FilePlus2, Files, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, UserRound, X, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { PageMotion } from "@/components/ui/motion";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/resumes", label: "My resumes", icon: Files },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string; avatarUrl?: string; isAdmin?: boolean } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    try { await createSupabaseBrowserClient().auth.signOut(); } finally { router.replace("/"); }
  }

  if (/^\/resumes\/[^/]+\/edit$/.test(pathname)) return <>{children}</>;

  const sidebar = (
    <aside className="flex h-full w-[264px] flex-col border-r border-white/10 bg-[linear-gradient(180deg,#031a2d_0%,#062f4d_55%,#031625_100%)] px-4 py-5 text-white shadow-2xl shadow-slate-950/20">
      <div className="flex items-center justify-between px-2">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-sky-600 text-white shadow-lg shadow-blue-950/30"><FileText className="size-4" /></span>resumly</Link>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X className="size-4" /></Button>
      </div>
      <Link href="/dashboard/resumes?new=true" className="mt-7 flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-700 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:brightness-110"><FilePlus2 className="size-4" /> New resume</Link>
      <nav className="mt-7 space-y-1" aria-label="Dashboard">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-white/12 text-white shadow-[inset_3px_0_0_#38bdf8]" : "text-blue-100/65 hover:bg-white/7 hover:text-white")}><Icon className={cn("size-4 transition-transform group-hover:scale-110", active && "text-sky-300")} />{label}</Link>;
        })}
      </nav>
      {user.isAdmin && <Link href="/admin" className="mt-3 flex items-center gap-3 rounded-xl border border-sky-300/20 bg-sky-300/8 px-3 py-2.5 text-sm font-semibold text-sky-200"><ShieldCheck className="size-4" />Admin dashboard</Link>}
      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-sky-700 text-xs font-bold text-white ring-2 ring-white/10">{initials(user.name)}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-[11px] text-blue-100/55">{user.email}</p></div>
          <button onClick={signOut} className="text-blue-100/55 hover:text-white" aria-label="Sign out"><LogOut className="size-4" /></button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background/55">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
      {open && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}><div className="h-full w-[252px]" onClick={e => e.stopPropagation()}>{sidebar}</div></div>}
      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/72 px-4 shadow-[0_1px_20px_rgba(15,46,92,.04)] backdrop-blur-2xl sm:px-7">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></Button>
          <div className="hidden text-xs text-muted-foreground lg:block">Build something you’re proud to send.</div>
          <div className="ml-auto flex items-center gap-1"><ThemeToggle /><Link href="/settings" className="grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Profile settings"><UserRound className="size-4" /></Link></div>
        </header>
        <main id="main-content" className="px-4 py-7 sm:px-7 lg:px-10 lg:py-10"><PageMotion>{children}</PageMotion></main>
      </div>
    </div>
  );
}

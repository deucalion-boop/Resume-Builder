import Link from "next/link";
import { CheckCircle2, FileText, Sparkles } from "lucide-react";
import { PageMotion } from "@/components/ui/motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="grid min-h-screen lg:grid-cols-2">
      <section className="relative flex items-center justify-center px-5 py-12">
        <div className="horizon-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="w-full max-w-[430px]">
          <Link href="/" className="relative mb-12 inline-flex items-center gap-2.5 font-bold"><span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-sky-700 text-white shadow-lg shadow-primary/20"><FileText className="size-4" /></span>Blue Horizon CV</Link>
          <PageMotion className="relative rounded-3xl border border-border/80 bg-card/70 p-6 shadow-2xl shadow-blue-950/6 backdrop-blur-xl sm:p-8">{children}</PageMotion>
        </div>
      </section>
      <aside className="ocean-horizon relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 horizon-grid" />
        <div className="absolute -right-40 -top-40 size-[500px] rounded-full bg-sky-300/25 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs backdrop-blur"><Sparkles className="size-3.5 text-sky-300" /> The calm way to build your career story</span>
        </div>
        <div className="relative mx-auto w-full max-w-lg">
          <h2 className="text-balance text-4xl font-semibold leading-tight">Your next opportunity starts with one great page.</h2>
          <div className="mt-8 space-y-4 text-sm text-white/70">
            {["Professional ATS-friendly templates", "Autosave and live preview", "Export, print, or share in one click"].map(item => <p key={item} className="flex items-center gap-3"><CheckCircle2 className="size-4 text-sky-300" />{item}</p>)}
          </div>
        </div>
        <p className="relative text-xs text-white/40">Trusted by thoughtful professionals making their next move.</p>
      </aside>
    </main>
  );
}

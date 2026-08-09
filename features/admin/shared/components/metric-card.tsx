import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MetricCard({ label, value, detail, icon: Icon, tone = "primary" }: { label: string; value: string | number; detail: string; icon: LucideIcon; tone?: "primary" | "emerald" | "amber" | "rose" }) {
  const tones = { primary: "bg-primary/10 text-primary", emerald: "bg-emerald-500/10 text-emerald-600", amber: "bg-amber-500/10 text-amber-600", rose: "bg-rose-500/10 text-rose-600" };
  return <Card className="p-5 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-xl"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div><span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-4.5" /></span></div></Card>;
}

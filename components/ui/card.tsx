import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("premium-card rounded-2xl border border-border/90 bg-card/88 shadow-[inset_0_1px_0_rgba(255,255,255,.48)] backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-200", className)} {...props} />;
}

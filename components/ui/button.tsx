import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "outline" | "danger";
  size?: "default" | "sm" | "icon" | "lg";
};

export function Button({ className, variant = "default", size = "default", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[.98] disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-gradient-to-b from-[#159bd3] to-primary text-white shadow-[0_10px_28px_-12px_var(--primary)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_14px_34px_-12px_var(--primary)]",
        variant === "secondary" && "bg-secondary text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.35)] hover:bg-secondary/75",
        variant === "ghost" && "text-muted-foreground hover:bg-primary/8 hover:text-foreground",
        variant === "outline" && "border border-border bg-card/75 text-foreground shadow-sm backdrop-blur hover:-translate-y-px hover:border-primary/30 hover:bg-primary/5",
        variant === "danger" && "bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400",
        size === "default" && "h-10 px-4",
        size === "sm" && "h-8 rounded-lg px-3 text-xs",
        size === "icon" && "size-10 p-0",
        size === "lg" && "h-12 px-6",
        className,
      )}
      {...props}
    />
  );
}

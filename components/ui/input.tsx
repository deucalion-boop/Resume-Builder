import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-card/70 px-3.5 text-sm shadow-[inset_0_1px_2px_rgba(10,35,75,.04)] outline-none transition placeholder:text-muted-foreground/65 hover:border-primary/25 focus:border-primary/60 focus:bg-card focus:ring-4 focus:ring-primary/10",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full resize-y rounded-xl border border-border bg-card/70 px-3.5 py-3 text-sm leading-6 shadow-[inset_0_1px_2px_rgba(10,35,75,.04)] outline-none transition placeholder:text-muted-foreground/65 hover:border-primary/25 focus:border-primary/60 focus:bg-card focus:ring-4 focus:ring-primary/10",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

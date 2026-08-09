export function AdminPageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>{eyebrow && <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{eyebrow}</p>}<h1 className="horizon-rule mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p></div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>;
}

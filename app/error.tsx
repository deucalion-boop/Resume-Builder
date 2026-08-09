"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="grid min-h-screen place-items-center p-5"><div className="max-w-md text-center"><p className="text-sm font-semibold text-primary">Something went wrong</p><h1 className="mt-2 text-3xl font-semibold">Your work is still safe.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Try loading this view again. If the problem continues, return to the dashboard.</p><Button className="mt-6" onClick={reset}>Try again</Button></div></main>;
}

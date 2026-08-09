"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Card className="mx-auto mt-16 max-w-lg p-8 text-center" role="alert"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-600"><AlertTriangle className="size-5" /></span><h1 className="mt-5 text-xl font-semibold">Administrator data could not be loaded</h1><p className="mt-2 text-sm text-muted-foreground">No privileged operation was performed. Retry the request or review the security logs.</p><Button className="mt-6" onClick={reset}><RefreshCw className="size-4" />Try again</Button></Card>;
}

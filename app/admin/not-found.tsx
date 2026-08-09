import Link from "next/link";
import { SearchX } from "lucide-react";

export default function AdminNotFound() {
  return <div className="mx-auto max-w-lg py-20 text-center"><SearchX className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-5 text-2xl font-semibold">Administrator record not found</h1><p className="mt-2 text-sm text-muted-foreground">It may have been removed or is outside your authorized scope.</p><Link href="/admin" className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white">Return to admin overview</Link></div>;
}

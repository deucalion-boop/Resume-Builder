import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="mx-auto min-h-screen max-w-7xl px-5 py-10" aria-busy="true" aria-label="Loading page"><Skeleton className="h-8 w-40" /><Skeleton className="mt-8 h-16 w-full" /><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-72" />)}</div></main>;
}

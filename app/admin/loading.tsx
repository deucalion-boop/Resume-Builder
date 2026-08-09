import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return <div aria-busy="true" aria-label="Loading administrator workspace">
    <Skeleton className="h-4 w-28" /><Skeleton className="mt-3 h-9 w-72" /><Skeleton className="mt-3 h-4 w-full max-w-xl" />
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />)}</div>
    <Skeleton className="mt-6 h-96 rounded-2xl" />
  </div>;
}

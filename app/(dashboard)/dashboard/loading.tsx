import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return <div aria-busy="true"><Skeleton className="h-9 w-72" /><Skeleton className="mt-3 h-5 w-96 max-w-full" /><div className="mt-8 grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-32" />)}</div><div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-96" />)}</div></div>;
}

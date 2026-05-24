import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RouteFallback({ label = "Loading your learning space" }: { label?: string }) {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">{label}</p>
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-5 w-[32rem] max-w-full" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-10 w-24" />
            <Skeleton className="mt-3 h-3 w-3/4" />
          </Card>
          <Card>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-10 w-28" />
            <Skeleton className="mt-3 h-3 w-2/3" />
          </Card>
          <Card>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-10 w-20" />
            <Skeleton className="mt-3 h-3 w-5/6" />
          </Card>
        </div>

        <Card className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-64 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}

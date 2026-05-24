import { useQuery } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";

async function fetchModeration() {
  const { data } = await api.get<
    ApiResponse<{
      submissions: Array<{
        _id: string;
        status?: string;
        flagged?: boolean;
        flagReason?: string;
        student?: { fullName?: string };
        project?: { title?: string };
      }>;
    }>
  >("/admin/moderation");
  return data.data.submissions ?? [];
}

export function AdminModerationPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "moderation"],
    queryFn: fetchModeration,
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data?.length) {
    return <EmptyState title="Queue empty" description="No flagged or pending submissions." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Moderation queue</h1>
      {data.map((s) => (
        <Card key={s._id} className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <p className="font-semibold">{s.project?.title ?? "Submission"}</p>
            <p className="text-sm text-[var(--text-muted)]">{s.student?.fullName}</p>
            {s.flagReason ? <p className="text-xs text-warning">{s.flagReason}</p> : null}
          </div>
          <Badge variant={s.flagged ? "default" : "purple"}>{s.status ?? "pending"}</Badge>
        </Card>
      ))}
    </div>
  );
}

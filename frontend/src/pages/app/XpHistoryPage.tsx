import { useQuery } from "@tanstack/react-query";
import { fetchXpHistory, fetchXpSummary } from "@/services/xpService";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { XpPill } from "@/components/composites/StatCard";

export function XpHistoryPage() {
  const summaryQuery = useQuery({ queryKey: ["xp", "summary"], queryFn: fetchXpSummary });
  const historyQuery = useQuery({ queryKey: ["xp", "history"], queryFn: fetchXpHistory });

  if (summaryQuery.isError || historyQuery.isError) {
    return <QueryError onRetry={() => { summaryQuery.refetch(); historyQuery.refetch(); }} />;
  }

  const user = summaryQuery.data?.user as { xp?: number; level?: number } | undefined;
  const logs = historyQuery.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">XP Progress</h1>
      {summaryQuery.isLoading ? (
        <Skeleton className="h-16 w-48" />
      ) : (
        <XpPill xp={user?.xp ?? 0} />
      )}
      {historyQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : logs.length === 0 ? (
        <EmptyState title="No XP yet" description="Complete lessons and sessions to earn your first points." />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{log.reason ?? "XP earned"}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(log.createdAt).toLocaleString()}
                  {log.sourceType ? ` · ${log.sourceType}` : ""}
                </p>
              </div>
              <span className="text-lg font-bold text-primary">+{log.amount}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

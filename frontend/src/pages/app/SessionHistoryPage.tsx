import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchSessions } from "@/services/sessionsService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";

export function SessionHistoryPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const sessions = data ?? [];
  if (!sessions.length) {
    return (
      <EmptyState
        title="No sessions yet"
        description="Join a live session from your dashboard when your mentor schedules one."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Session history</h1>
      <div className="space-y-3">
        {sessions.map((s) => (
          <Card key={s._id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-[var(--text-muted)]">
                {new Date(s.scheduledAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="purple">{s.status ?? "scheduled"}</Badge>
              {s.status === "live" || s.status === "scheduled" ? (
                <Link to={`/app/classroom/${s._id}`}>
                  <Button size="sm">Join</Button>
                </Link>
              ) : null}
              {s.status === "ended" ? (
                <Link to={`/app/sessions/${s._id}/feedback`}>
                  <Button size="sm" variant="outline">
                    Feedback
                  </Button>
                </Link>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

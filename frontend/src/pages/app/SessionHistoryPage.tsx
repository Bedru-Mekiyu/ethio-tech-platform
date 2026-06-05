import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchSessions, type SessionSummary } from "@/services/sessionsService";
import { api } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { cn } from "@/lib/utils";

export function SessionHistoryPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  const [waitlistStates, setWaitlistStates] = useState<
    Record<string, { loading?: boolean; onWaitlist?: boolean; position?: number; error?: string }>
  >({});

  const handleJoinWaitlist = async (sessionId: string) => {
    setWaitlistStates((prev) => ({ ...prev, [sessionId]: { loading: true } }));
    try {
      const res = await api.post(`/sessions/${sessionId}/waitlist`);
      const position = (res.data?.data as { position?: number })?.position;
      setWaitlistStates((prev) => ({ ...prev, [sessionId]: { onWaitlist: true, position, loading: false } }));
    } catch (err) {
      setWaitlistStates((prev) => ({
        ...prev,
        [sessionId]: { error: err instanceof Error ? err.message : "Failed to join waitlist", loading: false },
      }));
    }
  };

  const handleCancelWaitlist = async (sessionId: string) => {
    setWaitlistStates((prev) => ({ ...prev, [sessionId]: { loading: true } }));
    try {
      await api.post(`/sessions/${sessionId}/waitlist/cancel`);
      setWaitlistStates((prev) => ({ ...prev, [sessionId]: { loading: false } }));
    } catch (err) {
      setWaitlistStates((prev) => ({
        ...prev,
        [sessionId]: { error: err instanceof Error ? err.message : "Failed to leave waitlist", loading: false },
      }));
    }
  };

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const sessions = data ?? [];
  if (!sessions.length) {
    return (
      <EmptyState
        title="No sessions yet"
        description="Join a live session from your dashboard when your mentor schedules one."
        actionLabel="Back to dashboard"
        actionHref="/app/dashboard"
      />
    );
  }

  return (
    <div className="page-shell space-y-6">
      <Card className="hero-shell p-6">
        <h1 className="mt-4 text-2xl font-bold text-white md:text-3xl">Session history</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Track your live classroom schedule and post-session feedback.
        </p>
      </Card>
      <div className="space-y-3">
        {sessions.map((s) => {
          const participantCount = (s as SessionSummary & { participants?: unknown[] }).participants?.length ?? 0;
          const maxParticipants = s.maxParticipants ?? 0;
          const isFull = maxParticipants > 0 && participantCount >= maxParticipants;
          const capacityPct = maxParticipants ? Math.min(100, (participantCount / maxParticipants) * 100) : 0;
          const wlState = waitlistStates[s._id];
          return (
            <Card key={s._id} className="surface-panel flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white truncate">{s.title}</p>
                  {isFull ? (
                    <Badge variant="danger" className="shrink-0 text-[10px]">
                      Full
                    </Badge>
                  ) : null}
                  {wlState?.onWaitlist ? (
                    <Badge variant="warning" className="shrink-0 text-[10px]">
                      Waitlisted #{wlState.position}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--text-muted)]">{new Date(s.scheduledAt).toLocaleString()}</p>
                {s.maxParticipants && s.maxParticipants > 0 ? (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 max-w-24 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isFull ? "bg-red-500" : capacityPct > 80 ? "bg-amber-500" : "bg-primary",
                        )}
                        style={{ width: `${capacityPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {participantCount}/{s.maxParticipants}
                    </span>
                  </div>
                ) : null}
                {wlState?.error ? <p className="mt-1 text-xs text-red-400">{wlState.error}</p> : null}
              </div>
              <div className="flex gap-2 shrink-0">
                <Badge variant="purple">{s.status ?? "scheduled"}</Badge>
                {s.status === "live" || s.status === "scheduled" ? (
                  wlState?.onWaitlist ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={wlState.loading}
                      onClick={() => handleCancelWaitlist(s._id)}
                    >
                      {wlState.loading ? "..." : "Leave waitlist"}
                    </Button>
                  ) : (
                    <Link to={`/app/classroom/${s._id}`}>
                      <Button size="sm">Join</Button>
                    </Link>
                  )
                ) : null}
                {isFull && !wlState?.onWaitlist && (s.status === "live" || s.status === "scheduled") ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={wlState?.loading}
                    onClick={() => handleJoinWaitlist(s._id)}
                  >
                    {wlState?.loading ? "..." : "Waitlist"}
                  </Button>
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
          );
        })}
      </div>
    </div>
  );
}

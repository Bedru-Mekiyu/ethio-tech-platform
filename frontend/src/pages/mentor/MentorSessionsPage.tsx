import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Video } from "lucide-react";
import { fetchSessions } from "@/services/sessionsService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { cn } from "@/lib/utils";

type SessionRow = {
  _id?: string;
  title?: string;
  scheduledAt?: string;
  status?: string;
  maxParticipants?: number;
  participants?: unknown[];
};

function SessionsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-[28px]" />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Skeleton className="h-[34rem] rounded-[28px]" />
        <Skeleton className="h-[34rem] rounded-[28px]" />
      </div>
    </div>
  );
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function MentorSessionsPage() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [cursor, setCursor] = useState(new Date());
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["sessions"], queryFn: fetchSessions });

  const sessions = useMemo(() => (Array.isArray(data) ? data : []) as SessionRow[], [data]);
  const filtered = useMemo(() => {
    return sessions.filter((session) => {
      const date = session.scheduledAt ? new Date(session.scheduledAt) : new Date();
      const upcoming = date >= new Date();
      if (filter === "upcoming") return upcoming;
      if (filter === "past") return !upcoming;
      return true;
    });
  }, [filter, sessions]);

  const upcoming = useMemo(
    () => filtered.filter((session) => session.scheduledAt && new Date(session.scheduledAt) >= new Date()),
    [filtered],
  );

  const calendarDays = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const offset = start.getDay();
    const days: Array<Date | null> = [];
    for (let i = 0; i < offset; i += 1) days.push(null);
    for (let day = 1; day <= end.getDate(); day += 1) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    return days;
  }, [cursor]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, SessionRow[]>();
    sessions.forEach((session) => {
      if (!session.scheduledAt) return;
      const key = new Date(session.scheduledAt).toDateString();
      map.set(key, [...(map.get(key) ?? []), session]);
    });
    return map;
  }, [sessions]);

  if (isLoading) return <SessionsSkeleton />;
  if (isError) {
    return (
      <QueryError
        message={error instanceof Error ? error.message : "Unable to load sessions."}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Session Management</h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Schedule live classes, track attendance, and launch virtual classrooms from a calm schedule view.
            </p>
          </div>
          <Button>
            <Plus size={16} />
            Create new session
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Upcoming sessions</p>
          <p className="mt-2 text-3xl font-semibold text-white">{upcoming.length}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Total sessions</p>
          <p className="mt-2 text-3xl font-semibold text-white">{sessions.length}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Attendance rate</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {sessions.length
              ? Math.round(
                  (sessions.filter((session) => (session.participants?.length ?? 0) > 0).length / sessions.length) *
                    100,
                )
              : 0}
            %
          </p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Focus mode</p>
          <p className="mt-2 text-3xl font-semibold text-white">On</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        {(["all", "upcoming", "past"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm capitalize transition",
              filter === value
                ? "border-primary bg-primary text-[var(--bg-base)]"
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-primary/40 hover:text-white",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="mt-3 text-2xl font-semibold text-white">{monthLabel(cursor)}</h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCursor((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCursor((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const sessionsForDay = day ? (sessionsByDay.get(day.toDateString()) ?? []) : [];
              const isToday = day ? day.toDateString() === new Date().toDateString() : false;
              return (
                <div
                  key={day ? day.toDateString() : `blank-${index}`}
                  className={cn(
                    "min-h-[5.25rem] rounded-2xl border p-2",
                    day ? "border-[var(--border)] bg-white/5" : "border-transparent bg-transparent",
                    isToday && "border-primary bg-primary/10",
                  )}
                >
                  {day ? (
                    <>
                      <p className="text-sm font-semibold text-white">{day.getDate()}</p>
                      <div className="mt-2 space-y-1">
                        {sessionsForDay.slice(0, 2).map((session, index) => (
                          <div
                            key={session._id ?? `${session.title}-${index}`}
                            className="rounded-lg bg-secondary/15 px-2 py-1 text-[10px] text-secondary"
                          >
                            {session.title}
                          </div>
                        ))}
                        {sessionsForDay.length > 2 ? (
                          <p className="text-[10px] text-[var(--text-muted)]">+{sessionsForDay.length - 2} more</p>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="mt-3 text-2xl font-semibold text-white">Live session queue</h2>
            </div>
            <Link to="/app/workspace" className="text-sm text-primary hover:underline">
              Open workspace
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {filtered.slice(0, 5).length ? (
              filtered.slice(0, 5).map((session, index) => {
                const participantCount = Array.isArray(session.participants) ? session.participants.length : 0;
                return (
                  <div
                    key={session._id ?? `${session.title}-${index}`}
                    className="rounded-[22px] border border-[var(--border)] bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{session.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "TBD"}
                        </p>
                      </div>
                      <Badge variant={session.status === "completed" ? "success" : "purple"}>
                        {session.status ?? "scheduled"}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                        <span>
                          {participantCount}
                          {session.maxParticipants
                            ? ` / ${session.maxParticipants} seats filled`
                            : " learners enrolled"}
                        </span>
                        {session._id ? (
                          <Link
                            to={`/app/classroom/${session._id}`}
                            className="inline-flex items-center gap-1 text-primary"
                          >
                            Launch <Video size={14} />
                          </Link>
                        ) : null}
                      </div>
                      {session.maxParticipants && session.maxParticipants > 0 ? (
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              participantCount >= session.maxParticipants
                                ? "bg-red-500"
                                : participantCount / session.maxParticipants > 0.8
                                  ? "bg-amber-500"
                                  : "bg-primary",
                            )}
                            style={{ width: `${Math.min(100, (participantCount / session.maxParticipants) * 100)}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title="No sessions found" description="Try another filter or create a new session." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

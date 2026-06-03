import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Clock, Users, Video, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSessions, type SessionSummary } from "@/services/sessionsService";
import { cn } from "@/lib/utils";

type SessionFilter = "all" | "upcoming" | "live" | "completed";

const filterLabels: Record<SessionFilter, string> = {
  all: "All sessions",
  upcoming: "Upcoming",
  live: "Live now",
  completed: "Completed",
};

function SessionSearchSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-[24px]" />
      <Skeleton className="h-12 rounded-full" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-[28px]" />
        ))}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: SessionSummary }) {
  const isLive = session.status === "live";
  const isCompleted = session.status === "completed";

  return (
    <Card className="flex h-full flex-col gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            isLive ? "bg-danger/15 text-danger" : isCompleted ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
          )}>
            {isLive ? <Video size={16} /> : isCompleted ? <BookOpen size={16} /> : <Clock size={16} />}
          </div>
          <Badge variant={isLive ? "warning" : isCompleted ? "success" : "default"}>
            {isLive ? "Live" : isCompleted ? "Recorded" : "Scheduled"}
          </Badge>
        </div>
        {isLive && (
          <span className="flex items-center gap-1 text-xs text-danger">
            <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
            Live
          </span>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white line-clamp-2">{session.title}</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {new Date(session.scheduledAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {session.durationMinutes ?? 60} min
        </span>
        {session.attendeeCount != null && (
          <span className="flex items-center gap-1">
            <Users size={12} />
            {session.attendeeCount} students
          </span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-3">
        {isLive ? (
          <Link to={`/app/classroom/${session._id}`}>
            <Button size="sm">Join session</Button>
          </Link>
        ) : isCompleted ? (
          <Link to={`/app/sessions/${session._id}/feedback`}>
            <Button size="sm" variant="outline">
              View / Feedback
            </Button>
          </Link>
        ) : (
          <Link to={`/app/sessions`}>
            <Button size="sm" variant="outline">
              View details
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

export function SessionExplorerPage() {
  const [filter, setFilter] = useState<SessionFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  const sessions = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    let result = sessions;
    if (filter === "upcoming") result = result.filter((s) => s.status === "scheduled" || s.status === "pending");
    else if (filter === "live") result = result.filter((s) => s.status === "live");
    else if (filter === "completed") result = result.filter((s) => s.status === "completed");

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s as Record<string, unknown>)["description"]?.toString().toLowerCase().includes(q)
      );
    }
    return result;
  }, [sessions, filter, search]);

  const counts = useMemo(() => ({
    all: sessions.length,
    upcoming: sessions.filter((s) => s.status === "scheduled" || s.status === "pending").length,
    live: sessions.filter((s) => s.status === "live").length,
    completed: sessions.filter((s) => s.status === "completed").length,
  }), [sessions]);

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <SessionSearchSkeleton />;

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Session Explorer</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Find and join live learning sessions.
            </h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Browse upcoming, live, and recorded sessions from your mentors and cohorts.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/app/sessions">
              <Button variant="outline" size="sm">
                Full schedule
              </Button>
            </Link>
            <Link to="/app/recordings">
              <Button variant="outline" size="sm">
                Recordings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Total</p>
          <p className="mt-2 text-3xl font-semibold text-white">{counts.all}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Upcoming</p>
          <p className="mt-2 text-3xl font-semibold text-white">{counts.upcoming}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Live now</p>
          <p className="mt-2 text-3xl font-semibold text-white">{counts.live}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-white">{counts.completed}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        {(["all", "upcoming", "live", "completed"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={cn(
              "rounded-full border px-5 py-2 text-sm transition",
              filter === value
                ? "border-primary bg-primary text-[var(--bg-base)]"
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
            )}
          >
            {filterLabels[value]} ({counts[value]})
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((session) => (
            <SessionCard key={session._id} session={session} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${filterLabels[filter].toLowerCase()} found`}
          description="Try a different filter or search term."
          actionLabel="Back to all sessions"
          onAction={() => { setFilter("all"); setSearch(""); }}
        />
      )}
    </div>
  );
}

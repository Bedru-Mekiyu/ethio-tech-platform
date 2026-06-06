import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Play, Search, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { fetchSessions, type SessionSummary } from "@/services/sessionsService";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

type Tab = "schedule" | "recordings";

interface Recording {
  _id: string;
  session?: { _id?: string; title?: string; scheduledAt?: string };
  title: string;
  description?: string;
  url: string;
  durationMinutes?: number;
  publishedAt?: string;
  thumbnailUrl?: string;
  progress?: { watchedPercent: number; lastWatchedAt?: string; completed: boolean };
}

interface RecordingsData {
  recordings: Recording[];
  totalRecordings: number;
  completedCount: number;
  totalWatchTimeMinutes: number;
}

async function fetchStudentRecordings(): Promise<RecordingsData> {
  const { data } = await api.get("/sessions/recordings/my");
  return data.data ?? { recordings: [], totalRecordings: 0, completedCount: 0, totalWatchTimeMinutes: 0 };
}

function formatDuration(minutes?: number): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatRelativeDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const diff = Date.now() - Date.parse(dateStr);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function SessionsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function ScheduleRow({
  session,
  isWaitlisting,
  onWaitlist,
}: {
  session: SessionSummary & { participants?: unknown[] };
  isWaitlisting: boolean;
  onWaitlist: () => void;
}) {
  const status = session.status ?? "scheduled";
  const isLive = status === "live";
  const isEnded = status === "ended";
  const participantCount = session.participants?.length ?? 0;
  const max = session.maxParticipants ?? 0;
  const isFull = max > 0 && participantCount >= max;
  const capacityPct = max ? Math.min(100, (participantCount / max) * 100) : 0;

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-white">{session.title}</p>
          {isLive ? (
            <Badge variant="warning" className="shrink-0">
              Live
            </Badge>
          ) : null}
          {isFull && !isLive ? (
            <Badge variant="danger" className="shrink-0">
              Full
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-[var(--text-muted)]">{new Date(session.scheduledAt).toLocaleString()}</p>
        {max > 0 ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 max-w-24 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full",
                  isFull ? "bg-red-500" : capacityPct > 80 ? "bg-amber-500" : "bg-primary",
                )}
                style={{ width: `${capacityPct}%` }}
              />
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">
              {participantCount}/{max}
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        {isLive ? (
          <Link to={`/app/classroom/${session._id}`}>
            <Button size="sm">Join</Button>
          </Link>
        ) : isEnded ? (
          <Link to={`/app/sessions/${session._id}/feedback`}>
            <Button size="sm" variant="outline">
              Feedback
            </Button>
          </Link>
        ) : isFull ? (
          <Button size="sm" variant="outline" disabled={isWaitlisting} onClick={onWaitlist}>
            {isWaitlisting ? "…" : "Join waitlist"}
          </Button>
        ) : (
          <Link to={`/app/classroom/${session._id}`}>
            <Button size="sm">Open</Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

function RecordingCard({ recording }: { recording: Recording }) {
  const watchedPercent = recording.progress?.watchedPercent ?? 0;
  const isCompleted = recording.progress?.completed ?? false;

  const handlePlay = async () => {
    if (recording.session?._id) {
      try {
        await api.post(`/sessions/${recording.session._id}/recordings/${recording._id}/progress`, {
          watchedPercent: Math.max(watchedPercent, 1),
        });
      } catch {
        // non-critical
      }
    }
    window.open(recording.url, "_blank");
  };

  return (
    <Card className="overflow-hidden border-[var(--border)] bg-[var(--bg-card)]">
      <div className="relative h-32 bg-gradient-to-br from-primary/20 via-[var(--bg-card)] to-secondary/20">
        {recording.thumbnailUrl ? (
          <img src={recording.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Video size={36} className="text-primary/30" />
          </div>
        )}
        {recording.durationMinutes ? (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs text-white">
            {formatDuration(recording.durationMinutes)}
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 font-semibold text-white">{recording.title}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <CalendarDays size={12} /> {formatRelativeDate(recording.publishedAt)}
          </span>
          {watchedPercent > 0 && !isCompleted ? <span>{watchedPercent}% watched</span> : null}
        </div>
        <Button className="mt-3 w-full" size="sm" variant={isCompleted ? "outline" : "primary"} onClick={handlePlay}>
          <Play size={14} />
          {isCompleted ? "Rewatch" : watchedPercent > 0 ? "Continue" : "Watch"}
        </Button>
      </div>
    </Card>
  );
}

export function SessionHistoryPage() {
  usePageTitle("Sessions");
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("schedule");
  const [search, setSearch] = useState("");
  const [waitlistStates, setWaitlistStates] = useState<
    Record<string, { loading?: boolean; onWaitlist?: boolean; position?: number }>
  >({});

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });
  const recordingsQuery = useQuery({
    queryKey: ["student", "recordings"],
    queryFn: fetchStudentRecordings,
    enabled: !!user && tab === "recordings",
  });

  const sessions = (sessionsQuery.data ?? []) as Array<SessionSummary & { participants?: unknown[] }>;
  const recordings = recordingsQuery.data?.recordings ?? [];

  const filteredSessions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, search]);

  const filteredRecordings = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return recordings;
    return recordings.filter(
      (r) => r.title.toLowerCase().includes(q) || r.session?.title?.toLowerCase().includes(q),
    );
  }, [recordings, search]);

  const handleWaitlist = async (sessionId: string) => {
    setWaitlistStates((prev) => ({ ...prev, [sessionId]: { loading: true } }));
    try {
      const res = await api.post(`/sessions/${sessionId}/waitlist`);
      const position = (res.data?.data as { position?: number })?.position;
      setWaitlistStates((prev) => ({ ...prev, [sessionId]: { onWaitlist: true, position, loading: false } }));
    } catch {
      setWaitlistStates((prev) => ({ ...prev, [sessionId]: { loading: false } }));
    }
  };

  if (sessionsQuery.isError) {
    return <QueryError onRetry={() => sessionsQuery.refetch()} />;
  }

  const tabClass = (active: boolean) =>
    cn(
      "rounded-full px-4 py-2 text-sm font-medium transition",
      active ? "bg-primary text-[var(--bg-base)]" : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white",
    );

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Sessions</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Join live classes, manage waitlists, and rewatch past recordings.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="tablist">
        {(["schedule", "recordings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={tabClass(tab === t)}
          >
            {t === "schedule" ? "Schedule" : "Recordings"}
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          placeholder={tab === "schedule" ? "Search sessions…" : "Search recordings…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {tab === "schedule" && (
        <div className="space-y-3">
          {sessionsQuery.isLoading ? (
            <SessionsSkeleton />
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              title={search ? "No sessions match" : "No sessions yet"}
              description={
                search
                  ? "Try a different search term."
                  : "Live sessions will appear here once your mentor schedules them."
              }
            />
          ) : (
            filteredSessions.map((s) => (
              <ScheduleRow
                key={s._id}
                session={s}
                isWaitlisting={!!waitlistStates[s._id]?.loading}
                onWaitlist={() => handleWaitlist(s._id)}
              />
            ))
          )}
        </div>
      )}

      {tab === "recordings" && (
        <div>
          {recordingsQuery.isLoading ? (
            <SessionsSkeleton />
          ) : filteredRecordings.length === 0 ? (
            <EmptyState
              title="No recordings yet"
              description="Recordings will appear here once your mentor publishes them."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRecordings.map((r) => (
                <RecordingCard key={r._id} recording={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

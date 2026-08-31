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
    <Card className="flex flex-wrap items-center justify-between gap-4 border-[#27272A] bg-[#0E0E11] p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-white text-sm">{session.title}</p>
          {isLive ? (
            <Badge variant="warning" size="sm" className="shrink-0">
              Live
            </Badge>
          ) : null}
          {isFull && !isLive ? (
            <Badge variant="danger" size="sm" className="shrink-0">
              Full
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-zinc-400 mt-0.5">{new Date(session.scheduledAt).toLocaleString()}</p>
        {max > 0 ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 max-w-24 overflow-hidden rounded-full bg-[#141418] border border-[#27272A]">
              <div
                className={cn(
                  "h-full rounded-full",
                  isFull ? "bg-rose-500" : capacityPct > 80 ? "bg-amber-500" : "bg-indigo-500",
                )}
                style={{ width: `${capacityPct}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500">
              {participantCount}/{max}
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        {isLive ? (
          <Link to={`/app/classroom/${session._id}`}>
            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium">Join Live</Button>
          </Link>
        ) : isEnded ? (
          <Link to={`/app/sessions/${session._id}/feedback`}>
            <Button size="sm" variant="outline" className="text-xs">
              Feedback
            </Button>
          </Link>
        ) : isFull ? (
          <Button size="sm" variant="outline" className="text-xs" disabled={isWaitlisting} onClick={onWaitlist}>
            {isWaitlisting ? "…" : "Join waitlist"}
          </Button>
        ) : (
          <Link to={`/app/classroom/${session._id}`}>
            <Button size="sm" variant="outline" className="text-xs">Open</Button>
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
    <Card className="overflow-hidden border-[#27272A] bg-[#0E0E11]">
      <div className="relative h-28 bg-[#141418] border-b border-[#27272A]">
        {recording.thumbnailUrl ? (
          <img src={recording.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Video size={30} className="text-zinc-600" />
          </div>
        )}
        {recording.durationMinutes ? (
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-zinc-300 font-mono">
            {formatDuration(recording.durationMinutes)}
          </div>
        ) : null}
      </div>
      <div className="p-3.5">
        <h3 className="line-clamp-2 font-semibold text-white text-xs">{recording.title}</h3>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <CalendarDays size={11} className="text-zinc-500" /> {formatRelativeDate(recording.publishedAt)}
          </span>
          {watchedPercent > 0 && !isCompleted ? <span>{watchedPercent}% watched</span> : null}
        </div>
        <Button className="mt-3 w-full text-xs" size="sm" variant={isCompleted ? "outline" : "primary"} onClick={handlePlay}>
          <Play size={12} className="mr-1" />
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

  return (
    <div className="page-shell space-y-6 text-[var(--text-primary)]">
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Live Sessions & Archives</h1>
        <p className="mt-0.5 text-xs text-zinc-400">
          Join live cohort classes, manage seat waitlists, and rewatch past archived recordings.
        </p>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-lg border border-[#27272A] bg-[#0E0E11] p-1 w-fit" role="tablist">
          {(["schedule", "recordings"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3.5 py-1 text-xs font-medium transition",
                tab === t
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              {t === "schedule" ? "Schedule" : "Recordings"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder={tab === "schedule" ? "Search sessions…" : "Search recordings…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#141418] border-[#27272A] text-xs h-8 text-white"
          />
        </div>
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

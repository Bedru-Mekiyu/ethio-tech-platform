import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Video,
  Play,
  Clock,
  Search,
  CalendarDays,
  CheckCircle2,
  Filter,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

/* ---------- Types ---------- */
interface Recording {
  _id: string;
  session?: { _id?: string; title?: string; scheduledAt?: string };
  title: string;
  description?: string;
  url: string;
  durationMinutes?: number;
  publishedAt?: string;
  thumbnailUrl?: string;
  progress?: {
    watchedPercent: number;
    lastWatchedAt?: string;
    completed: boolean;
  };
}

interface RecordingsData {
  recordings: Recording[];
  totalRecordings: number;
  completedCount: number;
  totalWatchTimeMinutes: number;
}

/* ---------- Fetch ---------- */
async function fetchStudentRecordings(): Promise<RecordingsData> {
  const { data } = await api.get("/sessions/recordings/my");
  return data.data ?? { recordings: [], totalRecordings: 0, completedCount: 0, totalWatchTimeMinutes: 0 };
}

/* ---------- Helpers ---------- */
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
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------- Sub-components ---------- */
function RecordingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 rounded-[28px]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[24px]" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-[24px]" />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = "primary", note }: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "secondary";
  note?: string;
}) {
  const toneClass =
    tone === "success" ? "bg-success/10 text-success"
    : tone === "warning" ? "bg-warning/10 text-warning"
    : tone === "secondary" ? "bg-secondary/10 text-secondary"
    : "bg-primary/10 text-primary";

  return (
    <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {note && <p className="mt-2 text-xs text-[var(--text-secondary)]">{note}</p>}
    </Card>
  );
}

function RecordingCard({ recording }: { recording: Recording }) {
  const watchedPercent = recording.progress?.watchedPercent ?? 0;
  const isCompleted = recording.progress?.completed ?? false;

  const handlePlay = async () => {
    // Record progress start
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
    <Card className={cn(
      "group relative overflow-hidden rounded-[22px] border-[var(--border)] bg-[var(--bg-card)] transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
      isCompleted && "border-success/20"
    )}>
      {/* Thumbnail / Gradient placeholder */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 via-[var(--bg-card)] to-secondary/20">
        {recording.thumbnailUrl ? (
          <img
            src={recording.thumbnailUrl}
            alt={recording.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Video size={48} className="text-primary/30" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            onClick={handlePlay}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-[var(--bg-base)] shadow-lg transition-transform duration-300 hover:scale-110"
            aria-label={`Play ${recording.title}`}
          >
            <Play size={24} className="ml-1" />
          </button>
        </div>

        {/* Duration chip */}
        {recording.durationMinutes && (
          <div className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur">
            {formatDuration(recording.durationMinutes)}
          </div>
        )}

        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute left-2 top-2">
            <Badge variant="success" className="gap-1">
              <CheckCircle2 size={12} />
              Watched
            </Badge>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {watchedPercent > 0 && !isCompleted && (
        <div className="h-1 w-full bg-[var(--border)]">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(watchedPercent, 100)}%` }}
          />
        </div>
      )}

      {/* Card body */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors">
            {recording.title}
          </h3>
          {recording.description && (
            <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-2">
              {recording.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={12} />
            <span>{formatRelativeDate(recording.publishedAt)}</span>
          </div>
          {recording.session?.title && (
            <span className="max-w-[140px] truncate">{recording.session.title}</span>
          )}
        </div>

        {watchedPercent > 0 && !isCompleted && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">{watchedPercent}% watched</span>
            <span className="text-primary font-medium">Continue watching</span>
          </div>
        )}

        <Button
          className="w-full"
          variant={isCompleted ? "outline" : "primary"}
          size="sm"
          onClick={handlePlay}
        >
          <Play size={14} />
          {isCompleted ? "Rewatch" : watchedPercent > 0 ? "Continue" : "Watch Now"}
        </Button>
      </div>
    </Card>
  );
}

/* ---------- Filter ---------- */
type StatusFilter = "all" | "unwatched" | "in-progress" | "completed";

/* ---------- Main Page ---------- */
export function SessionRecordingsPage() {
  usePageTitle("Session Recordings");
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student", "recordings"],
    queryFn: fetchStudentRecordings,
    enabled: !!user,
  });

  const recordings = data?.recordings ?? [];

  const filtered = useMemo(() => {
    let list = [...recordings];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.session?.title?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((r) => {
        const percent = r.progress?.watchedPercent ?? 0;
        const done = r.progress?.completed ?? false;
        if (statusFilter === "completed") return done;
        if (statusFilter === "in-progress") return percent > 0 && !done;
        return percent === 0 && !done;
      });
    }

    return list;
  }, [recordings, search, statusFilter]);

  if (isLoading) return <RecordingsSkeleton />;
  if (isError) {
    return (
      <QueryError
        message={error instanceof Error ? error.message : "Unable to load recordings."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="overflow-hidden rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Learning library</Badge>
            <h1 className="text-3xl font-bold text-white">Session Recordings</h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Rewatch past sessions at your own pace. Your progress is tracked automatically so you can pick up right where you left off.
            </p>
          </div>
          <Link to="/app/sessions">
            <Button variant="outline">
              <CalendarDays size={16} />
              Back to sessions
            </Button>
          </Link>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Recordings"
          value={data?.totalRecordings ?? recordings.length}
          icon={Video}
          note="Available to watch"
        />
        <StatCard
          label="Completed"
          value={data?.completedCount ?? 0}
          icon={CheckCircle2}
          tone="success"
          note="Fully watched"
        />
        <StatCard
          label="In Progress"
          value={recordings.filter((r) => (r.progress?.watchedPercent ?? 0) > 0 && !r.progress?.completed).length}
          icon={Play}
          tone="warning"
          note="Continue watching"
        />
        <StatCard
          label="Watch Time"
          value={formatDuration(data?.totalWatchTimeMinutes ?? 0)}
          icon={Clock}
          tone="secondary"
          note="Total time invested"
        />
      </div>

      {/* Filters */}
      <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Search recordings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Status:</span>
            </div>
            {(["all", "unwatched", "in-progress", "completed"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs capitalize transition",
                  statusFilter === f
                    ? "bg-primary text-[var(--bg-base)]"
                    : "border border-[var(--border)] text-[var(--text-secondary)] hover:text-white"
                )}
              >
                {f === "in-progress" ? "In Progress" : f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Recordings grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recording) => (
            <RecordingCard key={recording._id} recording={recording} />
          ))}
        </div>
      ) : (
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-8">
          <EmptyState
            title={search || statusFilter !== "all" ? "No recordings match your filters" : "No recordings available"}
            description={
              search || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Recordings from your sessions will appear here once your mentor publishes them."
            }
          />
        </Card>
      )}
    </div>
  );
}

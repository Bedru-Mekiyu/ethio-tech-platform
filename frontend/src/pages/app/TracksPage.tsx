import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  GraduationCap,
  Layers3,
  PlayCircle,
  Rocket,
  Sparkles,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import heroImage from "@/assets/hero.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStudentDashboard } from "@/services/dashboardService";
import { fetchTracks, type TrackSummary } from "@/services/tracksService";
import { cn } from "@/lib/utils";

type TrackFilter = "all" | "in-progress" | "completed" | "not-started";

type TrackView = TrackSummary & {
  progress: number;
  enrolled: boolean;
  completedLessons: number;
  totalLessons: number;
};

const tabs: Array<{ value: TrackFilter; label: string }> = [
  { value: "all", label: "All tracks" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "not-started", label: "Not started" },
];

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: value >= 1_000 ? 1 : 0,
  }).format(value);
}

function TracksSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <Skeleton className="h-6 w-44 rounded-full" />
          <Skeleton className="h-16 w-full max-w-[34rem]" />
          <Skeleton className="h-5 w-full max-w-[42rem]" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 w-28 rounded-full" />
            <Skeleton className="h-11 w-32 rounded-full" />
            <Skeleton className="h-11 w-34 rounded-full" />
            <Skeleton className="h-11 w-32 rounded-full" />
          </div>
        </div>
        <Skeleton className="aspect-[4/3] rounded-[28px]" />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
      </div>
      <div className="mt-10 space-y-5">
        <Skeleton className="h-36 rounded-[28px]" />
        <Skeleton className="h-36 rounded-[28px]" />
        <Skeleton className="h-36 rounded-[28px]" />
      </div>
    </div>
  );
}

function TrackStatCard({
  icon: Icon,
  value,
  label,
  helper,
  tone,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  helper: string;
  tone: "primary" | "purple" | "success" | "warning";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "purple"
        ? "bg-secondary/10 text-secondary"
        : tone === "success"
          ? "bg-success/10 text-success"
          : "bg-warning/10 text-warning";

  return (
    <Card className="border-[var(--border)] bg-[var(--bg-card)]/85 p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-xs text-[var(--text-secondary)]">{helper}</p>
    </Card>
  );
}

function TrackCard({ track }: { track: TrackView }) {
  const text = `${track.category ?? ""} ${track.title}`.toLowerCase();
  const Icon = text.includes("ai") || text.includes("data")
    ? Sparkles
    : text.includes("cyber") || text.includes("security")
      ? ShieldCheck
      : text.includes("full") || text.includes("stack") || text.includes("web")
        ? Cpu
        : track.enrolled
          ? GraduationCap
          : Rocket;

  const done = track.progress >= 100;
  const statusLabel = done ? "Completed" : track.enrolled ? "In progress" : "Not started";
  const actionLabel = done ? "Review track" : track.enrolled ? "Resume track" : "Explore track";

  return (
    <Card className="group grid gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-[var(--bg-card-hover)] lg:grid-cols-[160px_1fr_180px]">
      <div className="relative overflow-hidden rounded-[22px] border border-white/5 bg-[linear-gradient(180deg,rgba(0,210,255,0.16),rgba(123,97,255,0.12))] p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_45%)]" />
        <div className="relative flex h-full min-h-[140px] flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/20 text-primary">
              <Icon size={20} />
            </div>
            <Badge variant={done ? "success" : track.enrolled ? "default" : "purple"}>{statusLabel}</Badge>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Curriculum depth</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {track.totalLessons ? `${track.completedLessons}/${track.totalLessons}` : `${track.progress}%`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{track.category ?? "Program"}</Badge>
          <Badge variant="purple">{formatCompactNumber(track.modules?.length ?? 0)} modules</Badge>
          <Badge variant="success">{track.xpReward ?? 0} XP</Badge>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">{track.title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {track.description || "A structured path designed to move learners from fundamentals to delivery."}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
            <span>Progress</span>
            <span>{track.progress}%</span>
          </div>
          <ProgressBar value={track.progress} max={100} color={done ? "success" : "primary"} />
          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
            <span className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-1.5">
              {track.modules?.length ?? 0} modules
            </span>
            <span className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-1.5">
              {track.totalLessons} lessons
            </span>
            <span className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-1.5">
              {track.enrolled ? "Enrolled" : "Available to start"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 lg:text-right">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Track action</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {done
              ? "Review your completed work and keep momentum."
              : track.enrolled
                ? "Continue from your current lesson and keep moving."
                : "Open the full curriculum to decide if this is your next step."}
          </p>
        </div>

        <Link to={`/app/tracks/${track._id ?? ""}`}>
          <Button className="w-full lg:w-auto" variant={done ? "secondary" : "primary"}>
            {actionLabel}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function TracksPage() {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<TrackFilter>("all");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["tracks", "dashboard", "student"],
    queryFn: async () => {
      const [tracks, dashboard] = await Promise.all([fetchTracks(), fetchStudentDashboard()]);
      return { tracks, dashboard };
    },
  });

  const view = useMemo(() => {
    const tracks = data?.tracks ?? [];
    const progressByTrack = new Map((data?.dashboard?.progressByTrack ?? []).map((item) => [item.trackId, item]));
    const enrolledIds = new Set((data?.dashboard?.user?.enrolledTracks ?? []).map((track) => track._id));

    const enriched: TrackView[] = tracks.map((track) => {
      const progressDetail = progressByTrack.get(track._id);
      const progress = progressDetail?.overallProgressPercent ?? 0;
      return {
        ...track,
        progress,
        enrolled: enrolledIds.has(track._id),
        completedLessons: progressDetail?.lessons.completed ?? 0,
        totalLessons: progressDetail?.lessons.total ?? track.modules?.reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0) ?? 0,
      };
    });

    const filtered = enriched.filter((track) => {
      if (filter === "completed") return track.progress >= 100;
      if (filter === "in-progress") return track.progress > 0 && track.progress < 100;
      if (filter === "not-started") return !track.enrolled;
      return true;
    });

    const totalLessons = enriched.reduce((sum, track) => sum + track.totalLessons, 0);
    const completedTracks = enriched.filter((track) => track.progress >= 100).length;
    const activeTracks = enriched.filter((track) => track.progress > 0 && track.progress < 100).length;
    const averageProgress = enriched.length
      ? Math.round(enriched.reduce((sum, track) => sum + track.progress, 0) / enriched.length)
      : 0;
    const currentFocus = [...enriched].sort((a, b) => b.progress - a.progress)[0];

    return {
      tracks: enriched,
      filtered,
      totalLessons,
      completedTracks,
      activeTracks,
      averageProgress,
      currentFocus,
      streak: data?.dashboard?.streak?.currentStreak ?? 0,
    };
  }, [data, filter]);

  if (isLoading) {
    return <TracksSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message={error instanceof Error ? error.message : "Unable to load tracks right now."}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-shell py-16">
      <motion.section
        className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="max-w-2xl">
          <Badge className="mb-5">Learning tracks</Badge>
          <h1 className="section-title text-4xl md:text-5xl lg:text-6xl">
            Learning Tracks
          </h1>
          <p className="section-copy mt-6 max-w-xl text-base md:text-lg">
            Choose the path that matches your momentum, keep your current progress visible, and move
            through each track with clear next steps.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  filter === tab.value
                    ? "border-primary bg-primary text-[var(--bg-base)]"
                    : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <TrackStatCard
              icon={Layers3}
              value={formatCompactNumber(view.tracks.length)}
              label="Tracks"
              helper="Available in the catalog"
              tone="primary"
            />
            <TrackStatCard
              icon={GraduationCap}
              value={formatCompactNumber(view.activeTracks)}
              label="In progress"
              helper="Currently active learning paths"
              tone="purple"
            />
            <TrackStatCard
              icon={CheckCircle2}
              value={formatCompactNumber(view.completedTracks)}
              label="Completed"
              helper="Finished journeys"
              tone="success"
            />
            <TrackStatCard
              icon={Rocket}
              value={`${view.streak}`}
              label="Streak"
              helper="Current learning momentum"
              tone="warning"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(0,210,255,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(123,97,255,0.15),transparent_34%)] blur-2xl" />
          <Card className="hero-shell relative overflow-hidden p-4">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative overflow-hidden rounded-[22px] border border-white/5 bg-black/20">
                <div className="absolute left-4 top-4 z-10 rounded-full border border-primary/25 bg-[rgba(5,10,20,0.9)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary">
                  Track spotlight
                </div>
                <img
                  src={heroImage}
                  alt="EthioTech learning tracks preview"
                  className="h-full min-h-[280px] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    Current focus
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {view.currentFocus?.title || "Structured learning paths"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {view.currentFocus?.progress ?? 0}% progress and {view.currentFocus?.totalLessons ?? 0} lessons tracked
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <Card className="border-primary/25 bg-[rgba(8,14,24,0.95)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <PlayCircle size={20} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Average progress
                      </p>
                      <p className="font-semibold text-white">{view.averageProgress}%</p>
                    </div>
                  </div>
                </Card>
                <Card className="border-secondary/25 bg-[rgba(8,14,24,0.95)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
                      <Layers3 size={20} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Total lessons
                      </p>
                      <p className="font-semibold text-white">{formatCompactNumber(view.totalLessons)}</p>
                    </div>
                  </div>
                </Card>
                <Card className="border-success/25 bg-[rgba(8,14,24,0.95)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/15 text-success">
                      <Rocket size={20} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Momentum
                      </p>
                      <p className="font-semibold text-white">{view.streak} day streak</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      </motion.section>

      <section className="mt-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Your curriculum</Badge>
            <h2 className="section-title text-3xl md:text-4xl">Track your path, then keep moving.</h2>
            <p className="section-copy mt-4">
              The cards below use real enrollment and progress data so students can immediately see what
              they have started, what they have finished, and what still needs attention.
            </p>
          </div>
          <Link to="/app/notifications">
            <Button variant="outline">View notifications</Button>
          </Link>
        </div>

        {view.filtered.length ? (
          <div className="mt-8 space-y-5">
            {view.filtered.map((track) => (
              <TrackCard key={track._id} track={track} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="No tracks match this filter"
              description="Try a different tab to see your enrolled, completed, or not-started tracks."
              actionLabel="Show all tracks"
              onAction={() => setFilter("all")}
            />
          </div>
        )}
      </section>
    </div>
  );
}

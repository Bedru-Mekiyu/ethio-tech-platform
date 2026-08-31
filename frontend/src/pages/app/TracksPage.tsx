import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers3,
  Rocket,
  Sparkles,
  ShieldCheck,
  Search,
  Video,
  Code2,
  Clock,
  type LucideIcon,
  PlayCircle,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CapstonePreviewModal } from "@/components/composites/CapstonePreviewModal";
import { fetchStudentDashboard } from "@/services/dashboardService";
import { fetchTracks, type TrackSummary, type CapstoneProject } from "@/services/tracksService";
import { cn } from "@/lib/utils";

type TrackStatusFilter = "all" | "in-progress" | "completed" | "not-started";
type CategoryFilter = "all" | "web" | "mobile" | "cloud" | "ai" | "cyber" | "design";

type EnrichedTrackView = TrackSummary & {
  progress: number;
  enrolled: boolean;
  completedLessons: number;
  totalLessons: number;
};

const STATUS_TABS: Array<{ value: TrackStatusFilter; label: string }> = [
  { value: "all", label: "All Pathways" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "not-started", label: "Available to Start" },
];

const CATEGORY_TABS: Array<{ key: CategoryFilter; label: string }> = [
  { key: "all", label: "All Topics" },
  { key: "web", label: "Fullstack Web" },
  { key: "mobile", label: "Mobile Dev" },
  { key: "cloud", label: "Cloud & DevOps" },
  { key: "ai", label: "Data Science & AI" },
  { key: "cyber", label: "Cyber Security" },
  { key: "design", label: "UI/UX Design" },
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
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-6 w-44 rounded-full" />
        <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 rounded-[24px]" />
        <Skeleton className="h-28 rounded-[24px]" />
        <Skeleton className="h-28 rounded-[24px]" />
        <Skeleton className="h-28 rounded-[24px]" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-44 rounded-[28px]" />
        <Skeleton className="h-44 rounded-[28px]" />
        <Skeleton className="h-44 rounded-[28px]" />
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
      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
      : tone === "purple"
        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
        : tone === "success"
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-amber-500/10 text-amber-400 border border-amber-500/20";

  return (
    <Card className="border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-100">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-300">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </Card>
  );
}

function TrackIcon({ categoryKey, title, size = 20 }: { categoryKey?: string; title?: string; size?: number }) {
  const text = `${categoryKey ?? ""} ${title ?? ""}`.toLowerCase();
  if (text.includes("ai") || text.includes("data")) return <Sparkles size={size} />;
  if (text.includes("cyber") || text.includes("security")) return <ShieldCheck size={size} />;
  if (text.includes("cloud") || text.includes("devops")) return <Rocket size={size} />;
  if (text.includes("mobile") || text.includes("react native") || text.includes("flutter"))
    return <Smartphone size={size} />;
  if (text.includes("design") || text.includes("ux") || text.includes("ui")) return <Layers3 size={size} />;
  if (text.includes("full") || text.includes("web") || text.includes("stack")) return <Cpu size={size} />;
  return <Layers3 size={size} />;
}

function StudentTrackCard({
  track,
  onPreviewCapstone,
}: {
  track: EnrichedTrackView;
  onPreviewCapstone: (capstone: CapstoneProject, trackTitle: string, trackId: string) => void;
}) {
  const done = track.progress >= 100;
  const statusLabel = done ? "Completed" : track.enrolled ? "In Progress" : "Available";
  const actionLabel = done ? "Review Track" : track.enrolled ? "Resume Track" : "Start Learning";

  return (
    <Card className="group grid gap-6 border border-slate-800 bg-slate-900/80 p-6 transition duration-200 hover:border-slate-700 hover:bg-slate-900 lg:grid-cols-[180px_1fr_220px]">
      {/* Icon & Category Indicator */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-indigo-400 border border-slate-800">
            <TrackIcon categoryKey={track.categoryKey} title={track.title} size={20} />
          </div>
          <Badge variant={done ? "success" : track.enrolled ? "default" : "default"}>{statusLabel}</Badge>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Curriculum Depth</p>
          <p className="text-lg font-bold text-slate-100">
            {track.totalLessons ? `${track.completedLessons} / ${track.totalLessons} Lessons` : `${track.progress}%`}
          </p>
          <p className="text-xs text-slate-400">+{track.xpReward ?? 0} Total XP</p>
        </div>
      </div>

      {/* Main Track Details */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">{track.category ?? "Engineering"}</Badge>
          <Badge variant="default">{track.difficulty ?? "Intermediate"}</Badge>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={12} className="text-indigo-400" />
            {track.estimatedWeeks ?? 12} Weeks
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Video size={12} className="text-indigo-400" />
            {track.liveSessionsCount ?? 20} Workshops
          </span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg md:text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
            {track.title}
          </h2>
          <p className="text-xs md:text-sm leading-relaxed text-slate-400 max-w-3xl">
            {track.tagline || track.description || "Comprehensive hands-on curriculum built for job readiness."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Path Completion</span>
            <span className="font-semibold text-slate-200">{track.progress}%</span>
          </div>
          <ProgressBar value={track.progress} max={100} color={done ? "success" : "primary"} className="h-2" />
        </div>

        {/* Capstone Quick Preview Buttons */}
        {track.capstones && track.capstones.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Code2 size={13} className="text-indigo-400" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Capstone Projects:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {track.capstones.map((cap) => (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => onPreviewCapstone(cap, track.title, track._id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>{cap.title}</span>
                  <span className="text-[10px] text-indigo-400 underline ml-1">Inspect</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action / Next Step Column */}
      <div className="flex flex-col justify-between gap-4 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status & Mentorship</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {done
              ? "All milestones completed! Review capstones or explore another track."
              : track.enrolled
                ? "Active track. Attend upcoming live workshops & submit code checkpoints."
                : "Available to start anytime. Includes 1:1 mentor code reviews."}
          </p>
          <div className="text-xs font-semibold text-emerald-400 pt-1">
            {track.mentorshipHours ?? 30} Direct Mentor Review Hours
          </div>
        </div>

        <Link to={`/app/tracks/${track._id}`} className="w-full">
          <Button className="w-full font-medium" variant={done ? "secondary" : "primary"}>
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
  const [statusFilter, setStatusFilter] = useState<TrackStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewProject, setPreviewProject] = useState<{
    project: CapstoneProject;
    trackTitle: string;
    trackId: string;
  } | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["tracks", "dashboard", "student"],
    queryFn: async () => {
      const [tracks, dashboard] = await Promise.all([fetchTracks(), fetchStudentDashboard()]);
      return { tracks, dashboard };
    },
  });

  const view = useMemo(() => {
    const rawTracks = data?.tracks ?? [];
    const progressByTrack = new Map((data?.dashboard?.progressByTrack ?? []).map((item) => [item.trackId, item]));
    const enrolledIds = new Set((data?.dashboard?.user?.enrolledTracks ?? []).map((track) => track._id));

    const enriched: EnrichedTrackView[] = rawTracks.map((track) => {
      const progressDetail = progressByTrack.get(track._id);
      const progress = progressDetail?.overallProgressPercent ?? 0;
      const isEnrolled = enrolledIds.has(track._id) || progress > 0;

      return {
        ...track,
        progress,
        enrolled: isEnrolled,
        completedLessons: progressDetail?.lessons.completed ?? 0,
        totalLessons:
          progressDetail?.lessons.total ??
          track.modules?.reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0) ??
          12,
      };
    });

    const filtered = enriched.filter((track) => {
      // Status filter
      if (statusFilter === "completed" && track.progress < 100) return false;
      if (statusFilter === "in-progress" && (track.progress <= 0 || track.progress >= 100)) return false;
      if (statusFilter === "not-started" && (track.enrolled || track.progress > 0)) return false;

      // Category filter
      if (categoryFilter !== "all" && track.categoryKey !== categoryFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = track.title.toLowerCase().includes(q);
        const inDesc = (track.description ?? "").toLowerCase().includes(q);
        const inTools = (track.tooling ?? []).some((t) => t.name.toLowerCase().includes(q));
        const inCaps = (track.capstones ?? []).some((c) => c.title.toLowerCase().includes(q));
        return inTitle || inDesc || inTools || inCaps;
      }

      return true;
    });

    const totalLessons = enriched.reduce((sum, track) => sum + track.totalLessons, 0);
    const completedTracks = enriched.filter((track) => track.progress >= 100).length;
    const activeTracks = enriched.filter((track) => track.progress > 0 && track.progress < 100).length;
    const averageProgress = enriched.length
      ? Math.round(enriched.reduce((sum, track) => sum + track.progress, 0) / enriched.length)
      : 0;

    return {
      tracks: enriched,
      filtered,
      totalLessons,
      completedTracks,
      activeTracks,
      averageProgress,
      streak: data?.dashboard?.streak?.currentStreak ?? 0,
    };
  }, [data, statusFilter, categoryFilter, searchQuery]);

  if (isLoading) {
    return <TracksSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message={error instanceof Error ? error.message : "Unable to load your tracks catalog right now."}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-shell py-8 space-y-8">
      {/* Capstone Preview Modal */}
      <CapstonePreviewModal
        project={previewProject?.project ?? null}
        trackTitle={previewProject?.trackTitle}
        trackId={previewProject?.trackId}
        isOpen={Boolean(previewProject)}
        onClose={() => setPreviewProject(null)}
        isAppView={true}
      />

      {/* Header & Overview Stats */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
              <Sparkles size={13} />
              Career-Aligned Engineering Curriculum
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Learning Pathways</h1>
            <p className="text-sm md:text-base text-[var(--text-secondary)] mt-1 max-w-2xl">
              Choose your engineering pathway, track your milestones, and build production-grade capstone projects with
              direct mentor reviews.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/app/workspace">
              <Button variant="outline" className="gap-2">
                <Code2 size={16} />
                Open Workspace
              </Button>
            </Link>
            <Link to="/app/projects">
              <Button variant="secondary" className="gap-2">
                <Rocket size={16} />
                My Projects
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TrackStatCard
            icon={Layers3}
            value={formatCompactNumber(view.tracks.length)}
            label="Catalog Tracks"
            helper="Fullstack, Mobile, Cloud, AI, Security, UI/UX"
            tone="primary"
          />
          <TrackStatCard
            icon={PlayCircle}
            value={formatCompactNumber(view.activeTracks)}
            label="In Progress"
            helper="Active learning pathways"
            tone="purple"
          />
          <TrackStatCard
            icon={CheckCircle2}
            value={formatCompactNumber(view.completedTracks)}
            label="Completed Tracks"
            helper="Verified certifications earned"
            tone="success"
          />
          <TrackStatCard
            icon={Rocket}
            value={`${view.streak} Days`}
            label="Learning Streak"
            helper="Active momentum"
            tone="warning"
          />
        </div>
      </motion.section>

      {/* Filter and Search Controls */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "rounded-xl px-4 py-2 text-xs md:text-sm font-medium transition-colors",
                  statusFilter === tab.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:max-w-xs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search tracks or tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-slate-950/50 border-slate-800 text-xs rounded-xl focus:border-indigo-500 text-slate-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs transition-colors",
                categoryFilter === cat.key
                  ? "bg-slate-800 text-slate-100 font-semibold border border-slate-700"
                  : "bg-slate-950/40 text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-slate-800/60",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Tracks Grid */}
      <section className="space-y-4">
        {view.filtered.length > 0 ? (
          <div className="space-y-5">
            {view.filtered.map((track) => (
              <StudentTrackCard
                key={track._id}
                track={track}
                onPreviewCapstone={(project, trackTitle, trackId) =>
                  setPreviewProject({ project, trackTitle, trackId })
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No tracks matched your criteria"
            description="Try switching the filter tabs or clearing the search query to explore all available pathways."
            actionLabel="View All Tracks"
            onAction={() => {
              setStatusFilter("all");
              setCategoryFilter("all");
              setSearchQuery("");
            }}
          />
        )}
      </section>
    </div>
  );
}

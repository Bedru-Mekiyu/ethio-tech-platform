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
    <Card className="border border-[#27272A] bg-[#0E0E11] p-4">
      <div className="flex items-center justify-between">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon size={15} />
        </div>
      </div>
      <p className="mt-3 text-xl font-bold tracking-tight text-white font-mono">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">{helper}</p>
    </Card>
  );
}

function TrackIcon({ categoryKey, title, size = 18 }: { categoryKey?: string; title?: string; size?: number }) {
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
    <Card className="group grid gap-5 border border-[#27272A] bg-[#0E0E11] p-5 transition duration-200 hover:border-zinc-700 lg:grid-cols-[160px_1fr_200px]">
      {/* Icon & Category Indicator */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#27272A] bg-[#141418] p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E0E11] text-indigo-400 border border-[#27272A]">
            <TrackIcon categoryKey={track.categoryKey} title={track.title} size={18} />
          </div>
          <Badge variant={done ? "success" : track.enrolled ? "default" : "default"}>{statusLabel}</Badge>
        </div>

        <div className="mt-3 space-y-0.5">
          <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">Curriculum Depth</p>
          <p className="text-sm font-bold text-white">
            {track.totalLessons ? `${track.completedLessons} / ${track.totalLessons} Lessons` : `${track.progress}%`}
          </p>
          <p className="text-[11px] text-zinc-400">+{track.xpReward ?? 0} Total XP</p>
        </div>
      </div>

      {/* Main Track Details */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="default">{track.category ?? "Engineering"}</Badge>
          <Badge variant="default">{track.difficulty ?? "Intermediate"}</Badge>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Clock size={11} className="text-indigo-400" />
            {track.estimatedWeeks ?? 12} Weeks
          </span>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Video size={11} className="text-indigo-400" />
            {track.liveSessionsCount ?? 20} Workshops
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
            {track.title}
          </h2>
          <p className="text-xs leading-relaxed text-zinc-400 max-w-3xl">
            {track.tagline || track.description || "Comprehensive hands-on curriculum built for job readiness."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Path Completion</span>
            <span className="font-semibold text-white">{track.progress}%</span>
          </div>
          <ProgressBar value={track.progress} max={100} color={done ? "success" : "primary"} className="h-1.5" />
        </div>

        {/* Capstone Quick Preview Buttons */}
        {track.capstones && track.capstones.length > 0 && (
          <div className="pt-0.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
              <Code2 size={12} className="text-indigo-400" />
              <span className="font-semibold uppercase tracking-wider text-[9px] text-zinc-500">Capstone Projects:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {track.capstones.map((cap) => (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => onPreviewCapstone(cap, track.title, track._id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#27272A] bg-[#141418] px-2.5 py-1 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
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
      <div className="flex flex-col justify-between gap-3 border-t lg:border-t-0 lg:border-l border-[#27272A] pt-3 lg:pt-0 lg:pl-5">
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Status & Mentorship</p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {done
              ? "All milestones completed! Review capstones or explore another track."
              : track.enrolled
                ? "Active track. Attend upcoming live workshops & submit code checkpoints."
                : "Available to start anytime. Includes 1:1 mentor code reviews."}
          </p>
          <div className="text-xs font-semibold text-emerald-400 pt-0.5">
            {track.mentorshipHours ?? 30} Direct Mentor Review Hours
          </div>
        </div>

        <Link to={`/app/tracks/${track._id}`} className="w-full">
          <Button size="sm" className="w-full font-medium" variant={done ? "secondary" : "primary"}>
            {actionLabel}
            <ArrowRight size={14} className="ml-1.5" />
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
        className="space-y-5"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 mb-1.5">
              <Sparkles size={12} />
              Career-Aligned Engineering Curriculum
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Learning Pathways</h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Choose your engineering pathway, track your milestones, and build production-grade capstone projects with
              direct mentor reviews.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/app/workspace">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Code2 size={14} />
                Open Workspace
              </Button>
            </Link>
            <Link to="/app/projects">
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                <Rocket size={14} />
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
      <section className="space-y-3 pt-1">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === tab.value
                    ? "bg-indigo-600 text-white font-semibold"
                    : "border border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search tracks or tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-9 bg-[#0E0E11] border-[#27272A] text-xs rounded-lg focus:border-indigo-500 text-zinc-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#27272A]">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs transition-colors",
                categoryFilter === cat.key
                  ? "bg-[#141418] text-white font-semibold border border-zinc-600"
                  : "bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white border border-[#27272A]",
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

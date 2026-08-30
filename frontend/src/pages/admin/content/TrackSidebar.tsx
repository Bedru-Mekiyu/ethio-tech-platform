import {
  Search,
  Plus,
  BookOpen,
  Award,
  Clock,
  Layers,
  X,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Track } from "./types";
import { CATEGORY_FILTERS } from "./types";

interface TrackSidebarProps {
  tracks: Track[];
  selectedTrackId: string | null;
  onSelectTrack: (id: string) => void;
  onCreateTrack: () => void;
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  statusFilter: "all" | "active" | "draft";
  onStatusFilterChange: (status: "all" | "active" | "draft") => void;
}

export function TrackSidebar({
  tracks,
  selectedTrackId,
  onSelectTrack,
  onCreateTrack,
  isLoading,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
}: TrackSidebarProps) {
  const filteredTracks = tracks.filter((track) => {
    // Search match
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      track.title.toLowerCase().includes(searchLower) ||
      track.description?.toLowerCase().includes(searchLower) ||
      track.category?.toLowerCase().includes(searchLower);

    // Category match
    const matchesCategory =
      categoryFilter === "all" ||
      (track.category &&
        (track.category.toLowerCase() === categoryFilter.toLowerCase() ||
          (categoryFilter === "web" && track.category.toLowerCase().includes("web")) ||
          (categoryFilter === "mobile" && track.category.toLowerCase().includes("mob")) ||
          (categoryFilter === "cloud" && track.category.toLowerCase().includes("cloud")) ||
          (categoryFilter === "ai" && (track.category.toLowerCase().includes("ai") || track.category.toLowerCase().includes("data"))) ||
          (categoryFilter === "security" && (track.category.toLowerCase().includes("sec") || track.category.toLowerCase().includes("cyber"))) ||
          (categoryFilter === "design" && (track.category.toLowerCase().includes("design") || track.category.toLowerCase().includes("ui")))));

    // Status match
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && track.isActive !== false) ||
      (statusFilter === "draft" && track.isActive === false);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="flex h-full flex-col border-r border-[var(--border)] bg-[var(--bg-card)]">
      {/* Sidebar Header */}
      <div className="border-b border-[var(--border)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Curriculum Tracks</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                {tracks.length} {tracks.length === 1 ? "track" : "tracks"} total
              </p>
            </div>
          </div>
          <Button size="sm" onClick={onCreateTrack} className="h-8 gap-1 px-2.5 text-xs font-semibold shadow-sm">
            <Plus size={14} /> New Track
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tracks..."
            className="h-9 pl-8 pr-8 text-xs bg-white/[0.03]"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
          {CATEGORY_FILTERS.map((filter) => {
            const isSelected = categoryFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onCategoryFilterChange(filter.value)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all",
                  isSelected
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white/[0.04] text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Status Filters Pill */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
          <span className="flex items-center gap-1">
            <Filter size={11} /> Status:
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-black/40 p-0.5 border border-white/5">
            <button
              type="button"
              onClick={() => onStatusFilterChange("all")}
              className={cn(
                "rounded px-2 py-0.5 transition-colors",
                statusFilter === "all" ? "bg-white/10 text-white font-medium" : "text-[var(--text-muted)] hover:text-white"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("active")}
              className={cn(
                "rounded px-2 py-0.5 transition-colors",
                statusFilter === "active" ? "bg-emerald-500/20 text-emerald-300 font-medium" : "text-[var(--text-muted)] hover:text-white"
              )}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("draft")}
              className={cn(
                "rounded px-2 py-0.5 transition-colors",
                statusFilter === "draft" ? "bg-amber-500/20 text-amber-300 font-medium" : "text-[var(--text-muted)] hover:text-white"
              )}
            >
              Draft
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        )}

        {!isLoading && filteredTracks.length === 0 && (
          <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-4 text-center">
            <BookOpen size={24} className="text-[var(--text-muted)] mb-2" />
            <p className="text-xs font-medium text-white">No tracks match filters</p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Try adjusting your search terms or category selection.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateTrack}
              className="mt-3 text-xs h-7 gap-1"
            >
              <Plus size={12} /> Create Track
            </Button>
          </div>
        )}

        {!isLoading &&
          filteredTracks.map((track) => {
            const isSelected = selectedTrackId === track._id;
            const moduleCount = track.modules?.length ?? 0;
            const lessonCount =
              track.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0;
            const isActive = track.isActive !== false;

            return (
              <button
                key={track._id}
                type="button"
                onClick={() => onSelectTrack(track._id)}
                className={cn(
                  "group relative flex w-full flex-col rounded-xl border p-3 text-left transition-all",
                  isSelected
                    ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-primary/40"
                    : "border-[var(--border)] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge
                        variant={isActive ? "success" : "warning"}
                        size="sm"
                        showDot
                      >
                        {isActive ? "Active" : "Draft"}
                      </Badge>
                      {track.category && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] truncate max-w-[120px]">
                          {track.category}
                        </span>
                      )}
                    </div>
                    <h3
                      className={cn(
                        "text-xs font-semibold leading-tight line-clamp-1 transition-colors",
                        isSelected ? "text-white" : "text-slate-200 group-hover:text-white"
                      )}
                    >
                      {track.title}
                    </h3>
                  </div>
                </div>

                {track.description && (
                  <p className="mt-1 text-[11px] text-[var(--text-muted)] line-clamp-1">
                    {track.description}
                  </p>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Layers size={11} className="text-secondary" />
                    {moduleCount} {moduleCount === 1 ? "module" : "mods"}
                  </span>
                  <span>·</span>
                  <span>{lessonCount} lessons</span>
                  {track.xpReward ? (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Award size={10} /> {track.xpReward} XP
                      </span>
                    </>
                  ) : null}
                  {track.estimatedWeeks ? (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} /> {track.estimatedWeeks}w
                      </span>
                    </>
                  ) : null}
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

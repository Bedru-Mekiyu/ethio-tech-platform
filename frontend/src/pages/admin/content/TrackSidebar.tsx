import { Search, Plus, BookOpen, Award, Clock, Layers, X, Filter } from "lucide-react";
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
          (categoryFilter === "ai" &&
            (track.category.toLowerCase().includes("ai") || track.category.toLowerCase().includes("data"))) ||
          (categoryFilter === "security" &&
            (track.category.toLowerCase().includes("sec") || track.category.toLowerCase().includes("cyber"))) ||
          (categoryFilter === "design" &&
            (track.category.toLowerCase().includes("design") || track.category.toLowerCase().includes("ui")))));

    // Status match
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && track.isActive !== false) ||
      (statusFilter === "draft" && track.isActive === false);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="flex h-full flex-col border-r border-slate-200/80 bg-white">
      {/* Sidebar Header */}
      <div className="border-b border-slate-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Curriculum Tracks</h2>
              <p className="text-[11px] text-slate-500">
                {tracks.length} {tracks.length === 1 ? "track" : "tracks"} total
              </p>
            </div>
          </div>
          <Button size="sm" onClick={onCreateTrack} className="h-8 gap-1 px-2.5 text-xs font-semibold shadow-xs">
            <Plus size={14} /> New Track
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tracks..."
            className="h-9 pl-8 pr-8 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Status Filters Pill */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="flex items-center gap-1 font-medium">
            <Filter size={11} className="text-slate-400" /> Status:
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => onStatusFilterChange("all")}
              className={cn(
                "rounded px-2 py-0.5 transition-colors",
                statusFilter === "all"
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("active")}
              className={cn(
                "rounded px-2 py-0.5 transition-colors",
                statusFilter === "active"
                  ? "bg-zinc-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("draft")}
              className={cn(
                "rounded px-2 py-0.5 transition-colors",
                statusFilter === "draft"
                  ? "bg-amber-50 text-amber-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900",
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
          <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-4 text-center bg-slate-50/50">
            <BookOpen size={24} className="text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-900">No tracks match filters</p>
            <p className="mt-1 text-[11px] text-slate-500">Try adjusting your search terms or category selection.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateTrack}
              className="mt-3 text-xs h-7 gap-1 border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              <Plus size={12} /> Create Track
            </Button>
          </div>
        )}

        {!isLoading &&
          filteredTracks.map((track) => {
            const isSelected = selectedTrackId === track._id;
            const moduleCount = track.modules?.length ?? 0;
            const lessonCount = track.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0;
            const isActive = track.isActive !== false;

            return (
              <button
                key={track._id}
                type="button"
                onClick={() => onSelectTrack(track._id)}
                className={cn(
                  "group relative flex w-full flex-col rounded-xl border p-3 text-left transition-all",
                  isSelected
                    ? "border-zinc-900 bg-zinc-100 shadow-xs ring-1 ring-zinc-900/20"
                    : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge variant={isActive ? "outline" : "warning"} size="sm" showDot>
                        {isActive ? "Active" : "Draft"}
                      </Badge>
                      {track.category && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate max-w-[120px]">
                          {track.category}
                        </span>
                      )}
                    </div>
                    <h3
                      className={cn(
                        "text-xs font-semibold leading-tight line-clamp-1 transition-colors",
                        isSelected ? "text-zinc-950 font-bold" : "text-slate-800 group-hover:text-slate-900",
                      )}
                    >
                      {track.title}
                    </h3>
                  </div>
                </div>

                {track.description && (
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">{track.description}</p>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <Layers size={11} className="text-zinc-600" />
                    {moduleCount} {moduleCount === 1 ? "module" : "mods"}
                  </span>
                  <span>·</span>
                  <span>{lessonCount} lessons</span>
                  {track.xpReward ? (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
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

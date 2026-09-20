import { useState } from "react";
import type { MouseEvent } from "react";
import {
  FolderOpen,
  Folder,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  PlayCircle,
  Code2,
  HelpCircle,
  Award,
  BookOpen,
  Trash2,
  Clock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Track, Module, Lesson, ContentSelection, LessonType } from "./types";

interface ModuleLessonTreeProps {
  track: Track | null;
  modules: Module[];
  lessonsByModule: Record<string, Lesson[]>;
  selection: ContentSelection;
  onSelect: (selection: ContentSelection) => void;
  onAddModule: () => void;
  onAddLesson: (moduleId: string) => void;
  onDeleteModule: (module: Module) => void;
  onDeleteLesson: (lesson: Lesson) => void;
  onReorderModule: (moduleId: string, direction: "up" | "down") => void;
  onReorderLesson: (moduleId: string, lessonId: string, direction: "up" | "down") => void;
  isLoading: boolean;
}

export function ModuleLessonTree({
  track,
  modules,
  lessonsByModule,
  selection,
  onSelect,
  onAddModule,
  onAddLesson,
  onDeleteModule,
  onDeleteLesson,
  onReorderModule,
  onReorderLesson,
  isLoading,
}: ModuleLessonTreeProps) {
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  const toggleCollapse = (moduleId: string, e: MouseEvent) => {
    e.stopPropagation();
    setCollapsedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  if (!track) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-500 border-r border-slate-200/80 bg-slate-50/50">
        <Layers size={32} className="mb-2 text-zinc-400" />
        <p className="text-sm font-semibold text-slate-900">No Track Selected</p>
        <p className="mt-1 text-xs text-slate-500">
          Select a track from the sidebar to inspect and organize its curriculum hierarchy.
        </p>
      </div>
    );
  }

  const isTrackSelected = selection.type === "track" && selection.trackId === track._id;

  const sortedModules = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const getLessonIcon = (type?: LessonType) => {
    switch (type) {
      case "video":
        return <PlayCircle size={14} className="text-zinc-900" />;
      case "code-lab":
        return <Code2 size={14} className="text-zinc-900" />;
      case "quiz":
        return <HelpCircle size={14} className="text-amber-600" />;
      case "project":
        return <Award size={14} className="text-[#b91c1c]" />;
      default:
        return <FileText size={14} className="text-zinc-900" />;
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-slate-200/80 bg-white">
      {/* Track Overview Header in Middle Pane */}
      <div className="border-b border-slate-100 p-4 space-y-3 bg-slate-50/40">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelect({ type: "track", trackId: track._id })}
            className={cn(
              "flex flex-1 items-start gap-2.5 text-left rounded-xl p-2 transition-all",
              isTrackSelected
                ? "bg-zinc-100 border border-zinc-300 text-zinc-950 shadow-xs font-semibold"
                : "hover:bg-slate-100 border border-transparent text-slate-800",
            )}
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <BookOpen size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Track Root</span>
                {isTrackSelected && <span className="h-1.5 w-1.5 rounded-full bg-[#b91c1c] animate-pulse" />}
              </div>
              <h2 className="text-xs font-bold text-slate-900 truncate">{track.title}</h2>
              <p className="text-[11px] text-slate-500">Click to edit track metadata</p>
            </div>
          </button>

          <Button size="sm" onClick={onAddModule} className="h-8 gap-1 px-2.5 text-xs font-semibold shrink-0 shadow-xs">
            <Plus size={14} /> Add Module
          </Button>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-1.5 border border-slate-200 text-[11px] text-slate-600">
          <span className="flex items-center gap-1">
            <Layers size={12} className="text-zinc-600" /> {modules.length} Modules
          </span>
          <span>·</span>
          <span>{Object.values(lessonsByModule).reduce((sum, list) => sum + list.length, 0)} Total Lessons</span>
          <span>·</span>
          <span className="text-amber-600 font-semibold">+{track.xpReward ?? 500} XP</span>
        </div>
      </div>

      {/* Hierarchy Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        )}

        {!isLoading && sortedModules.length === 0 && (
          <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-4 text-center bg-slate-50/50">
            <FolderOpen size={28} className="text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-900">No Modules Yet</p>
            <p className="mt-1 text-[11px] text-slate-500 max-w-xs">
              Every track is organized into sequential modules containing hands-on lessons and code labs.
            </p>
            <Button size="sm" onClick={onAddModule} className="mt-3 text-xs h-8 gap-1.5">
              <Plus size={13} /> Create First Module
            </Button>
          </div>
        )}

        {!isLoading &&
          sortedModules.map((mod, modIdx) => {
            const isCollapsed = Boolean(collapsedModules[mod._id]);
            const isModSelected =
              selection.type === "module" && selection.trackId === track._id && selection.moduleId === mod._id;

            const lessons = lessonsByModule[mod._id] ?? [];
            const sortedLessons = [...lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            return (
              <div
                key={mod._id}
                className={cn(
                  "rounded-2xl border transition-all overflow-hidden",
                  isModSelected
                    ? "border-zinc-400 bg-zinc-50 shadow-xs"
                    : "border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs",
                )}
              >
                {/* Module Header Card */}
                <div
                  onClick={() => onSelect({ type: "module", trackId: track._id, moduleId: mod._id })}
                  className="group flex cursor-pointer items-center justify-between gap-2 p-3 bg-slate-50/80 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => toggleCollapse(mod._id, e)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                      aria-label="Toggle module"
                    >
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 shrink-0">
                      {isCollapsed ? <Folder size={14} /> : <FolderOpen size={14} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500">M{mod.order ?? modIdx + 1}</span>
                        <h3 className="text-xs font-semibold text-slate-900 truncate">{mod.title}</h3>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
                      </p>
                    </div>
                  </div>

                  {/* Reordering & actions */}
                  <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={modIdx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderModule(mod._id, "up");
                      }}
                      className="h-6 w-6 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                      title="Move module up"
                    >
                      <ChevronUp size={13} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={modIdx === sortedModules.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderModule(mod._id, "down");
                      }}
                      className="h-6 w-6 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                      title="Move module down"
                    >
                      <ChevronDown size={13} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddLesson(mod._id);
                      }}
                      className="h-6 w-6 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                      title="Add lesson to module"
                    >
                      <Plus size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteModule(mod);
                      }}
                      className="h-6 w-6 text-rose-600 hover:bg-rose-50"
                      title="Delete module"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {/* Lessons Nested List */}
                {!isCollapsed && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-2 space-y-1.5">
                    {sortedLessons.length === 0 && (
                      <div className="py-3 text-center">
                        <p className="text-[11px] text-slate-500">No lessons in this module</p>
                        <button
                          type="button"
                          onClick={() => onAddLesson(mod._id)}
                          className="mt-1 text-[11px] font-semibold text-[#b91c1c] hover:underline inline-flex items-center gap-1"
                        >
                          <Plus size={11} /> Add First Lesson
                        </button>
                      </div>
                    )}

                    {sortedLessons.map((lesson, lesIdx) => {
                      const isLessonSelected =
                        selection.type === "lesson" &&
                        selection.trackId === track._id &&
                        selection.moduleId === mod._id &&
                        selection.lessonId === lesson._id;

                      return (
                        <div
                          key={lesson._id}
                          onClick={() =>
                            onSelect({
                              type: "lesson",
                              trackId: track._id,
                              moduleId: mod._id,
                              lessonId: lesson._id,
                            })
                          }
                          className={cn(
                            "group/les flex cursor-pointer items-center justify-between gap-2 rounded-xl p-2 text-left transition-all",
                            isLessonSelected
                              ? "bg-zinc-100 border border-zinc-300 shadow-xs text-zinc-950 font-semibold"
                              : "hover:bg-slate-100 border border-transparent text-slate-700",
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200/70 shadow-2xs shrink-0">
                              {getLessonIcon(lesson.type)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-mono text-slate-400">
                                  #{lesson.order ?? lesIdx + 1}
                                </span>
                                <p
                                  className={cn(
                                    "text-xs truncate font-medium",
                                    isLessonSelected ? "text-zinc-950 font-semibold" : "text-slate-800",
                                  )}
                                >
                                  {lesson.title}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                {lesson.durationMinutes ? (
                                  <span className="flex items-center gap-0.5">
                                    <Clock size={10} /> {lesson.durationMinutes}m
                                  </span>
                                ) : null}
                                {lesson.xpReward ? (
                                  <span className="text-zinc-900 font-medium">+{lesson.xpReward} XP</span>
                                ) : null}
                                {lesson.type && (
                                  <span className="uppercase text-[9px] font-medium text-slate-500">{lesson.type}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Lesson actions & ordering */}
                          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/les:opacity-100">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={lesIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderLesson(mod._id, lesson._id, "up");
                              }}
                              className="h-5 w-5 text-slate-400 hover:text-slate-800 hover:bg-slate-200"
                              title="Move lesson up"
                            >
                              <ChevronUp size={11} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={lesIdx === sortedLessons.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderLesson(mod._id, lesson._id, "down");
                              }}
                              className="h-5 w-5 text-slate-400 hover:text-slate-800 hover:bg-slate-200"
                              title="Move lesson down"
                            >
                              <ChevronDown size={11} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLesson(lesson);
                              }}
                              className="h-5 w-5 text-rose-600 hover:bg-rose-50"
                              title="Delete lesson"
                            >
                              <Trash2 size={11} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => onAddLesson(mod._id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-1.5 text-xs text-slate-500 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                    >
                      <Plus size={12} /> Add Lesson
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Trash2,
  RotateCcw,
  BookOpen,
  FolderOpen,
  FileText,
  Clock,
  Award,
  Hash,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Code2,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MarkdownEditor } from "./MarkdownEditor";
import { VideoEmbedPreview } from "./VideoEmbedPreview";
import { CodeSandboxStarterEditor } from "./CodeSandboxStarterEditor";
import { QuizEditor } from "./QuizEditor";
import { CapstoneProjectEditor } from "./CapstoneProjectEditor";
import type { Track, Module, Lesson, CapstoneProjectItem, ContentSelection, LessonType, QuizQuestion } from "./types";
import { TRACK_CATEGORY_OPTIONS, LESSON_TYPES } from "./types";
import { cn } from "@/lib/utils";

interface ContentEditorPaneProps {
  selection: ContentSelection;
  selectedTrack: Track | null;
  selectedModule: Module | null;
  selectedLesson: Lesson | null;
  capstoneProjects: CapstoneProjectItem[];
  onSaveTrack: (data: Partial<Track>) => void;
  onSaveModule: (data: Partial<Module>) => void;
  onSaveLesson: (data: Partial<Lesson>) => void;
  onDeleteTrack: (track: Track) => void;
  onDeleteModule: (module: Module) => void;
  onDeleteLesson: (lesson: Lesson) => void;
  onSaveCapstoneProject: (proj: Partial<CapstoneProjectItem>) => void;
  onDeleteCapstoneProject: (projId: string) => void;
  isSaving: boolean;
}

export function ContentEditorPane({
  selection,
  selectedTrack,
  selectedModule,
  selectedLesson,
  capstoneProjects,
  onSaveTrack,
  onSaveModule,
  onSaveLesson,
  onDeleteTrack,
  onDeleteModule,
  onDeleteLesson,
  onSaveCapstoneProject,
  onDeleteCapstoneProject,
  isSaving,
}: ContentEditorPaneProps) {
  // Track Form State
  const [trackTitle, setTrackTitle] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [trackCategory, setTrackCategory] = useState("web");
  const [trackXpReward, setTrackXpReward] = useState<number | "">(500);
  const [trackEstimatedWeeks, setTrackEstimatedWeeks] = useState<number | "">(12);
  const [trackIsActive, setTrackIsActive] = useState(true);

  // Module Form State
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleOrder, setModuleOrder] = useState<number | "">(1);

  // Lesson Form State
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSummary, setLessonSummary] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonType, setLessonType] = useState<LessonType>("concept");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonCodeSandboxUrl, setLessonCodeSandboxUrl] = useState("");
  const [lessonStarterCode, setLessonStarterCode] = useState("");
  const [lessonChallengeTask, setLessonChallengeTask] = useState("");
  const [lessonXpReward, setLessonXpReward] = useState<number | "">(50);
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState<number | "">(20);
  const [lessonOrder, setLessonOrder] = useState<number | "">(1);
  const [lessonQuiz, setLessonQuiz] = useState<QuizQuestion[]>([]);

  // Dirty State Tracker
  const [isDirty, setIsDirty] = useState(false);

  // Sync state with selected entities
  const [prevSelection, setPrevSelection] = useState(selection);
  const [prevTrack, setPrevTrack] = useState(selectedTrack);
  const [prevModule, setPrevModule] = useState(selectedModule);
  const [prevLesson, setPrevLesson] = useState(selectedLesson);

  if (
    selection !== prevSelection ||
    selectedTrack !== prevTrack ||
    selectedModule !== prevModule ||
    selectedLesson !== prevLesson
  ) {
    setPrevSelection(selection);
    setPrevTrack(selectedTrack);
    setPrevModule(selectedModule);
    setPrevLesson(selectedLesson);

    if (selection.type === "track" && selectedTrack) {
      setTrackTitle(selectedTrack.title || "");
      setTrackDescription(selectedTrack.description || "");
      setTrackCategory(selectedTrack.category || "web");
      setTrackXpReward(selectedTrack.xpReward ?? 500);
      setTrackEstimatedWeeks(selectedTrack.estimatedWeeks ?? 12);
      setTrackIsActive(selectedTrack.isActive !== false);
      setIsDirty(false);
    } else if (selection.type === "new-track") {
      setTrackTitle("");
      setTrackDescription("");
      setTrackCategory("web");
      setTrackXpReward(500);
      setTrackEstimatedWeeks(12);
      setTrackIsActive(true);
      setIsDirty(false);
    }

    if (selection.type === "module" && selectedModule) {
      setModuleTitle(selectedModule.title || "");
      setModuleDescription(selectedModule.description || "");
      setModuleOrder(selectedModule.order ?? 1);
      setIsDirty(false);
    } else if (selection.type === "new-module") {
      setModuleTitle("");
      setModuleDescription("");
      setModuleOrder(1);
      setIsDirty(false);
    }

    if (selection.type === "lesson" && selectedLesson) {
      setLessonTitle(selectedLesson.title || "");
      setLessonSummary(selectedLesson.summary || "");
      setLessonContent(selectedLesson.content || "");
      setLessonType(selectedLesson.type || "concept");
      setLessonVideoUrl(selectedLesson.videoUrl || "");
      setLessonCodeSandboxUrl(selectedLesson.codeSandboxUrl || "");
      setLessonStarterCode(selectedLesson.starterCode || "");
      setLessonChallengeTask(selectedLesson.challengeTask || "");
      setLessonXpReward(selectedLesson.xpReward ?? 50);
      setLessonDurationMinutes(selectedLesson.durationMinutes ?? 20);
      setLessonOrder(selectedLesson.order ?? 1);
      setLessonQuiz(selectedLesson.quiz || []);
      setIsDirty(false);
    } else if (selection.type === "new-lesson") {
      setLessonTitle("");
      setLessonSummary("");
      setLessonContent(
        "# Lesson Overview\n\nExplain the key concepts and mental model for this topic.\n\n## Objectives\n- Learn foundational concepts\n- Complete hands-on challenges\n",
      );
      setLessonType("concept");
      setLessonVideoUrl("");
      setLessonCodeSandboxUrl("");
      setLessonStarterCode("");
      setLessonChallengeTask("");
      setLessonXpReward(50);
      setLessonDurationMinutes(20);
      setLessonOrder(1);
      setLessonQuiz([]);
      setIsDirty(false);
    }
  }

  // Handle Save
  const handleSave = useCallback(() => {
    if (selection.type === "track" || selection.type === "new-track") {
      if (!trackTitle.trim()) return;
      onSaveTrack({
        title: trackTitle.trim(),
        description: trackDescription.trim() || undefined,
        category: trackCategory,
        xpReward: trackXpReward === "" ? undefined : Number(trackXpReward),
        estimatedWeeks: trackEstimatedWeeks === "" ? undefined : Number(trackEstimatedWeeks),
        isActive: trackIsActive,
      });
      setIsDirty(false);
    } else if (selection.type === "module" || selection.type === "new-module") {
      if (!moduleTitle.trim()) return;
      onSaveModule({
        title: moduleTitle.trim(),
        description: moduleDescription.trim() || undefined,
        order: moduleOrder === "" ? undefined : Number(moduleOrder),
        track: selection.trackId,
      });
      setIsDirty(false);
    } else if (selection.type === "lesson" || selection.type === "new-lesson") {
      if (!lessonTitle.trim()) return;
      onSaveLesson({
        title: lessonTitle.trim(),
        summary: lessonSummary.trim() || undefined,
        content: lessonContent.trim() || undefined,
        type: lessonType,
        videoUrl: lessonVideoUrl.trim() || undefined,
        codeSandboxUrl: lessonCodeSandboxUrl.trim() || undefined,
        starterCode: lessonStarterCode.trim() || undefined,
        challengeTask: lessonChallengeTask.trim() || undefined,
        xpReward: lessonXpReward === "" ? undefined : Number(lessonXpReward),
        durationMinutes: lessonDurationMinutes === "" ? undefined : Number(lessonDurationMinutes),
        order: lessonOrder === "" ? undefined : Number(lessonOrder),
        quiz: lessonQuiz.length > 0 ? lessonQuiz : undefined,
        module: selection.moduleId,
      });
      setIsDirty(false);
    }
  }, [
    selection,
    trackTitle,
    trackDescription,
    trackCategory,
    trackXpReward,
    trackEstimatedWeeks,
    trackIsActive,
    moduleTitle,
    moduleDescription,
    moduleOrder,
    lessonTitle,
    lessonSummary,
    lessonContent,
    lessonType,
    lessonVideoUrl,
    lessonCodeSandboxUrl,
    lessonStarterCode,
    lessonChallengeTask,
    lessonXpReward,
    lessonDurationMinutes,
    lessonOrder,
    lessonQuiz,
    onSaveTrack,
    onSaveModule,
    onSaveLesson,
  ]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Reset / Discard changes
  const handleDiscard = () => {
    if (selection.type === "track" && selectedTrack) {
      setTrackTitle(selectedTrack.title || "");
      setTrackDescription(selectedTrack.description || "");
      setTrackCategory(selectedTrack.category || "web");
      setTrackXpReward(selectedTrack.xpReward ?? 500);
      setTrackEstimatedWeeks(selectedTrack.estimatedWeeks ?? 12);
      setTrackIsActive(selectedTrack.isActive !== false);
    } else if (selection.type === "module" && selectedModule) {
      setModuleTitle(selectedModule.title || "");
      setModuleDescription(selectedModule.description || "");
      setModuleOrder(selectedModule.order ?? 1);
    } else if (selection.type === "lesson" && selectedLesson) {
      setLessonTitle(selectedLesson.title || "");
      setLessonSummary(selectedLesson.summary || "");
      setLessonContent(selectedLesson.content || "");
      setLessonType(selectedLesson.type || "concept");
      setLessonVideoUrl(selectedLesson.videoUrl || "");
      setLessonCodeSandboxUrl(selectedLesson.codeSandboxUrl || "");
      setLessonStarterCode(selectedLesson.starterCode || "");
      setLessonChallengeTask(selectedLesson.challengeTask || "");
      setLessonXpReward(selectedLesson.xpReward ?? 50);
      setLessonDurationMinutes(selectedLesson.durationMinutes ?? 20);
      setLessonOrder(selectedLesson.order ?? 1);
      setLessonQuiz(selectedLesson.quiz || []);
    }
    setIsDirty(false);
  };

  const isEditingTrack = selection.type === "track" || selection.type === "new-track";
  const isEditingModule = selection.type === "module" || selection.type === "new-module";
  const isEditingLesson = selection.type === "lesson" || selection.type === "new-lesson";

  return (
    <div className="flex h-full flex-col bg-[var(--bg-card)]">
      {/* Action Header Bar */}
      <div className="border-b border-[var(--border)] p-4 bg-white/[0.01]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] min-w-0 flex-1">
            <span className="flex items-center gap-1 font-semibold text-white truncate">
              {isEditingTrack && <BookOpen size={14} className="text-primary shrink-0" />}
              {isEditingModule && <FolderOpen size={14} className="text-secondary shrink-0" />}
              {isEditingLesson && <FileText size={14} className="text-emerald-400 shrink-0" />}
              {isEditingTrack &&
                (selection.type === "new-track" ? "Tracks / New Track" : selectedTrack?.title || "Track Configuration")}
              {isEditingModule && (
                <>
                  <span className="text-[var(--text-muted)]">{selectedTrack?.title}</span>
                  <ChevronRight size={12} />
                  <span>{selectedModule?.title || "New Module"}</span>
                </>
              )}
              {isEditingLesson && (
                <>
                  <span className="text-[var(--text-muted)] hidden sm:inline">{selectedTrack?.title}</span>
                  <ChevronRight size={12} className="hidden sm:inline" />
                  <span className="text-[var(--text-muted)]">{selectedModule?.title}</span>
                  <ChevronRight size={12} />
                  <span>{selectedLesson?.title || "New Lesson"}</span>
                </>
              )}
            </span>

            {/* Unsaved status */}
            <div className="ml-2 flex items-center gap-1.5">
              {isDirty ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                  <CheckCircle2 size={11} className="text-emerald-400" />
                  Saved
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button type="button" variant="outline" size="sm" onClick={handleDiscard} className="h-8 gap-1 text-xs">
                <RotateCcw size={13} /> Discard
              </Button>
            )}

            {isEditingTrack && selectedTrack && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDeleteTrack(selectedTrack)}
                className="h-8 w-8 text-danger hover:bg-danger/10"
                title="Delete Track"
              >
                <Trash2 size={14} />
              </Button>
            )}

            {isEditingModule && selectedModule && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDeleteModule(selectedModule)}
                className="h-8 w-8 text-danger hover:bg-danger/10"
                title="Delete Module"
              >
                <Trash2 size={14} />
              </Button>
            )}

            {isEditingLesson && selectedLesson && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDeleteLesson(selectedLesson)}
                className="h-8 w-8 text-danger hover:bg-danger/10"
                title="Delete Lesson"
              >
                <Trash2 size={14} />
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              loading={isSaving}
              onClick={handleSave}
              className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-md"
            >
              <Save size={14} /> Save Changes
              <span className="hidden sm:inline text-[10px] opacity-70">(Ctrl+S)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* ========================================================================= */}
        {/* 1. TRACK METADATA & CAPSTONE EDITOR */}
        {/* ========================================================================= */}
        {isEditingTrack && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Track Header Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-primary" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {selection.type === "new-track" ? "Create New Track" : "Track Configuration"}
                  </h3>
                </div>
                <Badge variant={trackIsActive ? "success" : "warning"} showDot>
                  {trackIsActive ? "Published & Active" : "Draft (Hidden)"}
                </Badge>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="track-edit-title" className="block text-xs font-medium text-white">
                  Track Title <span className="text-danger">*</span>
                </label>
                <Input
                  id="track-edit-title"
                  value={trackTitle}
                  onChange={(e) => {
                    setTrackTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Data Science & Machine Learning Engineering"
                  className="font-semibold text-base"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="track-edit-desc" className="block text-xs font-medium text-white">
                  Track Description & Curriculum Overview
                </label>
                <Textarea
                  id="track-edit-desc"
                  value={trackDescription}
                  onChange={(e) => {
                    setTrackDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Provide an overview of the competencies, tools, and real-world architectures students will master..."
                  rows={3}
                />
              </div>

              {/* Track Metadata Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="track-edit-cat" className="block text-xs font-medium text-white">
                    Category & Track Domain
                  </label>
                  <select
                    id="track-edit-cat"
                    value={trackCategory}
                    onChange={(e) => {
                      setTrackCategory(e.target.value);
                      setIsDirty(true);
                    }}
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-3 text-xs text-white focus:outline-none"
                  >
                    {TRACK_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="track-edit-xp" className="flex items-center gap-1 text-xs font-medium text-white">
                    <Award size={13} className="text-amber-400" />
                    XP Completion Reward
                  </label>
                  <Input
                    id="track-edit-xp"
                    type="number"
                    min={0}
                    value={trackXpReward}
                    onChange={(e) => {
                      setTrackXpReward(e.target.value === "" ? "" : Number(e.target.value));
                      setIsDirty(true);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="track-edit-weeks" className="flex items-center gap-1 text-xs font-medium text-white">
                    <Clock size={13} className="text-primary" />
                    Estimated Duration (Weeks)
                  </label>
                  <Input
                    id="track-edit-weeks"
                    type="number"
                    min={1}
                    value={trackEstimatedWeeks}
                    onChange={(e) => {
                      setTrackEstimatedWeeks(e.target.value === "" ? "" : Number(e.target.value));
                      setIsDirty(true);
                    }}
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-white block">Publication Status</span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Active tracks are immediately discoverable in student dashboards.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTrackIsActive((v) => !v);
                    setIsDirty(true);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                    trackIsActive
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-400",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", trackIsActive ? "bg-emerald-400" : "bg-amber-400")} />
                  {trackIsActive ? "Published & Live" : "Draft"}
                </button>
              </div>
            </div>

            {/* Capstone Project Section */}
            {selection.type === "track" && selectedTrack && (
              <CapstoneProjectEditor
                trackId={selectedTrack._id}
                trackTitle={selectedTrack.title}
                projects={capstoneProjects}
                onSaveProject={onSaveCapstoneProject}
                onDeleteProject={onDeleteCapstoneProject}
                isSaving={isSaving}
              />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MODULE EDITOR */}
        {/* ========================================================================= */}
        {isEditingModule && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <FolderOpen size={18} className="text-secondary" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {selection.type === "new-module" ? "Create New Module" : "Module Configuration"}
                </h3>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="mod-edit-title" className="block text-xs font-medium text-white">
                  Module Title <span className="text-danger">*</span>
                </label>
                <Input
                  id="mod-edit-title"
                  value={moduleTitle}
                  onChange={(e) => {
                    setModuleTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Asynchronous Architecture & Microservices"
                  className="font-semibold text-base"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="mod-edit-desc" className="block text-xs font-medium text-white">
                  Module Description
                </label>
                <Textarea
                  id="mod-edit-desc"
                  value={moduleDescription}
                  onChange={(e) => {
                    setModuleDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="What core competencies are unlocked in this module..."
                  rows={4}
                />
              </div>

              {/* Order index */}
              <div className="space-y-1.5 max-w-xs">
                <label htmlFor="mod-edit-order" className="flex items-center gap-1 text-xs font-medium text-white">
                  <Hash size={13} className="text-primary" />
                  Sequence Order Index
                </label>
                <Input
                  id="mod-edit-order"
                  type="number"
                  min={1}
                  value={moduleOrder}
                  onChange={(e) => {
                    setModuleOrder(e.target.value === "" ? "" : Number(e.target.value));
                    setIsDirty(true);
                  }}
                />
                <p className="text-[11px] text-[var(--text-muted)]">
                  Lower numbers appear first in the curriculum tree.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. RICH LESSON EDITOR */}
        {/* ========================================================================= */}
        {isEditingLesson && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Primary Lesson Details Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {selection.type === "new-lesson" ? "Create New Lesson" : "Lesson Editor"}
                  </h3>
                </div>
                {lessonType && (
                  <Badge variant="purple" size="sm" className="uppercase">
                    {lessonType}
                  </Badge>
                )}
              </div>

              {/* Lesson Title */}
              <div className="space-y-1.5">
                <label htmlFor="lesson-edit-title" className="block text-xs font-medium text-white">
                  Lesson Title <span className="text-danger">*</span>
                </label>
                <Input
                  id="lesson-edit-title"
                  value={lessonTitle}
                  onChange={(e) => {
                    setLessonTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Implementing Distributed Consensus with Raft"
                  className="font-semibold text-base"
                  required
                />
              </div>

              {/* Lesson Summary / Tagline */}
              <div className="space-y-1.5">
                <label htmlFor="lesson-edit-summary" className="block text-xs font-medium text-white">
                  Lesson Summary & Core Objective
                </label>
                <Input
                  id="lesson-edit-summary"
                  value={lessonSummary}
                  onChange={(e) => {
                    setLessonSummary(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Brief 1-line overview displayed in the student syllabus..."
                />
              </div>

              {/* Lesson Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white">Lesson Delivery Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {LESSON_TYPES.map((lt) => {
                    const isSelected = lessonType === lt.value;
                    return (
                      <button
                        key={lt.value}
                        type="button"
                        onClick={() => {
                          setLessonType(lt.value);
                          setIsDirty(true);
                        }}
                        className={cn(
                          "flex flex-col items-start rounded-xl border p-2.5 text-left transition-all",
                          isSelected
                            ? "border-primary/60 bg-primary/10 shadow-sm ring-1 ring-primary/40 text-white"
                            : "border-[var(--border)] bg-white/[0.02] text-slate-300 hover:bg-white/5",
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {lt.value === "video" && <PlayCircle size={14} className="text-purple-400" />}
                          {lt.value === "code-lab" && <Code2 size={14} className="text-emerald-400" />}
                          {lt.value === "concept" && <BookOpen size={14} className="text-cyan-400" />}
                          {lt.value === "quiz" && <HelpCircle size={14} className="text-amber-400" />}
                          {lt.value === "project" && <Award size={14} className="text-primary" />}
                          <span className="text-xs font-semibold leading-none">{lt.label}</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] line-clamp-2">{lt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Numeric Meta Fields */}
              <div className="grid gap-4 sm:grid-cols-3 pt-1">
                <div className="space-y-1.5">
                  <label
                    htmlFor="lesson-edit-duration"
                    className="flex items-center gap-1 text-xs font-medium text-white"
                  >
                    <Clock size={13} className="text-primary" />
                    Estimated Duration (Minutes)
                  </label>
                  <Input
                    id="lesson-edit-duration"
                    type="number"
                    min={1}
                    value={lessonDurationMinutes}
                    onChange={(e) => {
                      setLessonDurationMinutes(e.target.value === "" ? "" : Number(e.target.value));
                      setIsDirty(true);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="lesson-edit-xp" className="flex items-center gap-1 text-xs font-medium text-white">
                    <Award size={13} className="text-amber-400" />
                    XP Completion Reward
                  </label>
                  <Input
                    id="lesson-edit-xp"
                    type="number"
                    min={0}
                    value={lessonXpReward}
                    onChange={(e) => {
                      setLessonXpReward(e.target.value === "" ? "" : Number(e.target.value));
                      setIsDirty(true);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="lesson-edit-order" className="flex items-center gap-1 text-xs font-medium text-white">
                    <Hash size={13} className="text-secondary" />
                    Sequence Order
                  </label>
                  <Input
                    id="lesson-edit-order"
                    type="number"
                    min={1}
                    value={lessonOrder}
                    onChange={(e) => {
                      setLessonOrder(e.target.value === "" ? "" : Number(e.target.value));
                      setIsDirty(true);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Video Embed Section (if video or code-lab) */}
            {(lessonType === "video" || lessonVideoUrl) && (
              <VideoEmbedPreview
                url={lessonVideoUrl}
                onChange={(val) => {
                  setLessonVideoUrl(val);
                  setIsDirty(true);
                }}
              />
            )}

            {/* CodeSandbox & Starter Code Section (if code-lab or starter code present) */}
            {(lessonType === "code-lab" || lessonStarterCode || lessonCodeSandboxUrl) && (
              <CodeSandboxStarterEditor
                codeSandboxUrl={lessonCodeSandboxUrl}
                onCodeSandboxUrlChange={(val) => {
                  setLessonCodeSandboxUrl(val);
                  setIsDirty(true);
                }}
                starterCode={lessonStarterCode}
                onStarterCodeChange={(val) => {
                  setLessonStarterCode(val);
                  setIsDirty(true);
                }}
                challengeTask={lessonChallengeTask}
                onChallengeTaskChange={(val) => {
                  setLessonChallengeTask(val);
                  setIsDirty(true);
                }}
              />
            )}

            {/* Quiz Builder Section (if quiz type or quiz questions exist) */}
            {(lessonType === "quiz" || lessonQuiz.length > 0) && (
              <QuizEditor
                questions={lessonQuiz}
                onChange={(q) => {
                  setLessonQuiz(q);
                  setIsDirty(true);
                }}
              />
            )}

            {/* Comprehensive Markdown Content Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white">
                  <Sparkles size={14} className="text-primary" />
                  Markdown Curriculum Content & Live Preview
                </label>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Toggle &quot;Split&quot; to write code and view rendered formatting side-by-side
                </span>
              </div>
              <MarkdownEditor
                value={lessonContent}
                onChange={(val) => {
                  setLessonContent(val);
                  setIsDirty(true);
                }}
                placeholder="Draft comprehensive markdown explanations, code blocks, diagrams, and task checklists..."
                minHeight="420px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

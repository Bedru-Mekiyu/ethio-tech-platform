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
  const [prevSelection, setPrevSelection] = useState<ContentSelection | null>(null);
  const [prevTrack, setPrevTrack] = useState<Track | null>(null);
  const [prevModule, setPrevModule] = useState<Module | null>(null);
  const [prevLesson, setPrevLesson] = useState<Lesson | null>(null);

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
    <div className="flex h-full flex-col bg-slate-50/50">
      {/* Action Header Bar */}
      <div className="border-b border-slate-200/80 p-4 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0 flex-1">
            <span className="flex items-center gap-1 font-semibold text-slate-900 truncate">
              {isEditingTrack && <BookOpen size={14} className="text-zinc-900 shrink-0" />}
              {isEditingModule && <FolderOpen size={14} className="text-zinc-900 shrink-0" />}
              {isEditingLesson && <FileText size={14} className="text-zinc-900 shrink-0" />}
              {isEditingTrack &&
                (selection.type === "new-track" ? "Tracks / New Track" : selectedTrack?.title || "Track Configuration")}
              {isEditingModule && (
                <>
                  <span className="text-slate-500">{selectedTrack?.title}</span>
                  <ChevronRight size={12} className="text-slate-400" />
                  <span>{selectedModule?.title || "New Module"}</span>
                </>
              )}
              {isEditingLesson && (
                <>
                  <span className="text-slate-500 hidden sm:inline">{selectedTrack?.title}</span>
                  <ChevronRight size={12} className="hidden sm:inline text-slate-400" />
                  <span className="text-slate-500">{selectedModule?.title}</span>
                  <ChevronRight size={12} className="text-slate-400" />
                  <span>{selectedLesson?.title || "New Lesson"}</span>
                </>
              )}
            </span>

            {/* Unsaved status */}
            <div className="ml-2 flex items-center gap-1.5">
              {isDirty ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <CheckCircle2 size={11} className="text-zinc-900" />
                  Saved
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDiscard}
                className="h-8 gap-1 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                <RotateCcw size={13} /> Discard
              </Button>
            )}

            {isEditingTrack && selectedTrack && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDeleteTrack(selectedTrack)}
                className="h-8 w-8 text-rose-600 hover:bg-rose-50"
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
                className="h-8 w-8 text-rose-600 hover:bg-rose-50"
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
                className="h-8 w-8 text-rose-600 hover:bg-rose-50"
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
              className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-xs"
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
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-zinc-900" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {selection.type === "new-track" ? "Create New Track" : "Track Configuration"}
                  </h3>
                </div>
                <Badge variant={trackIsActive ? "outline" : "warning"} showDot>
                  {trackIsActive ? "Published & Active" : "Draft (Hidden)"}
                </Badge>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="track-edit-title" className="block text-xs font-semibold text-slate-800">
                  Track Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="track-edit-title"
                  value={trackTitle}
                  onChange={(e) => {
                    setTrackTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Data Science & Machine Learning Engineering"
                  className="font-semibold text-base border-slate-200 bg-white text-slate-900"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="track-edit-desc" className="block text-xs font-semibold text-slate-800">
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
                  className="border-slate-200 bg-white text-slate-900"
                />
              </div>

              {/* Track Metadata Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="track-edit-cat" className="block text-xs font-semibold text-slate-800">
                    Category & Track Domain
                  </label>
                  <select
                    id="track-edit-cat"
                    value={trackCategory}
                    onChange={(e) => {
                      setTrackCategory(e.target.value);
                      setIsDirty(true);
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-zinc-400 cursor-pointer"
                  >
                    {TRACK_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="track-edit-xp"
                    className="flex items-center gap-1 text-xs font-semibold text-slate-800"
                  >
                    <Award size={13} className="text-amber-500" />
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
                    className="border-slate-200 bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="track-edit-weeks"
                    className="flex items-center gap-1 text-xs font-semibold text-slate-800"
                  >
                    <Clock size={13} className="text-zinc-600" />
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
                    className="border-slate-200 bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Publication Status</span>
                  <span className="text-[11px] text-slate-500">
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
                      ? "border-zinc-300 bg-zinc-100 text-zinc-900"
                      : "border-amber-300 bg-amber-50 text-amber-700",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", trackIsActive ? "bg-zinc-900" : "bg-amber-500")} />
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
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FolderOpen size={18} className="text-zinc-900" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {selection.type === "new-module" ? "Create New Module" : "Module Configuration"}
                </h3>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="mod-edit-title" className="block text-xs font-semibold text-slate-800">
                  Module Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="mod-edit-title"
                  value={moduleTitle}
                  onChange={(e) => {
                    setModuleTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Module 1: Production System Architecture"
                  className="font-semibold text-base border-slate-200 bg-white text-slate-900"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="mod-edit-desc" className="block text-xs font-semibold text-slate-800">
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
                  className="border-slate-200 bg-white text-slate-900"
                />
              </div>

              {/* Order index */}
              <div className="space-y-1.5 max-w-xs">
                <label
                  htmlFor="mod-edit-order"
                  className="flex items-center gap-1 text-xs font-semibold text-slate-800"
                >
                  <Hash size={13} className="text-zinc-600" />
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
                  className="border-slate-200 bg-white text-slate-900"
                />
                <p className="text-[11px] text-slate-500">Lower numbers appear first in the curriculum tree.</p>
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
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-zinc-900" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {selection.type === "new-lesson" ? "Create New Lesson" : "Lesson Editor"}
                  </h3>
                </div>
                {lessonType && (
                  <Badge variant="outline" size="sm" className="uppercase">
                    {lessonType}
                  </Badge>
                )}
              </div>

              {/* Lesson Title */}
              <div className="space-y-1.5">
                <label htmlFor="lesson-edit-title" className="block text-xs font-semibold text-slate-800">
                  Lesson Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="lesson-edit-title"
                  value={lessonTitle}
                  onChange={(e) => {
                    setLessonTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Implementing Distributed Consensus with Raft"
                  className="font-semibold text-base border-slate-200 bg-white text-slate-900"
                  required
                />
              </div>

              {/* Lesson Summary / Tagline */}
              <div className="space-y-1.5">
                <label htmlFor="lesson-edit-summary" className="block text-xs font-semibold text-slate-800">
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
                  className="border-slate-200 bg-white text-slate-900"
                />
              </div>

              {/* Lesson Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Lesson Delivery Type</label>
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
                            ? "border-zinc-900 bg-zinc-100 shadow-xs ring-1 ring-zinc-900/20 text-zinc-950 font-semibold"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {lt.value === "video" && <PlayCircle size={14} className="text-zinc-900" />}
                          {lt.value === "code-lab" && <Code2 size={14} className="text-zinc-900" />}
                          {lt.value === "concept" && <BookOpen size={14} className="text-zinc-900" />}
                          {lt.value === "quiz" && <HelpCircle size={14} className="text-amber-600" />}
                          {lt.value === "project" && <Award size={14} className="text-[#b91c1c]" />}
                          <span className="text-xs font-semibold leading-none">{lt.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 line-clamp-2">{lt.description}</span>
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
                    className="flex items-center gap-1 text-xs font-semibold text-slate-800"
                  >
                    <Clock size={13} className="text-zinc-600" />
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
                    className="border-slate-200 bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lesson-edit-xp"
                    className="flex items-center gap-1 text-xs font-semibold text-slate-800"
                  >
                    <Award size={13} className="text-amber-500" />
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
                    className="border-slate-200 bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lesson-edit-order"
                    className="flex items-center gap-1 text-xs font-semibold text-slate-800"
                  >
                    <Hash size={13} className="text-zinc-600" />
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
                    className="border-slate-200 bg-white text-slate-900"
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
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-900">
                  <Sparkles size={14} className="text-[#b91c1c]" />
                  Markdown Curriculum Content & Live Preview
                </label>
                <span className="text-[11px] text-slate-500">
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

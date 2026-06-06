import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { ConfirmDialog } from "@/components/composites/ConfirmDialog";
import { useToast } from "@/components/composites/ToastProvider";
import {
  BookOpen,
  FolderOpen,
  FileText,
  Plus,
  ChevronRight,
  ChevronLeft,
  Search,
  Pencil,
  Trash2,
  X,
  Clock,
  Award,
  Hash,
} from "lucide-react";

interface Track {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  xpReward?: number;
  estimatedWeeks?: number;
  modules?: Array<{ _id: string; title: string; lessons?: Array<{ _id: string }> }>;
}

interface Module {
  _id: string;
  title: string;
  description?: string;
  track: string;
  order?: number;
}

interface Lesson {
  _id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  codeSandboxUrl?: string;
  xpReward?: number;
  module: string;
  durationMinutes?: number;
  order?: number;
}

type ContentView = "tracks" | "modules" | "lessons";

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "awareness", label: "Awareness" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

interface DeleteTarget {
  type: "track" | "module" | "lesson";
  id: string;
  name: string;
}

const unwrap = <T,>(payload: unknown, key: string): T => {
  const p = payload as { data?: Record<string, T> } & Record<string, T>;
  return (p?.data?.[key] ?? p?.[key]) as T;
};

export function AdminContentPage() {
  usePageTitle("Content Management");
  const toast = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ContentView>("tracks");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [trackForm, setTrackForm] = useState<{ open: boolean; track: Track | null }>({
    open: false,
    track: null,
  });
  const [moduleForm, setModuleForm] = useState<{ open: boolean; module: Module | null }>({
    open: false,
    module: null,
  });
  const [lessonForm, setLessonForm] = useState<{ open: boolean; lesson: Lesson | null }>({
    open: false,
    lesson: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // --- Queries ---
  const tracksQuery = useQuery({
    queryKey: ["admin", "tracks"],
    queryFn: async () => {
      const { data } = await api.get("/tracks");
      return unwrap<Track[]>(data, "tracks");
    },
  });

  const modulesQuery = useQuery({
    queryKey: ["admin", "modules", selectedTrackId],
    queryFn: async () => {
      const { data } = await api.get(`/modules?track=${selectedTrackId}`);
      return unwrap<Module[]>(data, "modules");
    },
    enabled: !!selectedTrackId,
  });

  const lessonsQuery = useQuery({
    queryKey: ["admin", "lessons", selectedModuleId],
    queryFn: async () => {
      const { data } = await api.get(`/lessons?module=${selectedModuleId}`);
      return unwrap<Lesson[]>(data, "lessons");
    },
    enabled: !!selectedModuleId,
  });

  // --- Track mutations ---
  const saveTrackMutation = useMutation({
    mutationFn: async (payload: Partial<Track>) => {
      if (trackForm.track) {
        const { data } = await api.patch<ApiResponse<{ track: Track }>>(`/tracks/${trackForm.track._id}`, payload);
        return data.data.track;
      }
      const { data } = await api.post<ApiResponse<{ track: Track }>>("/tracks", payload);
      return data.data.track;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      toast.success(trackForm.track ? "Track updated" : "Track created");
      setTrackForm({ open: false, track: null });
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, "Failed to save track");
      toast.error(message);
    },
  });

  const deleteTrackMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tracks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      toast.success("Track deleted");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete track"),
  });

  // --- Module mutations ---
  const saveModuleMutation = useMutation({
    mutationFn: async (payload: Partial<Module>) => {
      if (moduleForm.module) {
        const { data } = await api.patch<ApiResponse<{ module: Module }>>(`/modules/${moduleForm.module._id}`, payload);
        return data.data.module;
      }
      const { data } = await api.post<ApiResponse<{ module: Module }>>("/modules", {
        ...payload,
        track: selectedTrackId,
      });
      return data.data.module;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "modules", selectedTrackId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      toast.success(moduleForm.module ? "Module updated" : "Module created");
      setModuleForm({ open: false, module: null });
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, "Failed to save module");
      toast.error(message);
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/modules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "modules", selectedTrackId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      toast.success("Module deleted");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete module"),
  });

  // --- Lesson mutations ---
  const saveLessonMutation = useMutation({
    mutationFn: async (payload: Partial<Lesson>) => {
      if (lessonForm.lesson) {
        const { data } = await api.patch<ApiResponse<{ lesson: Lesson }>>(`/lessons/${lessonForm.lesson._id}`, payload);
        return data.data.lesson;
      }
      const { data } = await api.post<ApiResponse<{ lesson: Lesson }>>("/lessons", {
        ...payload,
        module: selectedModuleId,
      });
      return data.data.lesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons", selectedModuleId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "modules", selectedTrackId] });
      toast.success(lessonForm.lesson ? "Lesson updated" : "Lesson created");
      setLessonForm({ open: false, lesson: null });
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, "Failed to save lesson");
      toast.error(message);
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/lessons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons", selectedModuleId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "modules", selectedTrackId] });
      toast.success("Lesson deleted");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete lesson"),
  });

  // --- Derived data ---
  const tracks = tracksQuery.data ?? [];
  const modules = modulesQuery.data ?? [];
  const lessons = lessonsQuery.data ?? [];

  const filteredTracks = search
    ? tracks.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : tracks;

  const selectedTrack = tracks.find((t) => t._id === selectedTrackId);
  const selectedModule = modules.find((m) => m._id === selectedModuleId);

  const goToTracks = () => {
    setView("tracks");
    setSelectedTrackId(null);
    setSelectedModuleId(null);
  };
  const goToModules = () => {
    setView("modules");
    setSelectedModuleId(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "track") deleteTrackMutation.mutate(deleteTarget.id);
    if (deleteTarget.type === "module") deleteModuleMutation.mutate(deleteTarget.id);
    if (deleteTarget.type === "lesson") deleteLessonMutation.mutate(deleteTarget.id);
  };

  const deleteLoading =
    deleteTrackMutation.isPending || deleteModuleMutation.isPending || deleteLessonMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <h1 className="text-3xl font-bold tracking-tight">Curriculum Builder</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Manage tracks, modules, and lessons. Build the learning infrastructure for Ethiopia&apos;s next generation of
          engineers.
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <button type="button" onClick={goToTracks} className="hover:text-white transition-colors">
          Tracks
        </button>
        {selectedTrack && (
          <>
            <ChevronRight size={14} />
            <button type="button" onClick={goToModules} className="hover:text-white transition-colors">
              {selectedTrack.title}
            </button>
          </>
        )}
        {selectedModule && (
          <>
            <ChevronRight size={14} />
            <span className="text-white">{selectedModule.title}</span>
          </>
        )}
      </div>

      {view === "tracks" && (
        <TracksView
          tracks={filteredTracks}
          isLoading={tracksQuery.isLoading}
          isError={tracksQuery.isError}
          onRetry={() => tracksQuery.refetch()}
          onSelectTrack={(id) => {
            setSelectedTrackId(id);
            setSelectedModuleId(null);
            setView("modules");
          }}
          onCreate={() => setTrackForm({ open: true, track: null })}
          onEdit={(track) => setTrackForm({ open: true, track })}
          onDelete={(track) => setDeleteTarget({ type: "track", id: track._id, name: track.title })}
          search={search}
          onSearchChange={setSearch}
        />
      )}

      {view === "modules" && selectedTrackId && (
        <ModulesView
          track={selectedTrack}
          modules={modules}
          isLoading={modulesQuery.isLoading}
          isError={modulesQuery.isError}
          onRetry={() => modulesQuery.refetch()}
          onSelectModule={(id) => {
            setSelectedModuleId(id);
            setView("lessons");
          }}
          onCreate={() => setModuleForm({ open: true, module: null })}
          onEdit={(mod) => setModuleForm({ open: true, module: mod })}
          onDelete={(mod) => setDeleteTarget({ type: "module", id: mod._id, name: mod.title })}
          onBack={goToTracks}
        />
      )}

      {view === "lessons" && selectedModuleId && (
        <LessonsView
          module={selectedModule}
          lessons={lessons}
          isLoading={lessonsQuery.isLoading}
          isError={lessonsQuery.isError}
          onRetry={() => lessonsQuery.refetch()}
          onCreate={() => setLessonForm({ open: true, lesson: null })}
          onEdit={(lesson) => setLessonForm({ open: true, lesson })}
          onDelete={(lesson) => setDeleteTarget({ type: "lesson", id: lesson._id, name: lesson.title })}
          onBack={goToModules}
        />
      )}

      <TrackFormDialog
        open={trackForm.open}
        track={trackForm.track}
        loading={saveTrackMutation.isPending}
        onClose={() => setTrackForm({ open: false, track: null })}
        onSubmit={(payload) => saveTrackMutation.mutate(payload)}
      />

      <ModuleFormDialog
        open={moduleForm.open}
        module={moduleForm.module}
        loading={saveModuleMutation.isPending}
        onClose={() => setModuleForm({ open: false, module: null })}
        onSubmit={(payload) => saveModuleMutation.mutate(payload)}
      />

      <LessonFormDialog
        open={lessonForm.open}
        lesson={lessonForm.lesson}
        loading={saveLessonMutation.isPending}
        onClose={() => setLessonForm({ open: false, lesson: null })}
        onSubmit={(payload) => saveLessonMutation.mutate(payload)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type ?? "item"}?`}
        description={
          deleteTarget ? `"${deleteTarget.name}" will be permanently removed. This action cannot be undone.` : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err) {
    const anyErr = err as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    };
    return anyErr.response?.data?.message ?? anyErr.response?.data?.error ?? anyErr.message ?? fallback;
  }
  return fallback;
}

// ─────────────────────────── Tracks view ───────────────────────────

function TracksView({
  tracks,
  isLoading,
  isError,
  onRetry,
  onSelectTrack,
  onCreate,
  onEdit,
  onDelete,
  search,
  onSearchChange,
}: {
  tracks: Track[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectTrack: (id: string) => void;
  onCreate: () => void;
  onEdit: (track: Track) => void;
  onDelete: (track: Track) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
      <CardHeader className="mb-4 p-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Learning Tracks</CardTitle>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Top-level programs your students follow.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                placeholder="Search tracks…"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 w-56"
              />
            </div>
            <Button onClick={onCreate}>
              <Plus size={16} className="mr-1" /> New Track
            </Button>
          </div>
        </div>
      </CardHeader>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      )}

      {isError && <QueryError onRetry={onRetry} />}

      {!isLoading && !isError && tracks.length === 0 && (
        <EmptyState
          eyebrow="Get started"
          title="No tracks yet"
          description="Create your first learning track to start building the curriculum."
          actionLabel="Create track"
          onAction={onCreate}
        />
      )}

      <div className="space-y-3">
        {tracks.map((track) => {
          const moduleCount = track.modules?.length ?? 0;
          const lessonCount = track.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0;
          return (
            <div
              key={track._id}
              className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/5 p-4 transition hover:border-primary/40 hover:bg-white/10"
            >
              <button
                type="button"
                onClick={() => onSelectTrack(track._id)}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white truncate">{track.title}</p>
                  {track.description && (
                    <p className="mt-0.5 text-xs text-[var(--text-muted)] line-clamp-1">{track.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Badge variant={track.isActive !== false ? "success" : "default"} showDot>
                      {track.isActive !== false ? "Active" : "Draft"}
                    </Badge>
                    {track.category && <span className="uppercase tracking-wider">{track.category}</span>}
                    {track.xpReward ? (
                      <span className="inline-flex items-center gap-1">
                        <Award size={11} /> {track.xpReward} XP
                      </span>
                    ) : null}
                    {track.estimatedWeeks ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {track.estimatedWeeks}w
                      </span>
                    ) : null}
                    <span>{moduleCount} modules</span>
                    {lessonCount > 0 && <span>· {lessonCount} lessons</span>}
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" onClick={() => onEdit(track)} aria-label={`Edit ${track.title}`}>
                  <Pencil size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(track)}
                  aria-label={`Delete ${track.title}`}
                  className="hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onSelectTrack(track._id)} aria-label="Open modules">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────── Modules view ───────────────────────────

function ModulesView({
  track,
  modules,
  isLoading,
  isError,
  onRetry,
  onSelectModule,
  onCreate,
  onEdit,
  onDelete,
  onBack,
}: {
  track: Track | undefined;
  modules: Module[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectModule: (id: string) => void;
  onCreate: () => void;
  onEdit: (mod: Module) => void;
  onDelete: (mod: Module) => void;
  onBack: () => void;
}) {
  return (
    <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
      <CardHeader className="mb-4 p-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to tracks">
              <ChevronLeft size={16} />
            </Button>
            <div>
              <CardTitle>Modules</CardTitle>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                In <span className="text-white">{track?.title ?? "this track"}</span>
              </p>
            </div>
          </div>
          <Button onClick={onCreate}>
            <Plus size={16} className="mr-1" /> New Module
          </Button>
        </div>
      </CardHeader>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      )}

      {isError && <QueryError onRetry={onRetry} />}

      {!isLoading && !isError && modules.length === 0 && (
        <EmptyState
          eyebrow="First step"
          title="No modules yet"
          description="Add modules to organize lessons within this track."
          actionLabel="Create module"
          onAction={onCreate}
        />
      )}

      <div className="space-y-3">
        {modules.map((mod, i) => (
          <div
            key={mod._id}
            className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/5 p-4 transition hover:border-primary/40 hover:bg-white/10"
          >
            <button
              type="button"
              onClick={() => onSelectModule(mod._id)}
              className="flex flex-1 items-center gap-4 text-left"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <FolderOpen size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">{mod.title}</p>
                {mod.description && (
                  <p className="mt-0.5 text-xs text-[var(--text-muted)] line-clamp-1">{mod.description}</p>
                )}
                <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <Hash size={11} /> Order {mod.order ?? i + 1}
                  </span>
                </div>
              </div>
            </button>
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon" onClick={() => onEdit(mod)} aria-label={`Edit ${mod.title}`}>
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(mod)}
                aria-label={`Delete ${mod.title}`}
                className="hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 size={14} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onSelectModule(mod._id)} aria-label="Open lessons">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────── Lessons view ───────────────────────────

function LessonsView({
  module: mod,
  lessons,
  isLoading,
  isError,
  onRetry,
  onCreate,
  onEdit,
  onDelete,
  onBack,
}: {
  module: Module | undefined;
  lessons: Lesson[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onCreate: () => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onBack: () => void;
}) {
  return (
    <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
      <CardHeader className="mb-4 p-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to modules">
              <ChevronLeft size={16} />
            </Button>
            <div>
              <CardTitle>Lessons</CardTitle>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                In <span className="text-white">{mod?.title ?? "this module"}</span>
              </p>
            </div>
          </div>
          <Button onClick={onCreate}>
            <Plus size={16} className="mr-1" /> New Lesson
          </Button>
        </div>
      </CardHeader>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      )}

      {isError && <QueryError onRetry={onRetry} />}

      {!isLoading && !isError && lessons.length === 0 && (
        <EmptyState
          eyebrow="Content"
          title="No lessons yet"
          description="Create lessons to build the learning content for this module."
          actionLabel="Create lesson"
          onAction={onCreate}
        />
      )}

      <div className="space-y-3">
        {lessons.map((lesson, i) => (
          <div
            key={lesson._id}
            className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/5 p-4 transition hover:border-primary/40 hover:bg-white/10"
          >
            <div className="flex flex-1 items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">{lesson.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <Hash size={11} /> Order {lesson.order ?? i + 1}
                  </span>
                  {lesson.xpReward ? (
                    <span className="inline-flex items-center gap-1">
                      <Award size={11} /> {lesson.xpReward} XP
                    </span>
                  ) : null}
                  {lesson.durationMinutes ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {lesson.durationMinutes} min
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon" onClick={() => onEdit(lesson)} aria-label={`Edit ${lesson.title}`}>
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(lesson)}
                aria-label={`Delete ${lesson.title}`}
                className="hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────── Form dialogs ───────────────────────────

function FormDialogShell({
  open,
  title,
  description,
  onClose,
  loading,
  onSubmit,
  submitLabel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[9998] m-auto w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-0 text-white shadow-xl backdrop:bg-black/60 max-h-[90vh] overflow-hidden"
    >
      <form onSubmit={onSubmit} className="flex max-h-[90vh] flex-col">
        <div className="flex items-start justify-between border-b border-[var(--border)] p-5">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white"
            aria-label="Close"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">{children}</div>
        <div className="flex justify-end gap-3 border-t border-[var(--border)] bg-white/[0.02] p-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

const NumberField = ({
  id,
  label,
  value,
  onChange,
  min,
  description,
  required,
}: {
  id: string;
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  min?: number;
  description?: string;
  required?: boolean;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-white">
      {label}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </label>
    <Input
      id={id}
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      className="h-10"
    />
    {description && <p className="text-xs text-[var(--text-secondary)]">{description}</p>}
  </div>
);

function TrackFormDialog({
  open,
  track,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  track: Track | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<Track>) => void;
}) {
  if (!open) return null;
  return (
    <TrackFormDialogBody
      key={track?._id ?? "new"}
      open={open}
      track={track}
      loading={loading}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function TrackFormDialogBody({
  open,
  track,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  track: Track | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<Track>) => void;
}) {
  const [title, setTitle] = useState(track?.title ?? "");
  const [description, setDescription] = useState(track?.description ?? "");
  const [category, setCategory] = useState(track?.category ?? "beginner");
  const [xpReward, setXpReward] = useState<number | "">(track?.xpReward ?? 500);
  const [estimatedWeeks, setEstimatedWeeks] = useState<number | "">(track?.estimatedWeeks ?? "");
  const [isActive, setIsActive] = useState(track?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      setError("Title must be at least 2 characters");
      return;
    }
    setError(null);
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category: category as Track["category"],
      xpReward: xpReward === "" ? undefined : Number(xpReward),
      estimatedWeeks: estimatedWeeks === "" ? undefined : Number(estimatedWeeks),
      isActive,
    });
  };

  return (
    <FormDialogShell
      open={open}
      title={track ? "Edit track" : "New track"}
      description="Tracks are the top-level learning programs your students follow."
      onClose={onClose}
      loading={loading}
      submitLabel={track ? "Save changes" : "Create track"}
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <label htmlFor="track-title" className="block text-sm font-medium text-white">
          Title <span className="text-danger">*</span>
        </label>
        <Input
          id="track-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. AI & Machine Learning"
          autoFocus
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="track-description" className="block text-sm font-medium text-white">
          Description
        </label>
        <Textarea
          id="track-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What students will learn in this track…"
          rows={3}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="track-category" className="block text-sm font-medium text-white">
            Category
          </label>
          <select
            id="track-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 text-sm text-white focus:border-[var(--border-focus)] focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <NumberField
          id="track-xp"
          label="XP reward"
          value={xpReward}
          onChange={setXpReward}
          min={0}
          description="Awarded on completion"
        />
        <NumberField
          id="track-weeks"
          label="Estimated weeks"
          value={estimatedWeeks}
          onChange={setEstimatedWeeks}
          min={1}
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-white">Status</label>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`flex h-11 w-full items-center justify-between rounded-xl border px-4 text-sm transition-colors ${
              isActive
                ? "border-success/40 bg-success/10 text-success"
                : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)]"
            }`}
            aria-pressed={isActive}
          >
            <span className="inline-flex items-center gap-2">
              <Clock size={14} /> {isActive ? "Active" : "Draft"}
            </span>
            <span className="text-xs">{isActive ? "Visible to students" : "Hidden from students"}</span>
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </FormDialogShell>
  );
}

function ModuleFormDialog({
  open,
  module: mod,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  module: Module | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<Module>) => void;
}) {
  if (!open) return null;
  return (
    <ModuleFormDialogBody
      key={mod?._id ?? "new"}
      open={open}
      mod={mod}
      loading={loading}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function ModuleFormDialogBody({
  open,
  mod,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mod: Module | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<Module>) => void;
}) {
  const [title, setTitle] = useState(mod?.title ?? "");
  const [description, setDescription] = useState(mod?.description ?? "");
  const [order, setOrder] = useState<number | "">(mod?.order ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      setError("Title must be at least 2 characters");
      return;
    }
    setError(null);
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      order: order === "" ? undefined : Number(order),
    });
  };

  return (
    <FormDialogShell
      open={open}
      title={mod ? "Edit module" : "New module"}
      description="Modules group related lessons within a track."
      onClose={onClose}
      loading={loading}
      submitLabel={mod ? "Save changes" : "Create module"}
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <label htmlFor="mod-title" className="block text-sm font-medium text-white">
          Title <span className="text-danger">*</span>
        </label>
        <Input
          id="mod-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Introduction to Neural Networks"
          autoFocus
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="mod-description" className="block text-sm font-medium text-white">
          Description
        </label>
        <Textarea
          id="mod-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this module covers…"
          rows={3}
        />
      </div>
      <NumberField
        id="mod-order"
        label="Order"
        value={order}
        onChange={setOrder}
        min={0}
        description="Lower numbers appear first"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </FormDialogShell>
  );
}

function LessonFormDialog({
  open,
  lesson,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  lesson: Lesson | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<Lesson>) => void;
}) {
  if (!open) return null;
  return (
    <LessonFormDialogBody
      key={lesson?._id ?? "new"}
      open={open}
      lesson={lesson}
      loading={loading}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function LessonFormDialogBody({
  open,
  lesson,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  lesson: Lesson | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<Lesson>) => void;
}) {
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [content, setContent] = useState(lesson?.content ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? "");
  const [codeSandboxUrl, setCodeSandboxUrl] = useState(lesson?.codeSandboxUrl ?? "");
  const [xpReward, setXpReward] = useState<number | "">(lesson?.xpReward ?? 40);
  const [durationMinutes, setDurationMinutes] = useState<number | "">(lesson?.durationMinutes ?? "");
  const [order, setOrder] = useState<number | "">(lesson?.order ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      setError("Title must be at least 2 characters");
      return;
    }
    const urlFields: Array<[string, string]> = [
      ["Video URL", videoUrl],
      ["Code sandbox URL", codeSandboxUrl],
    ];
    for (const [name, value] of urlFields) {
      if (value && !/^https?:\/\//.test(value)) {
        setError(`${name} must start with http:// or https://`);
        return;
      }
    }
    setError(null);
    onSubmit({
      title: title.trim(),
      content: content.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      codeSandboxUrl: codeSandboxUrl.trim() || undefined,
      xpReward: xpReward === "" ? undefined : Number(xpReward),
      durationMinutes: durationMinutes === "" ? undefined : Number(durationMinutes),
      order: order === "" ? undefined : Number(order),
    });
  };

  return (
    <FormDialogShell
      open={open}
      title={lesson ? "Edit lesson" : "New lesson"}
      description="Lessons are the individual units of learning inside a module."
      onClose={onClose}
      loading={loading}
      submitLabel={lesson ? "Save changes" : "Create lesson"}
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <label htmlFor="lesson-title" className="block text-sm font-medium text-white">
          Title <span className="text-danger">*</span>
        </label>
        <Input
          id="lesson-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. What is a Tensor?"
          autoFocus
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="lesson-content" className="block text-sm font-medium text-white">
          Content
        </label>
        <Textarea
          id="lesson-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Lesson body, instructions, or notes…"
          rows={5}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="lesson-video" className="block text-sm font-medium text-white">
            Video URL
          </label>
          <Input
            id="lesson-video"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="lesson-sandbox" className="block text-sm font-medium text-white">
            Code sandbox URL
          </label>
          <Input
            id="lesson-sandbox"
            value={codeSandboxUrl}
            onChange={(e) => setCodeSandboxUrl(e.target.value)}
            placeholder="https://codesandbox.io/…"
          />
        </div>
        <NumberField id="lesson-xp" label="XP reward" value={xpReward} onChange={setXpReward} min={0} />
        <NumberField
          id="lesson-duration"
          label="Duration (minutes)"
          value={durationMinutes}
          onChange={setDurationMinutes}
          min={1}
        />
        <NumberField
          id="lesson-order"
          label="Order"
          value={order}
          onChange={setOrder}
          min={0}
          description="Lower numbers appear first"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </FormDialogShell>
  );
}

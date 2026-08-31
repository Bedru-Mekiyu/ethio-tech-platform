import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/components/composites/ToastProvider";
import { ConfirmDialog } from "@/components/composites/ConfirmDialog";
import { TrackSidebar } from "./content/TrackSidebar";
import { ModuleLessonTree } from "./content/ModuleLessonTree";
import { ContentEditorPane } from "./content/ContentEditorPane";
import type {
  Track,
  Module,
  Lesson,
  CapstoneProjectItem,
  ContentSelection,
} from "./content/types";
import { cn } from "@/lib/utils";

const unwrap = <T,>(payload: unknown, key: string): T => {
  const p = payload as { data?: Record<string, T> } & Record<string, T>;
  return (p?.data?.[key] ?? p?.[key]) as T;
};

interface DeleteConfirmTarget {
  type: "track" | "module" | "lesson" | "capstone";
  id: string;
  name: string;
}

export function AdminContentPage() {
  usePageTitle("Curriculum Management");
  const toast = useToast();
  const queryClient = useQueryClient();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");

  // Selection State (defaults to track view, falls back to first track once loaded)
  const [selection, setSelection] = useState<ContentSelection>({ type: "track", trackId: "" });

  // Delete Target Dialog State
  const [deleteTarget, setDeleteTarget] = useState<DeleteConfirmTarget | null>(null);

  // Mobile View Navigation Tab
  const [mobileTab, setMobileTab] = useState<"tracks" | "tree" | "editor">("tracks");

  // =========================================================================
  // Queries
  // =========================================================================
  const tracksQuery = useQuery({
    queryKey: ["admin", "tracks"],
    queryFn: async () => {
      const { data } = await api.get("/tracks");
      return unwrap<Track[]>(data, "tracks") || [];
    },
  });

  const tracks = tracksQuery.data ?? [];

  // Determine current active trackId from selection
  const currentTrackId = useMemo(() => {
    if (selection.type === "new-track") return null;
    if (selection.type === "track") return selection.trackId || tracks[0]?._id || null;
    if (selection.type === "module" || selection.type === "lesson") return selection.trackId;
    if (selection.type === "new-module" || selection.type === "new-lesson") return selection.trackId;
    return tracks[0]?._id ?? null;
  }, [selection, tracks]);

  const selectedTrack = useMemo(() => {
    if (selection.type === "new-track") return null;
    return tracks.find((t) => t._id === currentTrackId) ?? null;
  }, [tracks, currentTrackId, selection.type]);

  // Modules Query for selected track
  const modulesQuery = useQuery({
    queryKey: ["admin", "modules", currentTrackId],
    queryFn: async () => {
      if (!currentTrackId) return [];
      const { data } = await api.get(`/modules?track=${currentTrackId}`);
      return unwrap<Module[]>(data, "modules") || [];
    },
    enabled: !!currentTrackId,
  });

  const modules = modulesQuery.data ?? [];

  // Capstone Projects Query for selected track
  const capstonesQuery = useQuery({
    queryKey: ["admin", "projects", currentTrackId],
    queryFn: async () => {
      if (!currentTrackId) return [];
      const { data } = await api.get(`/projects?track=${currentTrackId}`);
      const unwrapped = unwrap<CapstoneProjectItem[]>(data, "items");
      return unwrapped || [];
    },
    enabled: !!currentTrackId,
  });

  const capstoneProjects = capstonesQuery.data ?? [];

  // Lessons Query for each module in this track
  const moduleIds = useMemo(() => modules.map((m) => m._id), [modules]);

  const lessonsQuery = useQuery({
    queryKey: ["admin", "all-lessons", currentTrackId, moduleIds.join(",")],
    queryFn: async () => {
      if (moduleIds.length === 0) return {};
      const results = await Promise.all(
        moduleIds.map(async (modId) => {
          try {
            const { data } = await api.get(`/lessons?module=${modId}`);
            const list = unwrap<Lesson[]>(data, "lessons") || [];
            return { modId, list };
          } catch {
            return { modId, list: [] };
          }
        })
      );
      const record: Record<string, Lesson[]> = {};
      for (const item of results) {
        record[item.modId] = item.list;
      }
      return record;
    },
    enabled: moduleIds.length > 0,
  });

  const lessonsByModule = lessonsQuery.data ?? {};

  // Selected Module & Selected Lesson helpers
  const selectedModule = useMemo(() => {
    if (selection.type === "module" || selection.type === "new-lesson") {
      return modules.find((m) => m._id === selection.moduleId) ?? null;
    }
    if (selection.type === "lesson") {
      return modules.find((m) => m._id === selection.moduleId) ?? null;
    }
    return null;
  }, [selection, modules]);

  const selectedLesson = useMemo(() => {
    if (selection.type === "lesson") {
      const list = lessonsByModule[selection.moduleId] || [];
      return list.find((l) => l._id === selection.lessonId) ?? null;
    }
    return null;
  }, [selection, lessonsByModule]);

  // =========================================================================
  // Track Mutations
  // =========================================================================
  const saveTrackMutation = useMutation({
    mutationFn: async (payload: Partial<Track>) => {
      if (selection.type === "track" && selection.trackId) {
        const { data } = await api.patch<ApiResponse<{ track: Track }>>(
          `/tracks/${selection.trackId}`,
          payload
        );
        return data.data.track;
      }
      const { data } = await api.post<ApiResponse<{ track: Track }>>("/tracks", payload);
      return data.data.track;
    },
    onSuccess: (savedTrack) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      toast.success(selection.type === "track" ? "Track updated successfully" : "Track created successfully");
      if (savedTrack?._id) {
        setSelection({ type: "track", trackId: savedTrack._id });
      }
    },
    onError: (err: unknown) => {
      const msg = extractError(err, "Failed to save track");
      toast.error(msg);
    },
  });

  const deleteTrackMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tracks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      toast.success("Track deleted successfully");
      setDeleteTarget(null);
      setSelection({ type: "new-track" });
    },
    onError: (err: unknown) => {
      toast.error(extractError(err, "Failed to delete track"));
    },
  });

  // =========================================================================
  // Module Mutations
  // =========================================================================
  const saveModuleMutation = useMutation({
    mutationFn: async (payload: Partial<Module>) => {
      if (selection.type === "module" && selection.moduleId) {
        const { data } = await api.patch<ApiResponse<{ module: Module }>>(
          `/modules/${selection.moduleId}`,
          payload
        );
        return data.data.module;
      }
      const { data } = await api.post<ApiResponse<{ module: Module }>>("/modules", payload);
      return data.data.module;
    },
    onSuccess: (savedMod) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "modules", currentTrackId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      toast.success(selection.type === "module" ? "Module updated" : "Module created");
      if (savedMod?._id && currentTrackId) {
        setSelection({ type: "module", trackId: currentTrackId, moduleId: savedMod._id });
      }
    },
    onError: (err: unknown) => {
      toast.error(extractError(err, "Failed to save module"));
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/modules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "modules", currentTrackId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      toast.success("Module deleted successfully");
      setDeleteTarget(null);
      if (currentTrackId) {
        setSelection({ type: "track", trackId: currentTrackId });
      }
    },
    onError: (err: unknown) => {
      toast.error(extractError(err, "Failed to delete module"));
    },
  });

  // Module Reorder Mutation
  const reorderModule = async (moduleId: string, direction: "up" | "down") => {
    const sorted = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const index = sorted.findIndex((m) => m._id === moduleId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const currentMod = sorted[index];
    const targetMod = sorted[targetIndex];

    const currentOrder = currentMod.order ?? index + 1;
    const targetOrder = targetMod.order ?? targetIndex + 1;

    try {
      await Promise.all([
        api.patch(`/modules/${currentMod._id}`, { order: targetOrder }),
        api.patch(`/modules/${targetMod._id}`, { order: currentOrder }),
      ]);
      queryClient.invalidateQueries({ queryKey: ["admin", "modules", currentTrackId] });
      toast.success("Module order updated");
    } catch {
      toast.error("Failed to update module order");
    }
  };

  // =========================================================================
  // Lesson Mutations
  // =========================================================================
  const saveLessonMutation = useMutation({
    mutationFn: async (payload: Partial<Lesson>) => {
      if (selection.type === "lesson" && selection.lessonId) {
        const { data } = await api.patch<ApiResponse<{ lesson: Lesson }>>(
          `/lessons/${selection.lessonId}`,
          payload
        );
        return data.data.lesson;
      }
      const { data } = await api.post<ApiResponse<{ lesson: Lesson }>>("/lessons", payload);
      return data.data.lesson;
    },
    onSuccess: (savedLesson) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "all-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "modules", currentTrackId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      toast.success(selection.type === "lesson" ? "Lesson updated" : "Lesson created");
      if (savedLesson?._id && currentTrackId && savedLesson.module) {
        setSelection({
          type: "lesson",
          trackId: currentTrackId,
          moduleId: savedLesson.module,
          lessonId: savedLesson._id,
        });
      }
    },
    onError: (err: unknown) => {
      toast.error(extractError(err, "Failed to save lesson"));
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/lessons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "all-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "modules", currentTrackId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      toast.success("Lesson deleted successfully");
      setDeleteTarget(null);
      if (currentTrackId && selectedModule) {
        setSelection({ type: "module", trackId: currentTrackId, moduleId: selectedModule._id });
      }
    },
    onError: (err: unknown) => {
      toast.error(extractError(err, "Failed to delete lesson"));
    },
  });

  // Lesson Reorder Mutation
  const reorderLesson = async (moduleId: string, lessonId: string, direction: "up" | "down") => {
    const list = lessonsByModule[moduleId] || [];
    const sorted = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const index = sorted.findIndex((l) => l._id === lessonId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const currentLesson = sorted[index];
    const targetLesson = sorted[targetIndex];

    const currentOrder = currentLesson.order ?? index + 1;
    const targetOrder = targetLesson.order ?? targetIndex + 1;

    try {
      await Promise.all([
        api.patch(`/lessons/${currentLesson._id}`, { order: targetOrder }),
        api.patch(`/lessons/${targetLesson._id}`, { order: currentOrder }),
      ]);
      queryClient.invalidateQueries({ queryKey: ["admin", "all-lessons"] });
      toast.success("Lesson order updated");
    } catch {
      toast.error("Failed to update lesson order");
    }
  };

  // =========================================================================
  // Capstone Project Mutations
  // =========================================================================
  const saveCapstoneMutation = useMutation({
    mutationFn: async (payload: Partial<CapstoneProjectItem>) => {
      if (payload._id) {
        const { data } = await api.patch(`/projects/${payload._id}`, payload);
        return data;
      }
      const { data } = await api.post("/projects", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects", currentTrackId] });
      toast.success("Capstone project saved successfully");
    },
    onError: (err: unknown) => {
      toast.error(extractError(err, "Failed to save capstone project"));
    },
  });

  const deleteCapstoneMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects", currentTrackId] });
      toast.success("Capstone project deleted");
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      toast.error(extractError(err, "Failed to delete capstone project"));
    },
  });

  // =========================================================================
  // Handlers for Selection & Actions
  // =========================================================================
  const handleSelectTrack = (trackId: string) => {
    setSelection({ type: "track", trackId });
    setMobileTab("tree");
  };

  const handleCreateTrack = () => {
    setSelection({ type: "new-track" });
    setMobileTab("editor");
  };

  const handleAddModule = () => {
    if (!currentTrackId) return;
    setSelection({ type: "new-module", trackId: currentTrackId });
    setMobileTab("editor");
  };

  const handleAddLesson = (moduleId: string) => {
    if (!currentTrackId) return;
    setSelection({ type: "new-lesson", trackId: currentTrackId, moduleId });
    setMobileTab("editor");
  };

  const handleSelectHierarchy = (newSel: ContentSelection) => {
    setSelection(newSel);
    setMobileTab("editor");
  };

  const confirmDeleteAction = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "track") deleteTrackMutation.mutate(deleteTarget.id);
    if (deleteTarget.type === "module") deleteModuleMutation.mutate(deleteTarget.id);
    if (deleteTarget.type === "lesson") deleteLessonMutation.mutate(deleteTarget.id);
    if (deleteTarget.type === "capstone") deleteCapstoneMutation.mutate(deleteTarget.id);
  };

  const isSaving =
    saveTrackMutation.isPending ||
    saveModuleMutation.isPending ||
    saveLessonMutation.isPending ||
    saveCapstoneMutation.isPending;

  const isDeleting =
    deleteTrackMutation.isPending ||
    deleteModuleMutation.isPending ||
    deleteLessonMutation.isPending ||
    deleteCapstoneMutation.isPending;

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col overflow-hidden text-[var(--text-primary)]">
      {/* Top Banner Bar */}
      <div className="border-b border-[#27272A] bg-[#0E0E11] px-5 py-3.5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Curriculum Content Studio
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Master-detail hierarchical architect for learning tracks, modules, video lectures, and code labs.
            </p>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="flex sm:hidden items-center rounded-lg bg-[#141418] p-1 border border-[#27272A] text-xs">
            <button
              type="button"
              onClick={() => setMobileTab("tracks")}
              className={cn(
                "flex-1 py-1 px-2.5 rounded-md font-medium transition-all text-center",
                mobileTab === "tracks" ? "bg-violet-600 text-white" : "text-zinc-400"
              )}
            >
              Tracks
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("tree")}
              className={cn(
                "flex-1 py-1 px-2.5 rounded-md font-medium transition-all text-center",
                mobileTab === "tree" ? "bg-violet-600 text-white" : "text-zinc-400"
              )}
            >
              Curriculum
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("editor")}
              className={cn(
                "flex-1 py-1 px-2.5 rounded-md font-medium transition-all text-center",
                mobileTab === "editor" ? "bg-violet-600 text-white" : "text-zinc-400"
              )}
            >
              Editor
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Pane Master Detail Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
        {/* Left Pane: Track Sidebar (3 Cols on desktop) */}
        <div
          className={cn(
            "md:col-span-3 h-full overflow-hidden",
            mobileTab === "tracks" ? "block" : "hidden md:block"
          )}
        >
          <TrackSidebar
            tracks={tracks}
            selectedTrackId={currentTrackId}
            onSelectTrack={handleSelectTrack}
            onCreateTrack={handleCreateTrack}
            isLoading={tracksQuery.isLoading}
            search={search}
            onSearchChange={setSearch}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        {/* Middle Pane: Module & Lesson Tree (4 Cols on desktop) */}
        <div
          className={cn(
            "md:col-span-4 h-full overflow-hidden",
            mobileTab === "tree" ? "block" : "hidden md:block"
          )}
        >
          <ModuleLessonTree
            track={selectedTrack}
            modules={modules}
            lessonsByModule={lessonsByModule}
            selection={selection}
            onSelect={handleSelectHierarchy}
            onAddModule={handleAddModule}
            onAddLesson={handleAddLesson}
            onDeleteModule={(mod) =>
              setDeleteTarget({ type: "module", id: mod._id, name: mod.title })
            }
            onDeleteLesson={(les) =>
              setDeleteTarget({ type: "lesson", id: les._id, name: les.title })
            }
            onReorderModule={reorderModule}
            onReorderLesson={reorderLesson}
            isLoading={modulesQuery.isLoading}
          />
        </div>

        {/* Right Pane: Content Editor Pane (5 Cols on desktop) */}
        <div
          className={cn(
            "md:col-span-5 h-full overflow-hidden",
            mobileTab === "editor" ? "block" : "hidden md:block"
          )}
        >
          <ContentEditorPane
            selection={selection}
            selectedTrack={selectedTrack}
            selectedModule={selectedModule}
            selectedLesson={selectedLesson}
            capstoneProjects={capstoneProjects}
            onSaveTrack={async (data) => {
              await saveTrackMutation.mutateAsync(data);
            }}
            onSaveModule={async (data) => {
              await saveModuleMutation.mutateAsync(data);
            }}
            onSaveLesson={async (data) => {
              await saveLessonMutation.mutateAsync(data);
            }}
            onDeleteTrack={(tr) =>
              setDeleteTarget({ type: "track", id: tr._id, name: tr.title })
            }
            onDeleteModule={(mod) =>
              setDeleteTarget({ type: "module", id: mod._id, name: mod.title })
            }
            onDeleteLesson={(les) =>
              setDeleteTarget({ type: "lesson", id: les._id, name: les.title })
            }
            onSaveCapstoneProject={(proj) => {
              saveCapstoneMutation.mutate(proj);
            }}
            onDeleteCapstoneProject={(projId) =>
              setDeleteTarget({ type: "capstone", id: projId, name: "Capstone Project" })
            }
            isSaving={isSaving}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.type ?? "Item"}?`}
        description={
          deleteTarget
            ? `"${deleteTarget.name}" and all associated nested curriculum resources will be permanently removed. This action cannot be reversed.`
            : ""
        }
        confirmLabel="Delete Permanently"
        variant="danger"
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteAction}
      />
    </div>
  );
}

function extractError(err: unknown, fallback: string): string {
  if (typeof err === "object" && err) {
    const e = err as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    };
    return e.response?.data?.message ?? e.response?.data?.error ?? e.message ?? fallback;
  }
  return fallback;
}

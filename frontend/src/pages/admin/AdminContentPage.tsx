import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { useToast } from "@/components/composites/ToastProvider";
import {
  BookOpen,
  FolderOpen,
  FileText,
  Plus,
  ChevronRight,
  Search,
} from "lucide-react";

interface Track {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  xpReward?: number;
  estimatedWeeks?: number;
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
  module: string;
  order?: number;
  xpReward?: number;
  durationMinutes?: number;
}

type ContentView = "tracks" | "modules" | "lessons";

export function AdminContentPage() {
  usePageTitle("Content Management");
  const toast = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ContentView>("tracks");
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // --- Queries ---
  const tracksQuery = useQuery({
    queryKey: ["admin", "tracks"],
    queryFn: async () => {
      const { data } = await api.get("/tracks");
      return (data.data?.tracks ?? data.tracks ?? []) as Track[];
    },
  });

  const modulesQuery = useQuery({
    queryKey: ["admin", "modules", selectedTrackId],
    queryFn: async () => {
      const { data } = await api.get(`/modules?track=${selectedTrackId}`);
      return (data.data?.modules ?? data.modules ?? []) as Module[];
    },
    enabled: !!selectedTrackId,
  });

  const lessonsQuery = useQuery({
    queryKey: ["admin", "lessons", selectedModuleId],
    queryFn: async () => {
      const { data } = await api.get(`/lessons?module=${selectedModuleId}`);
      return (data.data?.lessons ?? data.lessons ?? []) as Lesson[];
    },
    enabled: !!selectedModuleId,
  });

  // --- Mutations ---
  const createTrackMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/tracks", {
        title: `New Track ${Date.now().toString(36)}`,
        category: "beginner",
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      toast.success("Track created");
    },
    onError: () => toast.error("Failed to create track"),
  });

  const createModuleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTrackId) return;
      const { data } = await api.post("/modules", {
        title: `New Module ${Date.now().toString(36)}`,
        track: selectedTrackId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "modules", selectedTrackId] });
      toast.success("Module created");
    },
    onError: () => toast.error("Failed to create module"),
  });

  const createLessonMutation = useMutation({
    mutationFn: async () => {
      if (!selectedModuleId) return;
      const { data } = await api.post("/lessons", {
        title: `New Lesson ${Date.now().toString(36)}`,
        module: selectedModuleId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons", selectedModuleId] });
      toast.success("Lesson created");
    },
    onError: () => toast.error("Failed to create lesson"),
  });

  // --- Helpers ---
  const tracks = tracksQuery.data ?? [];
  const modules = modulesQuery.data ?? [];
  const lessons = lessonsQuery.data ?? [];

  const filteredTracks = search
    ? tracks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : tracks;

  const handleSelectTrack = (id: string) => {
    setSelectedTrackId(id);
    setSelectedModuleId(null);
    setView("modules");
  };

  const handleSelectModule = (id: string) => {
    setSelectedModuleId(id);
    setView("lessons");
  };

  const selectedTrack = tracks.find((t) => t._id === selectedTrackId);
  const selectedModule = modules.find((m) => m._id === selectedModuleId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <Badge className="mb-3">Content management</Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Curriculum Builder
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Manage tracks, modules, and lessons. Build the learning infrastructure
          for Ethiopia&apos;s next generation of engineers.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <button
          type="button"
          onClick={() => { setView("tracks"); setSelectedTrackId(null); setSelectedModuleId(null); }}
          className="hover:text-white"
        >
          Tracks
        </button>
        {selectedTrack && (
          <>
            <ChevronRight size={14} />
            <button
              type="button"
              onClick={() => { setView("modules"); setSelectedModuleId(null); }}
              className="hover:text-white"
            >
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

      {/* Tracks View */}
      {view === "tracks" && (
        <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="mb-4 p-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Learning Tracks</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    placeholder="Search tracks…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={() => createTrackMutation.mutate()}
                  disabled={createTrackMutation.isPending}
                >
                  <Plus size={16} className="mr-1" /> New Track
                </Button>
              </div>
            </div>
          </CardHeader>

          {tracksQuery.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          )}

          {tracksQuery.isError && <QueryError onRetry={() => tracksQuery.refetch()} />}

          {!tracksQuery.isLoading && !tracksQuery.isError && filteredTracks.length === 0 && (
            <EmptyState
              title="No tracks yet"
              description="Create your first learning track to start building the curriculum."
            />
          )}

          <div className="space-y-3">
            {filteredTracks.map((track) => (
              <button
                key={track._id}
                type="button"
                onClick={() => handleSelectTrack(track._id)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/5 p-4 text-left transition hover:border-primary/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{track.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Badge variant={track.isActive !== false ? "success" : "default"}>
                        {track.isActive !== false ? "Active" : "Draft"}
                      </Badge>
                      {track.category && <span className="uppercase">{track.category}</span>}
                      {track.xpReward ? <span>{track.xpReward} XP</span> : null}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[var(--text-muted)]" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Modules View */}
      {view === "modules" && selectedTrackId && (
        <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="mb-4 p-0">
            <div className="flex items-center justify-between">
              <CardTitle>Modules in {selectedTrack?.title}</CardTitle>
              <Button
                onClick={() => createModuleMutation.mutate()}
                disabled={createModuleMutation.isPending}
              >
                <Plus size={16} className="mr-1" /> New Module
              </Button>
            </div>
          </CardHeader>

          {modulesQuery.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          )}

          {!modulesQuery.isLoading && modules.length === 0 && (
            <EmptyState
              title="No modules yet"
              description="Add modules to organize lessons within this track."
            />
          )}

          <div className="space-y-3">
            {modules.map((mod, i) => (
              <button
                key={mod._id}
                type="button"
                onClick={() => handleSelectModule(mod._id)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/5 p-4 text-left transition hover:border-primary/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <FolderOpen size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{mod.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">Order: {mod.order ?? i + 1}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[var(--text-muted)]" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Lessons View */}
      {view === "lessons" && selectedModuleId && (
        <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="mb-4 p-0">
            <div className="flex items-center justify-between">
              <CardTitle>Lessons in {selectedModule?.title}</CardTitle>
              <Button
                onClick={() => createLessonMutation.mutate()}
                disabled={createLessonMutation.isPending}
              >
                <Plus size={16} className="mr-1" /> New Lesson
              </Button>
            </div>
          </CardHeader>

          {lessonsQuery.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          )}

          {!lessonsQuery.isLoading && lessons.length === 0 && (
            <EmptyState
              title="No lessons yet"
              description="Create lessons to build the learning content for this module."
            />
          )}

          <div className="space-y-3">
            {lessons.map((lesson, i) => (
              <div
                key={lesson._id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/5 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{lesson.title}</p>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span>Order: {lesson.order ?? i + 1}</span>
                      {lesson.xpReward ? <span>{lesson.xpReward} XP</span> : null}
                      {lesson.durationMinutes ? <span>{lesson.durationMinutes} min</span> : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

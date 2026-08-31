import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, ChevronLeft, ChevronRight, Video, X } from "lucide-react";
import { createSession, fetchSessions } from "@/services/sessionsService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { useToast } from "@/components/composites/ToastProvider";
import { cn } from "@/lib/utils";

type SessionRow = {
  _id?: string;
  title?: string;
  scheduledAt?: string;
  status?: string;
  maxParticipants?: number;
  participants?: unknown[];
};

function SessionsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-[28px]" />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Skeleton className="h-[34rem] rounded-[28px]" />
        <Skeleton className="h-[34rem] rounded-[28px]" />
      </div>
    </div>
  );
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function MentorSessionsPage() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [cursor, setCursor] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["sessions"], queryFn: fetchSessions });

  const [defaultScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const createMutation = useMutation({
    mutationFn: createSession,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success(`Session "${session.title ?? "Untitled"}" created`);
      setCreateOpen(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to create session");
    },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (createOpen && !dialog.open) dialog.showModal();
    if (!createOpen && dialog.open) dialog.close();
  }, [createOpen]);

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
    const durationMinutes = Number(formData.get("durationMinutes") ?? 60);
    const description = String(formData.get("description") ?? "").trim();
    if (!title || !scheduledAt) {
      toast.error("Title and date are required");
      return;
    }
    createMutation.mutate({
      title,
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes,
      description: description || undefined,
    });
  };

  const sessions = useMemo(() => (Array.isArray(data) ? data : []) as SessionRow[], [data]);
  const filtered = useMemo(() => {
    return sessions.filter((session) => {
      const date = session.scheduledAt ? new Date(session.scheduledAt) : new Date();
      const upcoming = date >= new Date();
      if (filter === "upcoming") return upcoming;
      if (filter === "past") return !upcoming;
      return true;
    });
  }, [filter, sessions]);

  const upcoming = useMemo(
    () => filtered.filter((session) => session.scheduledAt && new Date(session.scheduledAt) >= new Date()),
    [filtered],
  );

  const past = useMemo(
    () => filtered.filter((session) => session.scheduledAt && new Date(session.scheduledAt) < new Date()),
    [filtered],
  );

  const calendarDays = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const offset = start.getDay();
    const days: Array<Date | null> = [];
    for (let i = 0; i < offset; i += 1) days.push(null);
    for (let day = 1; day <= end.getDate(); day += 1) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    return days;
  }, [cursor]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, SessionRow[]>();
    sessions.forEach((session) => {
      if (!session.scheduledAt) return;
      const key = new Date(session.scheduledAt).toDateString();
      map.set(key, [...(map.get(key) ?? []), session]);
    });
    return map;
  }, [sessions]);

  if (isLoading) return <SessionsSkeleton />;
  if (isError) {
    return (
      <QueryError
        message={error instanceof Error ? error.message : "Unable to load sessions."}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      <div className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Session Management</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Schedule live classes, track attendance, and launch virtual classrooms from a calm schedule view.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5 text-xs font-medium shrink-0">
            <Calendar size={14} />
            Create Session
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[#27272A] bg-[#0E0E11] p-4">
          <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Upcoming sessions</p>
          <p className="mt-1.5 text-xl font-bold text-white">{upcoming.length}</p>
        </Card>
        <Card className="border-[#27272A] bg-[#0E0E11] p-4">
          <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Past sessions</p>
          <p className="mt-1.5 text-xl font-bold text-white">{past.length}</p>
        </Card>
        <Card className="border-[#27272A] bg-[#0E0E11] p-4">
          <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Total sessions</p>
          <p className="mt-1.5 text-xl font-bold text-white">{sessions.length}</p>
        </Card>
        <Card className="border-[#27272A] bg-[#0E0E11] p-4">
          <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Fill rate</p>
          <p className="mt-1.5 text-xl font-bold text-emerald-400">
            {sessions.length
              ? Math.round(
                  (sessions.filter((session) => (session.participants?.length ?? 0) > 0).length / sessions.length) *
                    100,
                )
              : 0}
            %
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">Enrolled learners ratio</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "upcoming", "past"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-md border px-3 py-1 text-xs capitalize transition-all font-medium",
              filter === value
                ? "border-indigo-500 bg-indigo-600 text-white"
                : "border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#27272A] pb-3.5">
            <div>
              <h2 className="text-sm font-semibold text-white">{monthLabel(cursor)}</h2>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCursor((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCursor((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, index) => {
              const sessionsForDay = day ? (sessionsByDay.get(day.toDateString()) ?? []) : [];
              const isToday = day ? day.toDateString() === new Date().toDateString() : false;
              return (
                <div
                  key={day ? day.toDateString() : `blank-${index}`}
                  className={cn(
                    "min-h-[4.75rem] rounded-lg border p-1.5 transition-colors",
                    day ? "border-[#27272A] bg-[#141418]" : "border-transparent bg-transparent",
                    isToday && "border-indigo-500/40 bg-indigo-500/10",
                  )}
                >
                  {day ? (
                    <>
                      <p className="text-xs font-semibold text-zinc-300">{day.getDate()}</p>
                      <div className="mt-1 space-y-1">
                        {sessionsForDay.slice(0, 2).map((session, index) => (
                          <div
                            key={session._id ?? `${session.title}-${index}`}
                            className="rounded bg-indigo-500/15 px-1.5 py-0.5 text-[9px] font-medium text-indigo-300 truncate"
                          >
                            {session.title}
                          </div>
                        ))}
                        {sessionsForDay.length > 2 ? (
                          <p className="text-[9px] text-zinc-500">+{sessionsForDay.length - 2} more</p>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#27272A] pb-3.5">
            <div>
              <h2 className="text-sm font-semibold text-white">Live Session Queue</h2>
              <p className="text-xs text-zinc-400">Scheduled interactive classrooms</p>
            </div>
            <Link to="/app/workspace" className="text-xs font-medium text-indigo-400 hover:underline">
              Open workspace →
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {filtered.slice(0, 5).length ? (
              filtered.slice(0, 5).map((session, index) => {
                const participantCount = Array.isArray(session.participants) ? session.participants.length : 0;
                return (
                  <div
                    key={session._id ?? `${session.title}-${index}`}
                    className="rounded-lg border border-[#27272A] bg-[#141418] p-3.5 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{session.title}</p>
                        <p className="text-[11px] text-zinc-400">
                          {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "TBD"}
                        </p>
                      </div>
                      <Badge variant={session.status === "completed" ? "success" : "purple"} size="sm">
                        {session.status ?? "scheduled"}
                      </Badge>
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>
                          {participantCount}
                          {session.maxParticipants
                            ? ` / ${session.maxParticipants} seats filled`
                            : " learners enrolled"}
                        </span>
                        {session._id ? (
                          <Link
                            to={`/app/classroom/${session._id}`}
                            className="inline-flex items-center gap-1 font-medium text-indigo-400 hover:text-indigo-300"
                          >
                            Launch Room <Video size={12} />
                          </Link>
                        ) : null}
                      </div>
                      {session.maxParticipants && session.maxParticipants > 0 ? (
                        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              participantCount >= session.maxParticipants
                                ? "bg-red-500"
                                : participantCount / session.maxParticipants > 0.8
                                  ? "bg-amber-500"
                                  : "bg-indigo-500",
                            )}
                            style={{ width: `${Math.min(100, (participantCount / session.maxParticipants) * 100)}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title="No sessions found" description="Try another filter or create a new session." />
            )}
          </div>
        </Card>
      </div>

      {createOpen ? (
        <dialog
          ref={dialogRef}
          className="fixed inset-0 z-[9998] m-auto w-full max-w-md rounded-xl border border-[#27272A] bg-[#0E0E11] p-0 text-white shadow-2xl backdrop:bg-black/60"
        >
          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-[#27272A] pb-3">
              <div>
                <h2 className="text-sm font-bold text-white">Create New Session</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Schedule a live classroom session for your cohort.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="text-zinc-500 hover:text-white"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-zinc-400">Title</span>
                <Input name="title" required maxLength={120} className="mt-1 text-xs bg-[#141418] border-[#27272A] text-white" placeholder="e.g. Intro to Microservices & Docker" />
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400">Scheduled At</span>
                <Input
                  name="scheduledAt"
                  type="datetime-local"
                  required
                  className="mt-1 text-xs bg-[#141418] border-[#27272A] text-white"
                  defaultValue={defaultScheduledAt}
                />
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400">Duration (minutes)</span>
                <Input
                  name="durationMinutes"
                  type="number"
                  min={15}
                  max={600}
                  step={15}
                  defaultValue={60}
                  className="mt-1 text-xs bg-[#141418] border-[#27272A] text-white"
                />
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400">Description (optional)</span>
                <Input name="description" maxLength={500} className="mt-1 text-xs bg-[#141418] border-[#27272A] text-white" placeholder="What will learners build?" />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#27272A]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
                disabled={createMutation.isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending} className="text-xs font-medium">
                {createMutation.isPending ? "Creating…" : "Create Session"}
              </Button>
            </div>
          </form>
        </dialog>
      ) : null}
    </div>
  );
}

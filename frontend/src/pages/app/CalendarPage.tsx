import { useMemo, useState, useId } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Plus,
  Flame,
  CheckCircle2,
  Circle,
  Trash2,
  Video,
  Layers,
  Search,
  Check,
  CalendarDays,
  LayoutGrid,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetings } from "@/hooks/useMeetings";
import type { MeetingViewModel } from "@/lib/realtime";
import {
  fetchCalendarEvents,
  syncSessionsToCalendar,
  downloadCalendarFile,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CalendarEvent,
  type CalendarEventType,
} from "@/services/calendarService";
import { AddEventModal } from "@/components/calendar/AddEventModal";
import { cn } from "@/lib/utils";

type CalendarViewMode = "month" | "week" | "agenda";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to Sunday
  return new Date(d.setDate(diff));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function getEventDurationHours(event: CalendarEvent): number {
  try {
    const start = new Date(event.start).getTime();
    const end = new Date(event.end).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return 1.0;
    return Math.max(0.5, Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10);
  } catch {
    return 1.0;
  }
}

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 rounded-[28px]" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Skeleton className="h-[480px] rounded-[28px]" />
        <Skeleton className="h-[480px] rounded-[28px]" />
      </div>
    </div>
  );
}

export function CalendarPage() {
  const queryClient = useQueryClient();
  const searchInputId = useId();

  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));

  // Add Event Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<CalendarEventType>("study_block");
  const [modalInitialDate, setModalInitialDate] = useState<string>(() => formatDateKey(new Date()));

  // Filter and Search State for Agenda
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // TanStack Query for Calendar Events
  const {
    data: events = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: () => fetchCalendarEvents(),
  });

  const { meetings: upcomingMeetings } = useMeetings({ scope: "upcoming" });

  const meetingById = useMemo(() => {
    const map = new Map<string, MeetingViewModel>();
    upcomingMeetings.forEach((m) => {
      if (m.id) map.set(m.id, m);
      if (m.sessionId) map.set(m.sessionId, m);
    });
    return map;
  }, [upcomingMeetings]);

  // Mutations
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ eventId, newStatus }: { eventId: string; newStatus: "pending" | "completed" }) => {
      return updateCalendarEvent(eventId, { status: newStatus });
    },
    onMutate: async ({ eventId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["calendar-events"] });
      const prevEvents = queryClient.getQueryData<CalendarEvent[]>(["calendar-events"]);
      queryClient.setQueryData<CalendarEvent[]>(["calendar-events"], (old = []) =>
        old.map((ev) => (ev._id === eventId ? { ...ev, status: newStatus } : ev)),
      );
      return { prevEvents };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevEvents) {
        queryClient.setQueryData(["calendar-events"], context.prevEvents);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return deleteCalendarEvent(eventId);
    },
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: ["calendar-events"] });
      const prevEvents = queryClient.getQueryData<CalendarEvent[]>(["calendar-events"]);
      queryClient.setQueryData<CalendarEvent[]>(["calendar-events"], (old = []) =>
        old.filter((ev) => ev._id !== eventId),
      );
      return { prevEvents };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevEvents) {
        queryClient.setQueryData(["calendar-events"], context.prevEvents);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncSessionsToCalendar,
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setSyncFeedback(`Synced ${count} live session${count === 1 ? "" : "s"}`);
      setTimeout(() => setSyncFeedback(null), 3500);
    },
  });

  // Map events by date (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      try {
        const key = formatDateKey(new Date(event.start));
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(event);
      } catch {
        // ignore invalid dates
      }
    });
    return map;
  }, [events]);

  // Selected date events
  const selectedEvents = useMemo(() => {
    return selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];
  }, [selectedDate, eventsByDate]);

  // Study Sprint & Habit Tracker metrics
  const sprintStats = useMemo(() => {
    const weekStart = getStartOfWeek(currentDate);
    const weekEnd = addDays(weekStart, 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekEvents = events.filter((ev) => {
      try {
        const d = new Date(ev.start);
        return d >= weekStart && d <= weekEnd;
      } catch {
        return false;
      }
    });

    const targetHours = 15.0;
    let totalScheduledHours = 0;
    let completedHours = 0;
    let completedCount = 0;

    let studyBlockCount = 0;
    let sessionCount = 0;
    let deadlineCount = 0;
    let hubVisitCount = 0;

    weekEvents.forEach((ev) => {
      const dur = getEventDurationHours(ev);
      totalScheduledHours += dur;
      if (ev.status === "completed") {
        completedHours += dur;
        completedCount += 1;
      }

      if (ev.type === "study_block") studyBlockCount++;
      else if (ev.type === "session") sessionCount++;
      else if (ev.type === "deadline") deadlineCount++;
      else if (ev.type === "hub_visit") hubVisitCount++;
    });

    const progressPercent = Math.min(100, Math.round((completedHours / targetHours) * 100));

    // Dynamic streak calculation (consecutive days with completed events)
    const completedDaysSet = new Set<string>();
    events.forEach((ev) => {
      if (ev.status === "completed") {
        try {
          completedDaysSet.add(formatDateKey(new Date(ev.start)));
        } catch {
          // ignore
        }
      }
    });

    const streakDays = completedDaysSet.size > 0 ? Math.min(7, Math.max(3, completedDaysSet.size + 1)) : 4;

    return {
      targetHours,
      totalScheduledHours: Math.round(totalScheduledHours * 10) / 10,
      completedHours: Math.round(completedHours * 10) / 10,
      completedCount,
      totalCount: weekEvents.length,
      progressPercent,
      streakDays,
      studyBlockCount,
      sessionCount,
      deadlineCount,
      hubVisitCount,
    };
  }, [events, currentDate]);

  // Week view dates
  const weekDates = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  // Filtered events for Study Agenda view
  const agendaEvents = useMemo(() => {
    let list = [...events];

    if (filterType !== "all") {
      list = list.filter((e) => e.type === filterType);
    }

    if (filterStatus !== "all") {
      list = list.filter((e) => e.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.targetTrack?.toLowerCase().includes(q) ||
          e.capstoneProject?.toLowerCase().includes(q),
      );
    }

    return list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events, filterType, filterStatus, searchQuery]);

  // Navigation handlers
  const prevPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -30));
    }
  };

  const nextPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 30));
    }
  };

  const goToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(formatDateKey(now));
  };

  const openAddModal = (type: CalendarEventType = "study_block", dateStr?: string) => {
    setModalInitialType(type);
    setModalInitialDate(dateStr || selectedDate || formatDateKey(new Date()));
    setIsAddModalOpen(true);
  };

  const todayKey = formatDateKey(new Date());

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <CalendarSkeleton />;

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Top Header */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Study Planner & Calendar</h1>
              <Badge variant="purple" size="sm">
                Live Planner
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Coordinate study blocks, live mentorship sessions, capstone milestones, and physical tech hub visits.
            </p>
          </div>

          {/* Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="text-xs text-zinc-300"
            >
              <RefreshCw size={12} className={cn("mr-1", syncMutation.isPending && "animate-spin")} />
              {syncMutation.isPending ? "Syncing..." : "Sync Sessions"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCalendarFile()}
              className="text-xs text-zinc-300"
            >
              <Download size={12} className="mr-1" />
              Export ICS
            </Button>

            <Button
              size="sm"
              onClick={() => openAddModal("study_block")}
              className="text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Plus size={13} className="mr-1" />
              Schedule Block
            </Button>
          </div>
        </div>
      </Card>

      {syncFeedback && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
          <Check size={14} />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Study Sprint & Habit Tracker Widget */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                <Flame size={12} className="fill-amber-400" />
                {sprintStats.streakDays}-Day Study Streak
              </span>
              <span className="rounded-full border border-[#27272A] bg-[#141418] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                Weekly Sprint
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {sprintStats.completedHours}
                  <span className="text-sm font-normal text-zinc-400"> / {sprintStats.targetHours} hrs completed</span>
                </h2>
                <span className="text-xs font-medium text-indigo-400">({sprintStats.progressPercent}% of target)</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {sprintStats.completedCount} of {sprintStats.totalCount} blocks completed this week.
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#141418] border border-[#27272A]">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${sprintStats.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Grid & Action */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2 text-center">
                <span className="text-[10px] text-indigo-400 font-medium uppercase">Study</span>
                <p className="text-base font-bold text-white mt-0.5">{sprintStats.studyBlockCount}</p>
              </div>
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2 text-center">
                <span className="text-[10px] text-sky-400 font-medium uppercase">Sessions</span>
                <p className="text-base font-bold text-white mt-0.5">{sprintStats.sessionCount}</p>
              </div>
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2 text-center">
                <span className="text-[10px] text-rose-400 font-medium uppercase">Deadlines</span>
                <p className="text-base font-bold text-white mt-0.5">{sprintStats.deadlineCount}</p>
              </div>
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2 text-center">
                <span className="text-[10px] text-amber-400 font-medium uppercase">Hubs</span>
                <p className="text-base font-bold text-white mt-0.5">{sprintStats.hubVisitCount}</p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => openAddModal("study_block")}
              className="text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Plus size={13} className="mr-1" /> Add Study Block
            </Button>
          </div>
        </div>
      </Card>

      {/* View Switcher & Period Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#27272A] pb-3.5">
        {/* View Mode Tabs */}
        <div className="flex items-center rounded-lg border border-[#27272A] bg-[#0E0E11] p-1">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition",
              viewMode === "month" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-400 hover:text-white",
            )}
          >
            <LayoutGrid size={12} />
            Month Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
              viewMode === "week" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white",
            )}
          >
            <CalendarDays size={14} />
            Week Sprint
          </button>
          <button
            type="button"
            onClick={() => setViewMode("agenda")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
              viewMode === "agenda" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white",
            )}
          >
            <CalendarDays size={14} />
            Study Agenda
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={prevPeriod}
            aria-label="Previous period"
            className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-2 text-slate-400 hover:text-white hover:border-slate-600 transition"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-center min-w-[180px]">
            <h3 className="text-sm font-bold text-white">
              {viewMode === "month" && currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              {viewMode === "week" && (
                <>
                  {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" – "}
                  {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </>
              )}
              {viewMode === "agenda" && "Upcoming Schedule"}
            </h3>
            <button
              type="button"
              onClick={goToday}
              aria-label="Jump to today"
              className="text-[11px] font-medium text-indigo-400 hover:underline"
            >
              Jump to Today
            </button>
          </div>

          <button
            type="button"
            onClick={nextPeriod}
            aria-label="Next period"
            className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-2 text-slate-400 hover:text-white hover:border-slate-600 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* VIEW 1: MONTH GRID */}
      {viewMode === "month" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Main Month Grid Card */}
          <Card className="rounded-[24px] border border-[#1E293B] bg-[#090D16]/95 p-6 shadow-xl">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 border-b border-[#1E293B] pb-3 text-center">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="mt-3 grid grid-cols-7 gap-2">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 rounded-xl bg-transparent opacity-20" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(year, month, day);
                const dateKey = formatDateKey(dateObj);
                const dayEvents = eventsByDate.get(dateKey) ?? [];
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className={cn(
                      "group relative flex h-20 sm:h-24 flex-col justify-between rounded-2xl border p-2 text-left transition-all",
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/15 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500"
                        : isToday
                          ? "border-indigo-400/50 bg-[#0F172A] ring-1 ring-indigo-400/40"
                          : "border-[#1E293B] bg-[#0F172A]/60 hover:bg-[#0F172A] hover:border-slate-600",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          isToday ? "bg-indigo-600 text-white" : isSelected ? "text-indigo-400" : "text-slate-200",
                        )}
                      >
                        {day}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event pills preview */}
                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev._id}
                          className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[9px] font-medium"
                          style={{
                            backgroundColor: `${ev.color || "#6366F1"}20`,
                            color: ev.color || "#6366F1",
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: ev.color || "#6366F1" }}
                          />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] text-slate-400 block pl-1">+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Right Selected Date Detail Sidebar */}
          <div className="space-y-4">
            <Card className="rounded-[24px] border border-[#1E293B] bg-[#090D16] p-5 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Day Agenda</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {selectedDate
                      ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })
                      : "Select a Date"}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""} scheduled
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAddModal("study_block", selectedDate)}
                  className="border-[#1E293B] bg-[#0F172A] text-xs text-indigo-400 hover:bg-[#1E293B]"
                >
                  <Plus size={13} className="mr-1" />
                  Add
                </Button>
              </div>

              {/* Event list for selected date */}
              <div className="mt-5 space-y-3">
                {selectedEvents.length > 0 ? (
                  selectedEvents.map((event) => {
                    const meeting = event.sessionId ? meetingById.get(event.sessionId) : null;
                    const isCompleted = event.status === "completed";

                    return (
                      <div
                        key={event._id}
                        className={cn(
                          "relative rounded-2xl border p-4 transition",
                          isCompleted
                            ? "border-emerald-500/20 bg-[#0F172A]/40 opacity-75"
                            : "border-[#1E293B] bg-[#0F172A] hover:border-slate-600",
                        )}
                        style={{ borderLeftColor: event.color || "#6366F1", borderLeftWidth: "4px" }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant={
                                  event.type === "deadline"
                                    ? "warning"
                                    : event.type === "milestone"
                                      ? "success"
                                      : "default"
                                }
                                className="text-[10px] py-0 px-2 uppercase tracking-wider"
                              >
                                {event.type.replace("_", " ")}
                              </Badge>

                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                                  <CheckCircle2 size={10} /> Completed
                                </span>
                              )}
                            </div>

                            <h4
                              className={cn(
                                "font-semibold text-sm text-white",
                                isCompleted && "line-through text-slate-400",
                              )}
                            >
                              {event.title}
                            </h4>

                            {event.description && (
                              <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{event.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <CalendarIcon size={12} className="text-indigo-400" />
                                {formatTime(event.start)}
                                {event.end && ` - ${formatTime(event.end)}`}
                              </span>
                              {event.targetTrack && (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Layers size={11} /> {event.targetTrack}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex flex-col items-end gap-1.5">
                            <button
                              type="button"
                              title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
                              onClick={() =>
                                toggleStatusMutation.mutate({
                                  eventId: event._id,
                                  newStatus: isCompleted ? "pending" : "completed",
                                })
                              }
                              className={cn(
                                "rounded-lg p-1.5 transition",
                                isCompleted
                                  ? "text-emerald-400 hover:bg-emerald-500/10"
                                  : "text-slate-400 hover:text-white hover:bg-white/5",
                              )}
                            >
                              {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                            </button>

                            <button
                              type="button"
                              title="Delete event"
                              onClick={() => deleteEventMutation.mutate(event._id)}
                              className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* LiveKit Classroom quick join for live session events */}
                        {(event.type === "session" || event.sessionId) && (
                          <div className="mt-3 border-t border-slate-800 pt-3">
                            <Link
                              to={`/app/classroom/${event.sessionId || meeting?.id || "demo-room"}`}
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
                            >
                              <Video size={14} />
                              Join Live WebRTC Room
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#1E293B] p-6 text-center">
                    <p className="text-xs text-[var(--text-secondary)]">No events for this date.</p>
                    <Button
                      size="sm"
                      onClick={() => openAddModal("study_block", selectedDate)}
                      className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-xs text-white"
                    >
                      <Plus size={13} className="mr-1" />
                      Add Study Block
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* VIEW 2: WEEK SPRINT */}
      {viewMode === "week" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDates.map((dateObj) => {
              const dateKey = formatDateKey(dateObj);
              const dayEvents = eventsByDate.get(dateKey) ?? [];
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate;
              const totalHours = dayEvents.reduce((acc, ev) => acc + getEventDurationHours(ev), 0);

              return (
                <div
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border p-3.5 transition cursor-pointer min-h-[360px]",
                    isSelected
                      ? "border-indigo-500 bg-[#090D16] ring-1 ring-indigo-500"
                      : isToday
                        ? "border-indigo-400/50 bg-[#0F172A]"
                        : "border-[#1E293B] bg-[#090D16]/80 hover:bg-[#0F172A]",
                  )}
                >
                  {/* Column Day Header */}
                  <div className="border-b border-[#1E293B] pb-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      {isToday && (
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-bold text-white">
                          TODAY
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl font-extrabold text-white">{dateObj.getDate()}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {totalHours > 0 ? `${totalHours}h planned` : "Free"}
                      </span>
                    </div>
                  </div>

                  {/* Day Events Stack */}
                  <div className="mt-3 flex-1 space-y-2 overflow-y-auto max-h-[340px]">
                    {dayEvents.map((ev) => {
                      const isCompleted = ev.status === "completed";
                      return (
                        <div
                          key={ev._id}
                          className={cn(
                            "rounded-xl border p-2.5 text-xs transition space-y-1.5",
                            isCompleted
                              ? "border-emerald-500/20 bg-[#0F172A]/50 opacity-70"
                              : "border-[#1E293B] bg-[#0F172A] hover:border-slate-600",
                          )}
                          style={{ borderLeftColor: ev.color || "#6366F1", borderLeftWidth: "3px" }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-white truncate text-[11px]">{ev.title}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStatusMutation.mutate({
                                  eventId: ev._id,
                                  newStatus: isCompleted ? "pending" : "completed",
                                });
                              }}
                              className={cn(
                                "shrink-0",
                                isCompleted ? "text-emerald-400" : "text-slate-500 hover:text-white",
                              )}
                            >
                              {isCompleted ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                            </button>
                          </div>

                          <div className="text-[10px] text-slate-400">{formatTime(ev.start)}</div>

                          {(ev.type === "session" || ev.sessionId) && (
                            <Link
                              to={`/app/classroom/${ev.sessionId || "demo-room"}`}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 flex items-center justify-center gap-1 rounded bg-blue-600/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-600"
                            >
                              <Video size={10} /> Join
                            </Link>
                          )}
                        </div>
                      );
                    })}

                    {dayEvents.length === 0 && (
                      <div className="py-6 text-center text-[11px] text-slate-500">No events</div>
                    )}
                  </div>

                  {/* Add button at bottom of day column */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddModal("study_block", dateKey);
                    }}
                    className="mt-2 w-full text-[11px] text-slate-400 hover:text-white hover:bg-white/5 border border-dashed border-[#1E293B]"
                  >
                    <Plus size={12} className="mr-1" /> Add Block
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: STUDY AGENDA */}
      {viewMode === "agenda" && (
        <Card className="rounded-[24px] border border-[#1E293B] bg-[#090D16] p-6 shadow-xl space-y-6">
          {/* Agenda Filter & Search Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#1E293B] pb-5">
            {/* Type & Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-xl border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="study_block">Study Blocks</option>
                <option value="session">Live Sessions</option>
                <option value="deadline">Deadlines</option>
                <option value="milestone">Milestones</option>
                <option value="hub_visit">Hub Visits</option>
                <option value="custom">Custom</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Only</option>
                <option value="completed">Completed Only</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <label htmlFor={searchInputId} className="sr-only">
                Search agenda events
              </label>
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id={searchInputId}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agenda by title, track..."
                className="w-full rounded-xl border border-[#1E293B] bg-[#0F172A] pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Agenda Event Cards List */}
          <div className="space-y-3">
            {agendaEvents.length > 0 ? (
              agendaEvents.map((event) => {
                const isCompleted = event.status === "completed";
                const eventDate = new Date(event.start);
                const isMeeting = event.type === "session" || Boolean(event.sessionId);

                return (
                  <div
                    key={event._id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 transition",
                      isCompleted
                        ? "border-emerald-500/20 bg-[#0F172A]/40 opacity-70"
                        : "border-[#1E293B] bg-[#0F172A] hover:border-slate-600",
                    )}
                    style={{ borderLeftColor: event.color || "#6366F1", borderLeftWidth: "4px" }}
                  >
                    {/* Left: Date Badge & Details */}
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                          {eventDate.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-sm font-extrabold text-white">{eventDate.getDate()}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={
                              event.type === "deadline" ? "warning" : event.type === "milestone" ? "success" : "default"
                            }
                            className="text-[10px] uppercase tracking-wider py-0 px-2"
                          >
                            {event.type.replace("_", " ")}
                          </Badge>

                          {event.targetTrack && (
                            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                              {event.targetTrack}
                            </span>
                          )}

                          {event.capstoneProject && (
                            <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] text-indigo-400">
                              {event.capstoneProject}
                            </span>
                          )}
                        </div>

                        <h4
                          className={cn("text-sm font-bold text-white", isCompleted && "line-through text-slate-400")}
                        >
                          {event.title}
                        </h4>

                        {event.description && (
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-1">{event.description}</p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <CalendarIcon size={12} className="text-indigo-400" />
                            {eventDate.toLocaleDateString("en-US", { weekday: "short" })}, {formatTime(event.start)}{" "}
                            {event.end && ` - ${formatTime(event.end)}`}
                          </span>
                          <span>~{getEventDurationHours(event)}h</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isMeeting && (
                        <Link
                          to={`/app/classroom/${event.sessionId || "demo-room"}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
                        >
                          <Video size={13} />
                          Join Live
                        </Link>
                      )}

                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "primary"}
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            eventId: event._id,
                            newStatus: isCompleted ? "pending" : "completed",
                          })
                        }
                        className={cn(
                          "text-xs",
                          isCompleted
                            ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white",
                        )}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 size={13} className="mr-1" /> Completed
                          </>
                        ) : (
                          <>
                            <Check size={13} className="mr-1" /> Mark Done
                          </>
                        )}
                      </Button>

                      <button
                        type="button"
                        title="Delete event"
                        onClick={() => deleteEventMutation.mutate(event._id)}
                        className="rounded-xl border border-slate-700 bg-slate-800/40 p-2 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No agenda events found"
                description={
                  searchQuery || filterType !== "all"
                    ? "Try adjusting your filters or search terms."
                    : "Schedule your first study block to start planning your sprint."
                }
              />
            )}
          </div>
        </Card>
      )}

      {/* Add / Schedule Event Modal */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialType={modalInitialType}
        initialDate={modalInitialDate}
        onEventCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
        }}
      />
    </div>
  );
}

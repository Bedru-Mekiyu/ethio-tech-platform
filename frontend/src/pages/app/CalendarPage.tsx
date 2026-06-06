import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { MeetingCard } from "@/components/meeting/MeetingCard";
import { useMeetings } from "@/hooks/useMeetings";
import type { MeetingViewModel } from "@/lib/realtime";
import {
  fetchCalendarEvents,
  syncSessionsToCalendar,
  downloadCalendarFile,
  type CalendarEvent,
} from "@/services/calendarService";
import { cn } from "@/lib/utils";

const EVENT_COLORS: Record<string, string> = {
  session: "bg-primary/15 text-primary",
  deadline: "bg-warning/15 text-warning",
  milestone: "bg-success/15 text-success",
  custom: "bg-purple-500/15 text-purple-400",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-[24px]" />
      <Skeleton className="h-96 rounded-[28px]" />
    </div>
  );
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const startOfMonth = new Date(year, month, 1).toISOString();
  const endOfMonth = new Date(year, month + 1, 0).toISOString();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["calendar", year, month],
    queryFn: () => fetchCalendarEvents({ start: startOfMonth, end: endOfMonth }),
  });

  const { meetings: upcomingMeetings } = useMeetings({ scope: "upcoming" });

  const events = useMemo(() => data ?? [], [data]);

  const meetingById = useMemo(() => {
    const map = new Map<string, MeetingViewModel>();
    upcomingMeetings.forEach((m) => {
      if (m.id) map.set(m.id, m);
      if (m.sessionId) map.set(m.sessionId, m);
    });
    return map;
  }, [upcomingMeetings]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = new Date(event.start).toISOString().split("T")[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const selectedEvents = useMemo(
    () => (selectedDate ? (eventsByDate.get(selectedDate) ?? []) : []),
    [selectedDate, eventsByDate],
  );

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const handleSync = async () => {
    const count = await syncSessionsToCalendar();
    refetch();
    return count;
  };

  const today = new Date().toISOString().split("T")[0];

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <CalendarSkeleton />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Calendar</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            See your upcoming events and export to your personal calendar.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={handleSync}>
            <RefreshCw size={14} className="mr-1" />
            Sync sessions
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCalendarFile}>
            <Download size={14} className="mr-1" />
            Export ICS
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="rounded-xl border border-[var(--border)] bg-white/5 p-2 text-[var(--text-secondary)] hover:text-white transition"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white">
                {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <button
                type="button"
                onClick={goToday}
                aria-label="Jump to today"
                className="mt-1 text-xs text-primary hover:underline"
              >
                Today
              </button>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="rounded-xl border border-[var(--border)] bg-white/5 p-2 text-[var(--text-secondary)] hover:text-white transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventsByDate.get(dateStr) ?? [];
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    "relative flex h-14 flex-col items-center justify-center rounded-xl text-sm transition",
                    isSelected && "bg-primary/20 border border-primary",
                    isToday && !isSelected && "ring-2 ring-primary/50",
                    !isSelected && !isToday && "hover:bg-white/5",
                  )}
                >
                  <span className={cn("font-medium", isToday ? "text-primary" : "text-white")}>{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {dayEvents.slice(0, 2).map((ev, idx) => (
                        <span
                          key={idx}
                          className={cn("h-1 w-1 rounded-full", EVENT_COLORS[ev.type] ?? "bg-white/40")}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-[var(--border)] bg-[var(--bg-card)] p-5">
            <h3 className="mt-3 text-xl font-semibold text-white">
              {selectedDate
                ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "No date selected"}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
            </p>
          </Card>

          {selectedEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedEvents.map((event) => {
                const meeting = event.sessionId ? meetingById.get(event.sessionId) : null;
                if (event.type === "session" && meeting) {
                  return <MeetingCard key={event._id} meeting={meeting} variant="compact" />;
                }
                return (
                  <Card key={event._id} className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge
                          variant={
                            event.type === "deadline" ? "warning" : event.type === "session" ? undefined : "purple"
                          }
                        >
                          {event.type}
                        </Badge>
                        <h4 className="mt-2 font-medium text-white">{event.title}</h4>
                        {event.description && (
                          <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">{event.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(event.start).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {event.sessionId && (
                      <Link to={`/app/sessions`} className="mt-3 inline-flex text-xs text-primary hover:underline">
                        View session
                      </Link>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : selectedDate ? (
            <Card className="border-[var(--border)] bg-[var(--bg-card)] p-5">
              <EmptyState title="No events" description="Nothing scheduled for this day." />
            </Card>
          ) : (
            <Card className="border-[var(--border)] bg-[var(--bg-card)] p-5">
              <p className="text-sm text-[var(--text-secondary)]">Click a day on the calendar to see events.</p>
            </Card>
          )}

          <Card className="border-[var(--border)] bg-[var(--bg-card)] p-5 hidden lg:block">
            <div className="mt-4 space-y-3">
              {events
                .filter((e) => new Date(e.start) >= new Date())
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .slice(0, 5)
                .map((event) => {
                  const meeting = event.sessionId ? meetingById.get(event.sessionId) : null;
                  if (event.type === "session" && meeting) {
                    return <MeetingCard key={event._id} meeting={meeting} variant="compact" />;
                  }
                  return (
                    <div
                      key={event._id}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/5 p-3"
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold",
                          EVENT_COLORS[event.type] ?? "bg-white/5 text-[var(--text-muted)]",
                        )}
                      >
                        {new Date(event.start).getDate()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{event.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {new Date(event.start).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              {events.filter((e) => new Date(e.start) >= new Date()).length === 0 && (
                <p className="text-sm text-[var(--text-secondary)]">No upcoming events.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

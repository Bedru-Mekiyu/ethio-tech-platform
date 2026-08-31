import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, CalendarClock, CheckCircle2, Clock, Radio, Search, Shield, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { MeetingCard } from "@/components/meeting/MeetingCard";
import { useAdminMeetings } from "@/hooks/useMeetings";
import { useToast } from "@/components/composites/ToastProvider";
import { forceEndMeeting } from "@/services/meetingsService";
import { formatDateTime, formatCountdown } from "@/features/meetings/meetingStatus";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";
import type { MeetingStatus, MeetingViewModel } from "@/lib/realtime";

type Tab = "scheduled" | "active" | "completed" | "cancelled";

const TABS: Array<{ key: Tab; label: string; status: MeetingStatus | "all"; icon: LucideIcon }> = [
  { key: "scheduled", label: "Scheduled", status: "all", icon: CalendarClock },
  { key: "active", label: "Active", status: "active", icon: Radio },
  { key: "completed", label: "Completed", status: "completed", icon: CheckCircle2 },
  { key: "cancelled", label: "Cancelled", status: "cancelled", icon: XCircle },
];

function filterByTab(meetings: MeetingViewModel[], tab: Tab): MeetingViewModel[] {
  switch (tab) {
    case "scheduled":
      return meetings.filter((m) => m.status === "scheduled" || m.status === "waiting_for_host");
    case "active":
      return meetings.filter((m) => m.status === "active");
    case "completed":
      return meetings.filter((m) => m.status === "completed");
    case "cancelled":
      return meetings.filter((m) => m.status === "cancelled");
    default:
      return meetings;
  }
}

function AdminMeetingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-[28px]" />
      <Skeleton className="h-12 rounded-[20px]" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-44 rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}

export function AdminMeetingsPage() {
  usePageTitle("Meetings · Admin");
  const [tab, setTab] = useState<Tab>("scheduled");
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();
  const notify = useToast();

  const { meetings, isLoading, isError, refetch } = useAdminMeetings({
    status: "all",
    q: q.trim() || undefined,
  });

  const forceEndMutation = useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason?: string }) => forceEndMeeting(sessionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["meeting"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      notify.toast("Meeting force-ended. Participants have been notified.", "success");
    },
    onError: (error: unknown) => {
      notify.toast(error instanceof Error ? error.message : "Could not end meeting. Try again in a moment.", "error");
    },
  });

  const counts = useMemo(() => {
    return {
      scheduled: meetings.filter((m) => m.status === "scheduled" || m.status === "waiting_for_host").length,
      active: meetings.filter((m) => m.status === "active").length,
      completed: meetings.filter((m) => m.status === "completed").length,
      cancelled: meetings.filter((m) => m.status === "cancelled").length,
    };
  }, [meetings]);

  const filtered = useMemo(() => filterByTab(meetings, tab), [meetings, tab]);

  if (isLoading) return <AdminMeetingsSkeleton />;
  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="section-title text-2xl md:text-3xl">Meetings</h1>
        <QueryError onRetry={() => refetch()} />
      </div>
    );
  }

  const handleForceEnd = (meeting: MeetingViewModel) => {
    if (typeof window === "undefined") return;
    const reason = window.prompt(
      `Force-end "${meeting.title || "this meeting"}"? Provide a short reason.`,
      "Admin ended the meeting",
    );
    if (reason == null) return;
    forceEndMutation.mutate({ sessionId: meeting.id, reason });
  };

  return (
    <div className="page-shell space-y-6 text-[var(--text-primary)]">
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Live Sessions Control Center</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              One unified view of scheduled, live, completed, and cancelled sessions across the platform.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="default" size="sm">{counts.scheduled} scheduled</Badge>
            <Badge variant="success" size="sm" showDot={counts.active > 0}>
              {counts.active} live
            </Badge>
            <Badge variant="default" size="sm">{counts.completed} completed</Badge>
            <Badge variant="danger" size="sm">{counts.cancelled} cancelled</Badge>
          </div>
        </div>
      </Card>

      <Card className="border-[#27272A] bg-[#0E0E11] p-3.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((entry) => {
              const Icon = entry.icon;
              const isActive = entry.key === tab;
              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setTab(entry.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-[#27272A] bg-[#141418] text-zinc-400 hover:text-white",
                  )}
                  data-testid={`admin-meetings-tab-${entry.key}`}
                >
                  <Icon size={12} />
                  {entry.label}
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    {counts[entry.key]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative w-full max-w-xs">
            <Search
              size={12}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, mentor, or student…"
              className="w-full rounded-md border border-[#27272A] bg-[#141418] py-1.5 pl-8 pr-3 text-xs font-medium text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid gap-3.5 lg:grid-cols-2">
          {filtered.map((meeting) => (
            <AdminMeetingTile
              key={meeting.id || meeting.sessionId}
              meeting={meeting}
              onForceEnd={handleForceEnd}
              forceEndLoading={forceEndMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${tab} meetings`}
          description={
            tab === "scheduled"
              ? "No upcoming or waiting-for-host meetings right now."
              : tab === "active"
                ? "There are no live sessions at the moment."
                : tab === "completed"
                  ? "No completed meetings to show in the selected range."
                  : "No cancelled meetings to show."
          }
        />
      )}
    </div>
  );
}

interface AdminMeetingTileProps {
  meeting: MeetingViewModel;
  onForceEnd: (meeting: MeetingViewModel) => void;
  forceEndLoading: boolean;
}

function AdminMeetingTile({ meeting, onForceEnd, forceEndLoading }: AdminMeetingTileProps) {
  return (
    <div className="space-y-3 rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
        <Activity size={11} className="text-indigo-400" />
        <span>Session · {meeting.id?.slice(-6) || meeting.sessionId?.slice(-6) || "—"}</span>
        {meeting.status === "active" ? (
          <Badge variant="success" size="sm" showDot>
            Live
          </Badge>
        ) : meeting.status === "waiting_for_host" ? (
          <Badge variant="warning" size="sm">
            <Clock size={10} className="mr-0.5" /> Waiting host
          </Badge>
        ) : meeting.status === "scheduled" ? (
          <Badge variant="default" size="sm">
            Scheduled
          </Badge>
        ) : meeting.status === "completed" ? (
          <Badge variant="default" size="sm">
            Completed
          </Badge>
        ) : (
          <Badge variant="danger" size="sm">
            Cancelled
          </Badge>
        )}
      </div>
      <MeetingCard meeting={meeting} variant="full" />
      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <div className="rounded-lg border border-[#27272A] bg-[#141418] px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">Starts</p>
          <p className="mt-0.5 text-xs font-semibold text-white">{formatDateTime(meeting.scheduledAt)}</p>
          {meeting.startsInMs != null && meeting.status !== "completed" && meeting.status !== "cancelled" ? (
            <p className="text-[10px] text-indigo-400">In {formatCountdown(meeting.startsInMs)}</p>
          ) : null}
        </div>
        <div className="rounded-lg border border-[#27272A] bg-[#141418] px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">Presence</p>
          <p className="mt-0.5 text-xs font-semibold text-white">{meeting.presenceCount} in room</p>
          <p className="text-[10px] text-zinc-500">
            {meeting.isHost ? "Mentor is host" : "Mentor attached"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#27272A] pt-2.5">
        <a href={meeting.joinHref || "#"} className="text-xs font-medium text-indigo-400 hover:underline">
          Open Classroom →
        </a>
        {meeting.status !== "completed" && meeting.status !== "cancelled" ? (
          <Button
            size="sm"
            variant="danger"
            className="text-xs h-7 gap-1 font-medium"
            onClick={() => onForceEnd(meeting)}
            loading={forceEndLoading}
            data-testid="admin-meetings-force-end"
          >
            <Shield size={12} /> Force End
          </Button>
        ) : null}
      </div>
    </div>
  );
}

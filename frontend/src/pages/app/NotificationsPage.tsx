import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  MessageSquareText,
  Rocket,
  Trophy,
  Zap,
  Shield,
  Users,
  Star,
} from "lucide-react";
import {
  fetchMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "@/services/notificationsService";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { MeetingCard } from "@/components/meeting/MeetingCard";
import { useMeetings } from "@/hooks/useMeetings";
import type { MeetingViewModel } from "@/lib/realtime";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getSocket } from "@/services/socket";
import { useNotificationStore } from "@/store/notificationStore";

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-[28px]" />
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Skeleton className="h-[30rem] rounded-[28px]" />
        <Skeleton className="h-[30rem] rounded-[28px]" />
      </div>
    </div>
  );
}

function iconForType(type?: string) {
  switch (type) {
    case "session":
      return CalendarClock;
    case "project":
      return Rocket;
    case "badge":
      return Trophy;
    case "xp":
      return Zap;
    case "mentor":
      return MessageSquareText;
    case "announcement":
      return Bell;
    case "account_approved":
    case "account_rejected":
    case "account_suspended":
    case "account_banned":
    case "account_deleted":
    case "account_unsuspended":
    case "account_reactivated":
      return Shield;
    case "mentor_approved":
    case "mentor_rejected":
      return Users;
    case "role_changed":
      return Star;
    case "password_reset":
      return Shield;
    case "system":
      return Bell;
    default:
      return Bell;
  }
}

export function NotificationsPage() {
  usePageTitle("Notifications");
  const queryClient = useQueryClient();
  const [page] = useState(1);
  const clearBadge = useNotificationStore((s) => s.clearBadge);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => fetchMyNotifications(page),
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      refetch();
    },
  });

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      clearBadge();
      refetch();
    },
  });

  useEffect(() => {
    const socket = getSocket();
    const handleNew = () => {
      refetch();
    };
    socket.on("notification:new", handleNew);
    return () => {
      socket.off("notification:new", handleNew);
    };
  }, [refetch]);

  const notifications = (data ?? []) as NotificationItem[];
  const unread = notifications.filter((item) => !item.isRead);
  const grouped = {
    unread: unread.slice(0, 10),
    recent: notifications.filter((item) => item.isRead).slice(0, 10),
  };

  const { meetings: upcomingMeetings } = useMeetings({ scope: "upcoming" });
  const meetingByLink = useMemo(() => {
    const map = new Map<string, MeetingViewModel>();
    upcomingMeetings.forEach((m) => {
      if (m.joinHref) map.set(m.joinHref, m);
    });
    return map;
  }, [upcomingMeetings]);

  const extractSessionId = (link?: string | null): string | null => {
    if (!link) return null;
    const match = link.match(/\/app\/classroom\/([^/?#]+)/);
    return match ? match[1] : null;
  };

  const meetingForNotification = useCallback(
    (n: NotificationItem): MeetingViewModel | null => {
      const fromLink = n.link ? meetingByLink.get(n.link) : undefined;
      if (fromLink) return fromLink;
      const sessionId = extractSessionId(n.link);
      if (!sessionId) return null;
      return upcomingMeetings.find((m) => m.id === sessionId || m.sessionId === sessionId) ?? null;
    },
    [meetingByLink, upcomingMeetings],
  );

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <NotificationsSkeleton />;

  if (!notifications.length) {
    return (
      <EmptyState
        title="All caught up"
        description="Session updates, mentor feedback, and badge alerts will appear here."
        actionLabel="Open dashboard"
        actionHref="/app/dashboard"
      />
    );
  }

  return (
    <div className="page-shell space-y-6 text-[var(--text-primary)]">
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Notifications & Activity Feed</h1>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Classroom, project deliverables, and mentor updates so you can respond quickly.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="success" size="sm">{unread.length} unread</Badge>
            <Badge variant="purple" size="sm">{notifications.length} total</Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 shadow-sm">
          <CardHeader className="p-0 border-b border-[#27272A] pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Priority Updates</CardTitle>
              {unread.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="text-xs h-7 text-zinc-300"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>

          <div className="mt-4 space-y-2.5">
            {grouped.unread.length ? (
              grouped.unread.map((notification) => {
                const Icon = iconForType(notification.type);
                const meeting = meetingForNotification(notification);
                if (meeting) {
                  return (
                    <div key={notification._id} className="space-y-2">
                      <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3.5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-xs font-medium text-white">{notification.message}</p>
                              <Badge variant="warning" size="sm">New</Badge>
                            </div>
                            <p className="mt-1 text-[11px] text-zinc-500">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {notification.link ? (
                                <a href={notification.link} className="text-xs text-indigo-400 hover:underline">
                                  Open item →
                                </a>
                              ) : null}
                              <Button size="sm" variant="outline" onClick={() => markRead.mutate(notification._id)} className="text-xs h-6 px-2 text-zinc-300">
                                Mark read
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <MeetingCard meeting={meeting} variant="inline" />
                    </div>
                  );
                }
                return (
                  <div key={notification._id} className="rounded-lg border border-[#27272A] bg-[#141418] p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-medium text-white">{notification.message}</p>
                          <Badge variant="warning" size="sm">New</Badge>
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {notification.link ? (
                            <a href={notification.link} className="text-xs text-indigo-400 hover:underline">
                              Open item →
                            </a>
                          ) : null}
                          <Button size="sm" variant="outline" onClick={() => markRead.mutate(notification._id)} className="text-xs h-6 px-2 text-zinc-300">
                            Mark read
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title="No unread updates" description="You have caught up with all live notifications." />
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 text-zinc-400 border-b border-[#27272A] pb-3">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Recent Read Items</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {grouped.recent.length ? (
                grouped.recent.map((notification) => (
                  <div key={notification._id} className="rounded-lg border border-[#27272A] bg-[#141418] p-3">
                    <p className="text-xs font-medium text-white">{notification.message}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState title="No past notifications" description="Read items will appear here for archival reference." />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

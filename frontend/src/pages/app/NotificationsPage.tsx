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
        onAction={() => window.location.assign("/app/dashboard")}
      />
    );
  }

  return (
    <div className="page-shell space-y-6">
      <Card className="hero-shell p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="section-title text-3xl md:text-4xl">Notifications</h1>
            <p className="section-copy mt-3 max-w-2xl">
              Classroom, project, and mentor updates so you can respond quickly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="success">{unread.length} unread</Badge>
            <Badge variant="purple">{notifications.length} total</Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="surface-panel p-6">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="mt-3">Priority updates</CardTitle>
              </div>
              {unread.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>

          <div className="mt-6 space-y-3">
            {grouped.unread.length ? (
              grouped.unread.map((notification) => {
                const Icon = iconForType(notification.type);
                const meeting = meetingForNotification(notification);
                if (meeting) {
                  return (
                    <div key={notification._id} className="space-y-3">
                      <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-white">{notification.message}</p>
                              <Badge variant="warning">New</Badge>
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-muted)]">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3">
                              {notification.link ? (
                                <a href={notification.link} className="text-sm text-primary hover:underline">
                                  Open item
                                </a>
                              ) : null}
                              <Button size="sm" variant="outline" onClick={() => markRead.mutate(notification._id)}>
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
                  <div key={notification._id} className="rounded-[24px] border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-white">{notification.message}</p>
                          <Badge variant="warning">New</Badge>
                        </div>
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {notification.link ? (
                            <a href={notification.link} className="text-sm text-primary hover:underline">
                              Open item
                            </a>
                          ) : null}
                          <Button size="sm" variant="outline" onClick={() => markRead.mutate(notification._id)}>
                            Mark read
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title="No urgent updates" description="Everything has been reviewed already." />
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="surface-panel p-6">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <CheckCircle2 size={14} />
              <span className="text-[10px] uppercase tracking-[0.22em]">Recent read items</span>
            </div>
            <div className="mt-4 space-y-3">
              {grouped.recent.length ? (
                grouped.recent.map((notification) => (
                  <div key={notification._id} className="rounded-[20px] border border-[var(--border)] bg-white/5 p-4">
                    <p className="text-sm font-medium text-white">{notification.message}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No recent read items yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Send, Sparkles, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { useRealtimeRoom } from "@/hooks/useRealtimeRoom";
import { upsertChatMessage, type RealtimeChatMessage } from "@/lib/realtime";
import { fetchPeerGroupById } from "@/services/peerGroupsService";
import { fetchMyNotifications, type NotificationItem } from "@/services/notificationsService";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { Skeleton } from "@/components/ui/skeleton";

const formatTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  day: "numeric",
});

const notificationTone: Record<string, "default" | "success" | "warning"> = {
  system: "default",
  mentor: "success",
  project: "default",
  session: "warning",
  badge: "warning",
  xp: "success",
};

function NewsCard({ item }: { item: NotificationItem }) {
  const tone = notificationTone[item.type ?? "system"] ?? "default";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[var(--secondary)] border border-blue-100/80 flex-shrink-0 shadow-2xs">
        <Sparkles size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={tone}>{item.type ?? "update"}</Badge>
          <span className="text-xs text-slate-600 font-medium">{formatTime.format(new Date(item.createdAt))}</span>
          {!item.isRead ? <span className="text-xs font-semibold text-amber-600">New</span> : null}
        </div>
        {item.link ? (
          <Link
            to={item.link}
            className="mt-2 block text-sm leading-6 text-slate-900 hover:text-primary transition-colors font-medium"
          >
            {item.message}
          </Link>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-900 font-medium">{item.message}</p>
        )}
      </div>
    </div>
  );
}

function MessageRow({ msg, currentUserId }: { msg: RealtimeChatMessage; currentUserId?: string }) {
  return (
    <div className={`flex gap-3 ${msg.mine ? "flex-row-reverse text-right" : ""}`}>
      <Avatar name={msg.author ?? "Member"} size="sm" />
      <div
        className={`max-w-[85%] rounded-xl border px-4 py-3 shadow-xs ${
          msg.system
            ? "border-slate-200/80 bg-slate-100/80 text-slate-800"
            : msg.mine
              ? "border-slate-300 bg-slate-100 text-slate-900"
              : "border-slate-200/80 bg-white text-slate-900"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wider text-slate-600 font-bold">
            {msg.author ?? (msg.userId === currentUserId ? "You" : "Member")}
          </p>
          <span className="text-[11px] text-slate-600 font-medium font-mono">
            {new Date(msg.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-slate-800 leading-relaxed">{msg.text}</p>
      </div>
    </div>
  );
}

export function SquadPage() {
  const { id } = useParams<{ id: string }>();
  const roomId = id ? `squad-${id}` : "";
  const user = useAuthStore((s) => s.user);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<RealtimeChatMessage[]>([
    {
      id: "welcome",
      messageId: "welcome",
      roomId,
      text: "News center is live. Share updates, blockers, and wins with your squad.",
      author: "EthioTech",
      at: new Date().toISOString(),
      system: true,
      status: "delivered",
    },
  ]);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "me"],
    queryFn: () => fetchMyNotifications(),
    enabled: !!user,
  });

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
    enabled: !!user,
  });

  const squadQuery = useQuery({
    queryKey: ["peer-group", id],
    queryFn: () => fetchPeerGroupById(id!),
    enabled: Boolean(id) && !!user,
  });

  const dashboard = dashboardQuery.data as StudentDashboardData | undefined;

  const { connectionStatus, presenceCount, connectionQuality, pendingCount, isOnline, roomState, sendMessage } =
    useRealtimeRoom({
      roomId: id ? roomId : "squad-idle",
      userId: user?.id,
      onMessage: (message) => {
        setMessages((prev) => upsertChatMessage(prev, message));
      },
    });

  const newsItems = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);

  if (!id) {
    return (
      <EmptyState
        title="Squad not found"
        description="Choose a squad from your collaboration list."
        actionLabel="View Squads"
        actionHref="/app/squads"
      />
    );
  }

  if (squadQuery.isLoading) {
    return <Skeleton className="h-64 w-full rounded-[24px]" />;
  }

  const unreadCount = notificationsQuery.data?.filter((item) => !item.isRead).length ?? 0;
  const activeProjects = dashboard?.assignedProjects?.filter((project) => project.category === "active").length ?? 0;
  const feedbackReady = dashboard?.assignedProjects?.filter((project) => project.category === "feedback").length ?? 0;
  const completedProjects =
    dashboard?.assignedProjects?.filter((project) => project.category === "completed").length ?? 0;

  const sendDraft = () => {
    const text = draft.trim();
    if (!text) return;

    sendMessage(text, { author: user?.fullName ?? "You", userId: user?.id });
    setDraft("");
  };

  if (notificationsQuery.isError || dashboardQuery.isError) {
    return (
      <QueryError
        message="Unable to load the squad workspace."
        onRetry={() => {
          void notificationsQuery.refetch();
          void dashboardQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="page-shell grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6 text-slate-900">
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {squadQuery.data?.name ?? "Squad"}
              </h1>
              <p className="text-xs text-[var(--secondary)] font-bold font-mono">
                Group XP: {squadQuery.data?.groupXP ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-600 font-medium">
                Chat with your squad and coordinate project progress in real time.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" size="sm" className="font-medium border-slate-200">
                {presenceCount} online
              </Badge>
              <Badge variant={isOnline ? "success" : "warning"} size="sm">
                {isOnline ? "Live" : "Reconnecting"}
              </Badge>
              <Badge variant="outline" size="sm" className="font-medium border-slate-200">
                {connectionQuality} network
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <h2 className="text-sm font-bold text-slate-900">Recent Squad Updates</h2>
            <Badge variant="success" size="sm">
              {unreadCount} new
            </Badge>
          </div>
          <div className="mt-4 space-y-2.5">
            {newsItems.length ? (
              newsItems.slice(0, 6).map((item) => <NewsCard key={item._id} item={item} />)
            ) : (
              <EmptyState
                title="No squad updates yet"
                description="Notifications and project updates will appear here as your squad moves."
              />
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <h2 className="text-sm font-bold text-slate-900">Squad Chat & Activity</h2>
            <Badge variant={connectionStatus === "connected" ? "success" : "warning"} size="sm">
              {connectionStatus === "connected" ? "Connected" : "Reconnecting"}
            </Badge>
          </div>

          <div className="mt-4 grid gap-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 lg:grid-cols-[1fr_280px] dark:bg-white/[0.02] dark:border-white/10">
            <div className="space-y-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-600 font-bold">
                <MessageSquare size={13} className="text-[var(--secondary)]" />
                <span>Room Messages</span>
              </div>
              <div className="max-h-[22rem] space-y-2.5 overflow-y-auto pr-1" aria-live="polite">
                {messages.map((msg) => (
                  <MessageRow key={msg.id} msg={msg} currentUserId={user?.id} />
                ))}
              </div>

              <div className="flex gap-2 border-t border-slate-200/80 pt-3.5">
                <Input
                  placeholder={isOnline ? "Share a squad update..." : "Type now and we'll send when you reconnect..."}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && sendDraft()}
                  className="bg-white border-slate-300 text-xs h-10 text-slate-900 placeholder:text-slate-600 font-medium focus:border-slate-500 focus:ring-2 focus:ring-slate-900/5 shadow-2xs rounded-xl"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={sendDraft}
                  aria-label="Send squad update"
                  className="h-10 px-4 rounded-xl bg-primary hover:bg-[var(--primary-hover)] text-white shadow-xs whitespace-nowrap"
                >
                  <Send size={13} />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-slate-600 font-medium tracking-wider">Presence</p>
                <p className="mt-1 text-xl font-bold text-slate-900 font-mono">{presenceCount}</p>
                <p className="mt-0.5 text-xs text-slate-600 font-medium">{pendingCount} queued for sync</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-slate-600 font-medium tracking-wider">
                  Squad Progress
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span>Current sprint</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {dashboard?.progressByTrack?.[0]?.overallProgressPercent ?? 0}%
                    </span>
                  </div>
                  <ProgressBar
                    value={dashboard?.progressByTrack?.[0]?.overallProgressPercent ?? 0}
                    max={100}
                    color="primary"
                    className="h-2 bg-slate-100 rounded-full"
                  />
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-2 text-center dark:bg-white/[0.02] dark:border-white/10">
                    <p className="text-[9px] uppercase font-bold text-slate-600 font-medium">Active</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900 font-mono">{activeProjects}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-2 text-center dark:bg-white/[0.02] dark:border-white/10">
                    <p className="text-[9px] uppercase font-bold text-slate-600 font-medium">Feedback</p>
                    <p className="mt-0.5 text-sm font-bold text-[var(--secondary)] font-mono">{feedbackReady}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-2 text-center dark:bg-white/[0.02] dark:border-white/10">
                    <p className="text-[9px] uppercase font-bold text-slate-600 font-medium">Approved</p>
                    <p className="mt-0.5 text-sm font-bold text-emerald-600 font-mono">{completedProjects}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[var(--secondary)] border border-blue-100 shadow-2xs">
              <Users size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Squad Overview</p>
              <p className="text-[11px] text-slate-600 font-medium">Realtime room telemetry</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2.5">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:bg-white/[0.02] dark:border-white/10">
              <p className="text-[10px] uppercase font-bold text-slate-600 font-medium tracking-wider">Room Members</p>
              <p className="mt-1 text-lg font-bold text-slate-900 font-mono">
                {roomState?.connectedUserIds?.length ?? presenceCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:bg-white/[0.02] dark:border-white/10">
              <p className="text-[10px] uppercase font-bold text-slate-600 font-medium tracking-wider">Notifications</p>
              <p className="mt-1 text-lg font-bold text-[var(--secondary)] font-mono">{newsItems.length}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-medium">Upcoming Sessions</h3>
            <Link
              to="/app/sessions"
              className="text-xs text-primary hover:text-[var(--primary-hover)] font-semibold transition"
            >
              View All
            </Link>
          </div>

          <div className="mt-3.5 space-y-2">
            {(dashboard?.upcomingSessions ?? []).slice(0, 3).length ? (
              (dashboard?.upcomingSessions ?? []).slice(0, 3).map((session) => (
                <div
                  key={session._id ?? session.title}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 transition hover:border-slate-300 dark:bg-white/[0.02] dark:border-white/10"
                >
                  <p className="text-xs font-semibold text-slate-900">{session.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600 font-medium">
                    {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "Scheduled soon"}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState title="No upcoming sessions" description="Sessions will appear here once scheduled." />
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm space-y-2.5">
          <Link to="/app/projects">
            <Button
              className="w-full text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs whitespace-nowrap"
              size="sm"
            >
              Open Projects
            </Button>
          </Link>
          <Link to="/app/tracks">
            <Button
              className="w-full text-xs font-semibold rounded-xl text-slate-700 border-slate-200 hover:bg-slate-50 whitespace-nowrap"
              variant="outline"
              size="sm"
            >
              Browse Tracks
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}

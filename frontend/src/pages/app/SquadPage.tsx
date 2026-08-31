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

const notificationTone: Record<string, "default" | "purple" | "success" | "warning"> = {
  system: "purple",
  mentor: "success",
  project: "default",
  session: "warning",
  badge: "purple",
  xp: "success",
};

function NewsCard({ item }: { item: NotificationItem }) {
  const tone = notificationTone[item.type ?? "system"] ?? "default";

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={tone}>{item.type ?? "update"}</Badge>
          <span className="text-xs text-[var(--text-muted)]">{formatTime.format(new Date(item.createdAt))}</span>
          {!item.isRead ? <span className="text-xs text-warning">New</span> : null}
        </div>
        {item.link ? (
          <Link to={item.link} className="mt-2 block text-sm leading-6 text-white hover:text-primary">
            {item.message}
          </Link>
        ) : (
          <p className="mt-2 text-sm leading-6 text-white">{item.message}</p>
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
        className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
          msg.system
            ? "border-primary/20 bg-primary/10"
            : msg.mine
              ? "border-primary/30 bg-primary/15"
              : "border-[var(--border)] bg-[var(--bg-card)]"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
            {msg.author ?? (msg.userId === currentUserId ? "You" : "Member")}
          </p>
          <span className="text-[11px] text-[var(--text-muted)]">{new Date(msg.at).toLocaleTimeString()}</span>
        </div>
        <p className="mt-2 text-sm text-white">{msg.text}</p>
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
  });

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
  });

  const squadQuery = useQuery({
    queryKey: ["peer-group", id],
    queryFn: () => fetchPeerGroupById(id!),
    enabled: Boolean(id),
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
        actionLabel="View squads"
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
      <div className="space-y-6 text-[var(--text-primary)]">
        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {squadQuery.data?.name ?? "Squad"}
              </h1>
              <p className="text-xs text-emerald-400 font-semibold">Group XP: {squadQuery.data?.groupXP ?? 0}</p>
              <p className="text-xs text-zinc-400">
                Chat with your squad and coordinate project progress in real time.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="purple" size="sm">{presenceCount} online</Badge>
              <Badge variant={isOnline ? "success" : "warning"} size="sm">{isOnline ? "Live" : "Reconnecting"}</Badge>
              <Badge variant="default" size="sm">{connectionQuality} network</Badge>
            </div>
          </div>
        </Card>

        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#27272A] pb-3">
            <h2 className="text-sm font-semibold text-white">Recent Squad Updates</h2>
            <Badge variant="success" size="sm">{unreadCount} new</Badge>
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

        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#27272A] pb-3">
            <h2 className="text-sm font-semibold text-white">Squad Chat & Activity</h2>
            <Badge variant={connectionStatus === "connected" ? "success" : "warning"} size="sm">
              {connectionStatus === "connected" ? "Connected" : "Reconnecting"}
            </Badge>
          </div>

          <div className="mt-4 grid gap-4 rounded-xl border border-[#27272A] bg-[#141418] p-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                <MessageSquare size={12} />
                <span>Room Messages</span>
              </div>
              <div className="max-h-[22rem] space-y-2.5 overflow-y-auto pr-1" aria-live="polite">
                {messages.map((msg) => (
                  <MessageRow key={msg.id} msg={msg} currentUserId={user?.id} />
                ))}
              </div>

              <div className="flex gap-2 border-t border-[#27272A] pt-3">
                <Input
                  placeholder={isOnline ? "Share a squad update..." : "Type now and we'll send when you reconnect..."}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && sendDraft()}
                  className="bg-[#0E0E11] border-[#27272A] text-xs h-8"
                />
                <Button type="button" size="sm" onClick={sendDraft} aria-label="Send squad update" className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500">
                  <Send size={13} />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-[#27272A] bg-[#0E0E11] p-3.5">
                <p className="text-[10px] uppercase font-semibold text-zinc-500">Presence</p>
                <p className="mt-1 text-xl font-bold text-white">{presenceCount}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{pendingCount} queued for sync</p>
              </div>
              <div className="rounded-lg border border-[#27272A] bg-[#0E0E11] p-3.5">
                <p className="text-[10px] uppercase font-semibold text-zinc-500">Squad Progress</p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Current sprint</span>
                    <span className="font-semibold text-white">{dashboard?.progressByTrack?.[0]?.overallProgressPercent ?? 0}%</span>
                  </div>
                  <ProgressBar
                    value={dashboard?.progressByTrack?.[0]?.overallProgressPercent ?? 0}
                    max={100}
                    color="primary"
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <div className="rounded-md border border-[#27272A] bg-[#141418] p-2 text-center">
                    <p className="text-[9px] uppercase font-semibold text-zinc-500">Active</p>
                    <p className="mt-0.5 text-sm font-bold text-white">{activeProjects}</p>
                  </div>
                  <div className="rounded-md border border-[#27272A] bg-[#141418] p-2 text-center">
                    <p className="text-[9px] uppercase font-semibold text-zinc-500">Feedback</p>
                    <p className="mt-0.5 text-sm font-bold text-white">{feedbackReady}</p>
                  </div>
                  <div className="rounded-md border border-[#27272A] bg-[#141418] p-2 text-center">
                    <p className="text-[9px] uppercase font-semibold text-zinc-500">Approved</p>
                    <p className="mt-0.5 text-sm font-bold text-white">{completedProjects}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-[#27272A] bg-[#0E0E11] p-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users size={15} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Squad Overview</p>
              <p className="text-[11px] text-zinc-400">Realtime room telemetry</p>
            </div>
          </div>
          <div className="mt-3.5 grid gap-2.5">
            <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3">
              <p className="text-[10px] uppercase font-semibold text-zinc-500">Room Members</p>
              <p className="mt-1 text-lg font-bold text-white">
                {roomState?.connectedUserIds?.length ?? presenceCount}
              </p>
            </div>
            <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3">
              <p className="text-[10px] uppercase font-semibold text-zinc-500">Notifications</p>
              <p className="mt-1 text-lg font-bold text-white">{newsItems.length}</p>
            </div>
          </div>
        </Card>

        <Card className="border-[#27272A] bg-[#0E0E11] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[#27272A] pb-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Upcoming Sessions</h3>
            <Link to="/app/sessions" className="text-xs text-indigo-400 hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-3 space-y-2">
            {(dashboard?.upcomingSessions ?? []).slice(0, 3).length ? (
              (dashboard?.upcomingSessions ?? []).slice(0, 3).map((session) => (
                <div
                  key={session._id ?? session.title}
                  className="rounded-lg border border-[#27272A] bg-[#141418] p-3"
                >
                  <p className="text-xs font-medium text-white">{session.title}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "Scheduled soon"}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No upcoming sessions"
                description="Sessions will appear here once scheduled."
              />
            )}
          </div>
        </Card>

        <Card className="border-[#27272A] bg-[#0E0E11] p-5 shadow-sm space-y-2">
          <Link to="/app/projects">
            <Button className="w-full text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white" size="sm">
              Open Projects Hub
            </Button>
          </Link>
          <Link to="/app/tracks">
            <Button className="w-full text-xs text-zinc-300" variant="outline" size="sm">
              Browse Learning Tracks
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}

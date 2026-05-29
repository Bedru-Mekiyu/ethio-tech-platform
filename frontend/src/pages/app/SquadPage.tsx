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
    queryFn: fetchMyNotifications,
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
  const completedProjects = dashboard?.assignedProjects?.filter((project) => project.category === "completed").length ?? 0;

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
      <div className="space-y-6">
        <Card className="hero-shell p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="mb-4">News center squad</Badge>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {squadQuery.data?.name ?? "Squad"} · collaboration room
              </h1>
              <p className="mt-2 text-sm text-success">Group XP: {squadQuery.data?.groupXP ?? 0}</p>
              <p className="mt-3 text-[var(--text-secondary)]">
                Keep a shared pulse on mentor updates, project progress, and your realtime room without leaving the learning flow.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="purple">{presenceCount} online</Badge>
              <Badge variant={isOnline ? "success" : "warning"}>{isOnline ? "Sync live" : "Offline queue"}</Badge>
              <Badge variant="default">{connectionQuality} network</Badge>
            </div>
          </div>
        </Card>

        <Card className="surface-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="purple">News feed</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white">Squad activity stream</h2>
            </div>
            <Badge variant="success">{unreadCount} new</Badge>
          </div>
          <div className="mt-6 space-y-3">
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

        <Card className="surface-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="purple">Live chat</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white">Realtime squad room</h2>
            </div>
            <Badge variant={connectionStatus === "connected" ? "success" : "warning"}>
              {connectionStatus === "connected" ? "Connected" : "Reconnecting"}
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(8,14,24,0.96),rgba(8,14,24,0.9))] p-4 lg:grid-cols-[1fr_300px]">
            <div className="space-y-3">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <MessageSquare size={14} />
                <span>Room messages</span>
              </div>
              <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1" aria-live="polite">
                {messages.map((msg) => (
                  <MessageRow key={msg.id} msg={msg} currentUserId={user?.id} />
                ))}
              </div>

              <div className="flex gap-2 border-t border-[var(--border)] pt-4">
                <Input
                  placeholder={isOnline ? "Share a squad update..." : "Type now and we'll send when you reconnect..."}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && sendDraft()}
                />
                <Button type="button" onClick={sendDraft} aria-label="Send squad update">
                  <Send size={16} />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <p className="stat-label">Presence</p>
                <p className="mt-2 text-3xl font-semibold text-white">{presenceCount}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{pendingCount} messages queued for sync.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <p className="stat-label">Squad progress</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between stat-label">
                    <span>Current sprint</span>
                    <span>{dashboard?.progressByTrack?.[0]?.overallProgressPercent ?? 0}%</span>
                  </div>
                  <ProgressBar value={dashboard?.progressByTrack?.[0]?.overallProgressPercent ?? 0} max={100} color="primary" />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <Card className="border-[var(--border)] bg-[var(--bg-card)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Active</p>
                    <p className="mt-2 text-xl font-semibold text-white">{activeProjects}</p>
                  </Card>
                  <Card className="border-[var(--border)] bg-[var(--bg-card)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Feedback</p>
                    <p className="mt-2 text-xl font-semibold text-white">{feedbackReady}</p>
                  </Card>
                  <Card className="border-[var(--border)] bg-[var(--bg-card)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Done</p>
                    <p className="mt-2 text-xl font-semibold text-white">{completedProjects}</p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="surface-panel p-5">
          <div className="flex items-center gap-3">
            <Users className="text-primary" size={20} />
            <div>
              <p className="stat-label">Squad pulse</p>
              <p className="text-lg font-semibold text-white">Realtime overview</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
              <p className="stat-label">Room members</p>
              <p className="mt-2 text-2xl font-semibold text-white">{roomState?.connectedUserIds?.length ?? presenceCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
              <p className="stat-label">Notifications</p>
              <p className="mt-2 text-2xl font-semibold text-white">{newsItems.length}</p>
            </div>
          </div>
        </Card>

        <Card className="surface-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="purple">Upcoming sessions</Badge>
              <h3 className="mt-3 text-xl font-semibold text-white">What is next for the squad</h3>
            </div>
            <Link to="/app/sessions" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {(dashboard?.upcomingSessions ?? []).slice(0, 3).length ? (
              (dashboard?.upcomingSessions ?? []).slice(0, 3).map((session) => (
                <div key={session._id ?? session.title} className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">{session.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "Scheduled soon"}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState title="No upcoming sessions" description="Sessions will appear here once they are scheduled." />
            )}
          </div>
        </Card>

        <Card className="surface-panel p-5">
          <Badge variant="success">Quick links</Badge>
          <div className="mt-4 space-y-3">
            <Link to="/app/projects">
              <Button className="w-full" variant="primary">
                Open project hub
              </Button>
            </Link>
            <Link to="/app/tracks">
              <Button className="w-full" variant="outline">
                Browse learning tracks
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

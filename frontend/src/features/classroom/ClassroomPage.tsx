import { lazy, Suspense, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLiveAccess } from "@/services/sessionsService";
import { Send, Signal, Sparkles, Users, Wifi, WifiOff, type LucideIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeRoom } from "@/hooks/useRealtimeRoom";
import { createSystemEvent, upsertChatMessage, type ConnectionStatus, type RealtimeChatMessage, type RealtimeRoomState, type RealtimeSystemEvent } from "@/lib/realtime";

const ClassroomScene = lazy(() => import("./ClassroomScene"));

const statusMeta: Record<ConnectionStatus, { label: string; icon: LucideIcon; className: string }> = {
  connecting: { label: "Syncing", icon: Signal, className: "bg-primary/15 text-primary border-primary/30" },
  connected: { label: "Connected", icon: Wifi, className: "bg-success/15 text-success border-success/30" },
  reconnecting: { label: "Reconnecting", icon: WifiOff, className: "bg-warning/15 text-warning border-warning/30" },
  disconnected: { label: "Offline", icon: WifiOff, className: "bg-secondary/15 text-white border-secondary/30" },
  error: { label: "Connection issue", icon: WifiOff, className: "bg-danger/15 text-danger border-danger/30" },
};

const getNetworkLabel = (quality?: RealtimeRoomState["connectionQuality"]) => {
  switch (quality) {
    case "excellent":
      return "High quality sync";
    case "good":
      return "Adaptive classroom";
    case "fair":
      return "Constrained network";
    case "poor":
      return "Low-bandwidth mode";
    case "offline":
      return "Offline queue active";
    default:
      return "Adaptive";
  }
};

const participantLabel = (userId: string, currentUserId?: string) => {
  if (userId === currentUserId) return "You";
  return `Learner ${userId.slice(-4).toUpperCase()}`;
};

export function ClassroomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: liveAccess } = useQuery({
    queryKey: ["live-access", sessionId],
    queryFn: () => getLiveAccess(sessionId!),
    enabled: !!sessionId && sessionId !== "demo",
  });
  const roomId = liveAccess?.roomId ?? `session-${sessionId ?? "demo"}`;
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<RealtimeChatMessage[]>([
    {
      id: "welcome",
      messageId: "welcome",
      roomId,
      text: "Classroom is live. Ask a question or share a blocker.",
      author: "EthioTech",
      at: new Date().toISOString(),
      system: true,
      status: "delivered",
    },
  ]);
  const [events, setEvents] = useState<RealtimeSystemEvent[]>([
    createSystemEvent("Session ready", "Low-bandwidth classroom mode is prepared for this room."),
  ]);
  const [roomState, setRoomState] = useState<RealtimeRoomState | null>(null);

  const { connectionStatus, presenceCount, connectionQuality, pendingCount, isOnline, sendMessage } =
    useRealtimeRoom({
      roomId,
      userId: user?.id,
      onMessage: (message) => {
        setMessages((prev) => upsertChatMessage(prev, message));
      },
      onState: setRoomState,
      onEvent: (title, detail) => {
        setEvents((prev) => [createSystemEvent(title, detail), ...prev].slice(0, 4));
      },
    });

  const meta = statusMeta[connectionStatus];
  const StatusIcon = meta.icon;
  const activityLabel = getNetworkLabel(roomState?.connectionQuality ?? connectionQuality);
  const roster = useMemo(
    () => (roomState?.connectedUserIds ?? []).map((participantId) => participantLabel(participantId, user?.id)),
    [roomState?.connectedUserIds, user?.id]
  );

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    sendMessage(text, { author: user?.fullName ?? "You", userId: user?.id });
    setDraft("");
    setEvents((prev) => [createSystemEvent("Shared a question", "Your message is now visible to the room."), ...prev].slice(0, 4));
  };

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section
        id="classroom-scene"
        className="relative min-h-[440px] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(160deg,rgba(0,210,255,0.1),rgba(17,24,35,0.96)_40%,rgba(123,97,255,0.12))] shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%)]" />
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <Card className="w-full max-w-md text-center">
                <Skeleton className="mx-auto h-3 w-24" />
                <Skeleton className="mx-auto mt-4 h-10 w-56" />
                <Skeleton className="mx-auto mt-3 h-4 w-72 max-w-full" />
              </Card>
            </div>
          }
        >
          <ClassroomScene />
        </Suspense>

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge variant="purple">Session {sessionId}</Badge>
          <Badge className={meta.className}>
            <StatusIcon size={14} className="mr-1 inline" />
            {meta.label}
          </Badge>
          <Badge variant="success">
            <Users size={14} className="mr-1 inline" />
            {presenceCount} in room
          </Badge>
        </div>

        <div className="absolute right-4 top-4 hidden max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 p-4 backdrop-blur md:block">
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Classroom atmosphere</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Built for collaboration on weak networks, with presence-aware sync and a calm learning pace.
          </p>
        </div>

        <div className="absolute bottom-4 left-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/85 px-4 py-3 backdrop-blur">
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Live guidance</p>
          <p className="mt-1 text-sm text-white">Stay focused. Every question is part of your progress.</p>
        </div>
      </section>

      <aside className="flex min-h-0 flex-col gap-4">
        <Card id="classroom-activity" className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary">Room activity</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Realtime classroom</h2>
            </div>
            <Badge className={meta.className}>
              <StatusIcon size={14} className="mr-1 inline" />
              {meta.label}
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Presence</p>
              <p className="mt-2 text-2xl font-bold text-white">{presenceCount}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Learners and mentors currently in the room.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Network posture</p>
              <p className="mt-2 text-2xl font-bold text-white">{activityLabel}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {isOnline ? "The room is optimized to recover after brief disconnects." : "Messages are queued until connectivity returns."}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Media mode</p>
              <p className="mt-2 text-sm font-semibold text-white">Chat-first collaboration</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Audio/video streaming is rolling out, so the room is optimized for realtime chat, presence cues, and shared prompts.
              </p>
              <Badge variant="warning" className="mt-3">
                Streaming is in rollout
              </Badge>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Classroom circle</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(roster.length ? roster : ["Arriving..."]).map((name) => (
                  <Badge key={name} variant="purple">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Room health</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {roomState?.messageCount ?? messages.length} messages tracked · {pendingCount} queued offline
              </p>
            </div>
            {events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <p className="text-sm font-medium text-white">{event.title}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.detail}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">{new Date(event.at).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card
          id="classroom-chat"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)] p-0"
        >
          <div className="border-b border-[var(--border)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-primary">Live chat</p>
                <h3 className="text-lg font-semibold text-white">Ask, respond, build</h3>
              </div>
              <Badge variant="purple">
                <Sparkles size={14} className="mr-1 inline" />
                Collaborative
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
              <span>{roomState?.messageCount ?? messages.length} messages tracked</span>
              <span>•</span>
              <span>{pendingCount} queued offline</span>
              <span>•</span>
              <span>{connectionQuality} link quality</span>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.mine ? "flex-row-reverse text-right" : ""}`}>
                <Avatar name={msg.author} size="sm" />
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
                    <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{msg.author}</p>
                    <span className="text-[11px] text-[var(--text-muted)]">{new Date(msg.at).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-white">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{isOnline ? "Low-bandwidth safe" : "Offline queue enabled"}</span>
              <span>{connectionStatus === "connected" ? "Synced" : "Reconnecting automatically"}</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={isOnline ? "Ask a question…" : "Draft your question — it will send later"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button type="button" onClick={handleSend} aria-label="Send message">
                <Send size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}

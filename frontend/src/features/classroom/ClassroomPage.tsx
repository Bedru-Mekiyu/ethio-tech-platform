import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  CameraOff,
  Code2,
  MessagesSquare,
  Mic,
  MicOff,
  MonitorPlay,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Signal,
  Sparkles,
  SquareDashedMousePointer,
  Users,
  Video,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import { useRealtimeRoom } from "@/hooks/useRealtimeRoom";
import { getLiveAccess, fetchSessionById } from "@/services/sessionsService";
import {
  createSystemEvent,
  upsertChatMessage,
  type ConnectionStatus,
  type RealtimeChatMessage,
  type RealtimeRoomState,
  type RealtimeSystemEvent,
} from "@/lib/realtime";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { cn } from "@/lib/utils";

const ClassroomScene = lazy(() => import("./ClassroomScene"));

const statusMeta: Record<ConnectionStatus, { label: string; icon: LucideIcon; className: string }> = {
  connecting: { label: "Syncing", icon: Signal, className: "bg-primary/15 text-primary border-primary/30" },
  connected: { label: "Connected", icon: Wifi, className: "bg-success/15 text-success border-success/30" },
  reconnecting: { label: "Reconnecting", icon: WifiOff, className: "bg-warning/15 text-warning border-warning/30" },
  disconnected: { label: "Offline", icon: WifiOff, className: "bg-secondary/15 text-white border-secondary/30" },
  error: { label: "Connection issue", icon: WifiOff, className: "bg-danger/15 text-danger border-danger/30" },
};

const panelTabs = ["chat", "participants", "notes"] as const;
type PanelTab = (typeof panelTabs)[number];

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

const fallbackParticipantLabel = (userId: string, currentUserId?: string) => {
  if (userId === currentUserId) return "You";
  return `Learner ${userId.slice(-4).toUpperCase()}`;
};

function ClassroomShellSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 rounded-[24px]" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Skeleton className="min-h-[32rem] rounded-[28px]" />
        <Skeleton className="min-h-[32rem] rounded-[28px]" />
      </div>
    </div>
  );
}

function SessionBadge({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/85 px-4 py-3">
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        <Icon size={14} />
        <span className="text-[10px] uppercase tracking-[0.22em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SidebarStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{detail}</p>
    </div>
  );
}

function MessageThread({
  messages,
  userId,
}: {
  messages: RealtimeChatMessage[];
  userId?: string;
}) {
  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div key={msg.id} className={cn("flex gap-3", msg.mine ? "flex-row-reverse text-right" : "")}>
          <Avatar name={msg.author} size="sm" />
          <div
            className={cn(
              "max-w-[85%] rounded-2xl border px-4 py-3",
              msg.system
                ? "border-primary/20 bg-primary/10"
                : msg.mine
                  ? "border-primary/30 bg-primary/15"
                  : "border-[var(--border)] bg-[var(--bg-card)]"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{msg.author}</p>
              <span className="text-[11px] text-[var(--text-muted)]">{new Date(msg.at).toLocaleTimeString()}</span>
            </div>
            <p className="mt-2 text-sm text-white">{msg.text}</p>
          </div>
        </div>
      ))}
      {messages.length === 0 ? (
        <EmptyState
          title="No chat yet"
          description="Start the room with a question, a note, or a blocker."
          actionLabel={userId ? "Write a message" : undefined}
        />
      ) : null}
    </div>
  );
}

export function ClassroomPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const user = useAuthStore((s) => s.user);
  const [activePanel, setActivePanel] = useState<PanelTab>("chat");
  const [draft, setDraft] = useState("");
  const [audioMuted, setAudioMuted] = useState(false);
  const [cameraHidden, setCameraHidden] = useState(true);
  const [compactScene, setCompactScene] = useState(false);
  const [messages, setMessages] = useState<RealtimeChatMessage[]>([]);
  const [events, setEvents] = useState<RealtimeSystemEvent[]>([]);
  const [roomState, setRoomState] = useState<RealtimeRoomState | null>(null);

  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchSessionById(sessionId!),
    enabled: !!sessionId && sessionId !== "demo",
  });

  const liveAccessQuery = useQuery({
    queryKey: ["live-access", sessionId],
    queryFn: () => getLiveAccess(sessionId!),
    enabled: !!sessionId && sessionId !== "demo",
  });

  const roomId = liveAccessQuery.data?.roomId ?? sessionQuery.data?.liveRoomId ?? `session-${sessionId ?? "demo"}`;
  const session = sessionQuery.data;

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

  const sessionTitle = session?.title ?? "Virtual classroom";
  const mentor = session?.mentor;
  type RosterPerson = {
    id: string;
    name: string;
    avatar?: string;
    role: "mentor" | "student" | "participant";
    level?: number;
  };
  const sessionParticipants = useMemo(() => session?.participants ?? [], [session?.participants]);
  const roster = useMemo(
    () => {
      const known: RosterPerson[] = sessionParticipants.map((participant) => ({
        id: participant._id ?? participant.fullName ?? "participant",
        name: participant.fullName ?? "Learner",
        avatar: participant.avatar,
        role: (participant.role as RosterPerson["role"]) ?? "student",
        level: participant.level,
      }));

      const ids = roomState?.connectedUserIds ?? [];
      const liveIds: RosterPerson[] = ids
        .filter((participantId) => !known.some((person) => person.id === participantId))
        .map((participantId) => ({
          id: participantId,
          name: fallbackParticipantLabel(participantId, user?.id),
          role: "participant",
        }));

      return mentor
        ? [
            {
              id: mentor._id ?? mentor.fullName ?? "mentor",
              name: mentor.fullName ?? "Mentor",
              avatar: mentor.avatar,
              role: (mentor.role as RosterPerson["role"]) ?? "mentor",
              level: mentor.mentorScore,
            },
            ...known,
            ...liveIds,
          ]
        : [...known, ...liveIds];
    },
    [mentor, roomState?.connectedUserIds, sessionParticipants, user?.id]
  );

  const meta = statusMeta[connectionStatus];
  const StatusIcon = meta.icon;
  const activityLabel = getNetworkLabel(roomState?.connectionQuality ?? connectionQuality);
  const showControls = !compactScene;
  const fallbackRoster: RosterPerson[] = [{ id: "arriving", name: "Arriving...", role: "participant" }];

  useEffect(() => {
    queueMicrotask(() => {
      setMessages([
        {
          id: `welcome-${roomId}`,
          messageId: `welcome-${roomId}`,
          roomId,
          text: "Classroom is live. Ask a question or share a blocker.",
          author: "EthioTech",
          at: new Date().toISOString(),
          system: true,
          status: "delivered",
        },
      ]);
      setEvents([
        createSystemEvent("Session ready", "Low-bandwidth classroom mode is prepared for this room."),
      ]);
      setRoomState(null);
      setActivePanel("chat");
    });
  }, [roomId]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    sendMessage(text, { author: user?.fullName ?? "You", userId: user?.id });
    setDraft("");
    setEvents((prev) => [createSystemEvent("Shared a question", "Your message is now visible to the room."), ...prev].slice(0, 4));
  };

  if (sessionQuery.isError || liveAccessQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message="Unable to open this classroom session."
          onRetry={() => {
            void sessionQuery.refetch();
            void liveAccessQuery.refetch();
          }}
        />
      </div>
    );
  }

  if (sessionQuery.isLoading || liveAccessQuery.isLoading) {
    return <ClassroomShellSkeleton />;
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-elevated)]/90 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="purple">Live classroom</Badge>
              <Badge className={meta.className}>
                <StatusIcon size={14} className="mr-1 inline" />
                {meta.label}
              </Badge>
              <Badge variant="success">
                <Users size={14} className="mr-1 inline" />
                {presenceCount} in room
              </Badge>
            </div>
            <h1 className="mt-3 truncate text-2xl font-bold text-white md:text-3xl">{sessionTitle}</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
              {mentor?.fullName ? `Mentored by ${mentor.fullName}` : "Mentored live with realtime collaboration and weak-network resilience."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setCompactScene((value) => !value)}
              aria-pressed={compactScene}
            >
              {compactScene ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              {compactScene ? "Expand scene" : "Focus scene"}
            </Button>
            <Link to="/app/sessions">
              <Button variant="secondary">Back to sessions</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className={cn("grid gap-4", compactScene ? "xl:grid-cols-[minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,1fr)_380px]")}>
        <section
          id="classroom-scene"
          className="relative min-h-[26rem] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(160deg,rgba(0,210,255,0.1),rgba(17,24,35,0.96)_40%,rgba(123,97,255,0.12))] shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
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

          <div className="absolute left-4 top-4 flex max-w-[calc(100%-1rem)] flex-wrap gap-2">
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

          <div className="absolute left-1/2 top-4 hidden -translate-x-1/2 md:block">
            <Card className="min-w-[220px] border-primary/25 bg-[rgba(8,14,24,0.9)] p-3 text-center backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Instructor</p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <Avatar src={mentor?.avatar} name={mentor?.fullName ?? "Mentor"} size="md" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{mentor?.fullName ?? "Mentor"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Guiding the session</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="absolute right-4 top-4 hidden max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 p-4 backdrop-blur md:block">
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Classroom atmosphere</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Built for collaboration on weak networks, with presence-aware sync and a calm learning pace.
            </p>
          </div>

          <div className="absolute bottom-4 left-4 right-4 space-y-3">
            <Card className="border-[var(--border)] bg-[rgba(8,14,24,0.88)] p-4 backdrop-blur">
              <div className="grid gap-3 md:grid-cols-4">
                <SessionBadge icon={Video} label="Mode" value={session?.classroomMode ?? "immersive-3d"} />
                <SessionBadge icon={Code2} label="Collab" value={session?.codeCollabEnabled ? "Enabled" : "Paused"} />
                <SessionBadge icon={SquareDashedMousePointer} label="Whiteboard" value={session?.whiteboardEnabled ? "Enabled" : "Paused"} />
                <SessionBadge icon={MonitorPlay} label="Network" value={activityLabel} />
              </div>
            </Card>

            {showControls ? (
              <Card className="border-[var(--border)] bg-[rgba(8,14,24,0.95)] p-3 backdrop-blur">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button variant={audioMuted ? "danger" : "outline"} size="sm" onClick={() => setAudioMuted((value) => !value)}>
                    {audioMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    {audioMuted ? "Unmute" : "Mute"}
                  </Button>
                  <Button variant={cameraHidden ? "danger" : "outline"} size="sm" onClick={() => setCameraHidden((value) => !value)}>
                    {cameraHidden ? <CameraOff size={16} /> : <Camera size={16} />}
                    {cameraHidden ? "Show camera" : "Hide camera"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActivePanel("participants")}>
                    <Users size={16} />
                    Participants
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActivePanel("notes")}>
                    <NotebookPen size={16} />
                    Notes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActivePanel("chat")}>
                    <MessagesSquare size={16} />
                    Chat
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => navigate("/app/sessions")}>
                    Leave room
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        </section>

        {!compactScene ? (
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
                <SidebarStat
                  label="Presence"
                  value={String(presenceCount)}
                  detail="Learners and mentors currently in the room."
                />
                <SidebarStat
                  label="Messages"
                  value={String(roomState?.messageCount ?? messages.length)}
                  detail={`${pendingCount} queued offline messages`}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Network posture</p>
                  <p className="mt-2 text-2xl font-bold text-white">{activityLabel}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {isOnline ? "The room is optimized to recover after brief disconnects." : "Messages are queued until connectivity returns."}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Session meta</p>
                  <p className="mt-2 text-sm font-semibold text-white">{session?.durationMinutes ?? 60} minutes</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {session?.liveProvider ?? "custom"} provider · {session?.whiteboardEnabled ? "whiteboard on" : "whiteboard off"}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Classroom circle</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(roster.length ? roster : fallbackRoster).map((person) => (
                      <Badge key={person.id} variant={person.role === "mentor" ? "success" : "purple"}>
                        {person.name}
                      </Badge>
                    ))}
                  </div>
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
                <div className="mt-4 flex flex-wrap gap-2">
                  {panelTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActivePanel(tab)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs capitalize transition",
                        activePanel === tab
                          ? "bg-primary text-[var(--bg-base)]"
                          : "border border-[var(--border)] text-[var(--text-secondary)] hover:text-white"
                      )}
                      aria-pressed={activePanel === tab}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {activePanel === "chat" ? (
                  <MessageThread messages={messages} userId={user?.id} />
                ) : activePanel === "participants" ? (
                  <div className="space-y-3">
                    {roster.length ? (
                      roster.map((person) => (
                        <div key={person.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/5 p-3">
                          <Avatar src={person.avatar} name={person.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white">{person.name}</p>
                            <p className="text-xs text-[var(--text-muted)] capitalize">{person.role}</p>
                          </div>
                          {person.role === "mentor" ? <Badge variant="success">Mentor</Badge> : null}
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title="No participants yet"
                        description="Participants will appear once the room connects."
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.length ? (
                      events.map((event) => (
                        <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                          <p className="font-medium text-white">{event.title}</p>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.detail}</p>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title="No session notes yet"
                        description="Notes and highlights will appear as the classroom becomes active."
                      />
                    )}
                  </div>
                )}
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
        ) : null}
      </div>
    </div>
  );
}

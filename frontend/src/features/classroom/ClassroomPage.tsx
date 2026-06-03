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
  Hand,
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
import { useAgoraRoom } from "@/hooks/useAgoraRoom";
import { getLiveAccess, fetchSessionById, getAgoraConfig, getAgoraToken } from "@/services/sessionsService";
import { api } from "@/services/api";
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
import { VideoGrid } from "@/features/classroom/VideoGrid";
import { ScreenShareView } from "@/components/classroom/ScreenShareView";
import { VideoControls } from "@/components/classroom/VideoControls";
import { cn } from "@/lib/utils";

const ClassroomScene = lazy(() => import("./ClassroomScene"));

import { StudentQuestionsPanel } from "./panels/StudentQuestionsPanel";
import { StudentPollsPanel } from "./panels/StudentPollsPanel";
import { StudentResourcesPanel } from "./panels/StudentResourcesPanel";
import { StudentNotesPanel } from "./panels/StudentNotesPanel";

const statusMeta: Record<ConnectionStatus, { label: string; icon: LucideIcon; className: string }> = {
  connecting: { label: "Syncing", icon: Signal, className: "bg-primary/15 text-primary border-primary/30" },
  connected: { label: "Connected", icon: Wifi, className: "bg-success/15 text-success border-success/30" },
  reconnecting: { label: "Reconnecting", icon: WifiOff, className: "bg-warning/15 text-warning border-warning/30" },
  disconnected: { label: "Offline", icon: WifiOff, className: "bg-secondary/15 text-white border-secondary/30" },
  error: { label: "Connection issue", icon: WifiOff, className: "bg-danger/15 text-danger border-danger/30" },
};

const panelTabs = ["chat", "participants", "questions", "polls", "resources", "notes"] as const;
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

  // New Student Interactive States
  const [handRaised, setHandRaised] = useState(false);
  const [classroomQuestions, setClassroomQuestions] = useState<any[]>([]);
  const [livePolls, setLivePolls] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [classnotes] = useState<any>(null);

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

  const agoraConfigQuery = useQuery({
    queryKey: ["agora-config"],
    queryFn: getAgoraConfig,
    enabled: liveAccessQuery.data?.provider === "agora",
  });

  const agoraTokenQuery = useQuery({
    queryKey: ["agora-token", sessionId],
    queryFn: () => getAgoraToken(sessionId!),
    enabled: !!sessionId && sessionId !== "demo" && liveAccessQuery.data?.provider === "agora" && Boolean(agoraConfigQuery.data?.enabled),
  });

  const useVideo = liveAccessQuery.data?.provider === "agora" && Boolean(agoraConfigQuery.data?.enabled) && Boolean(agoraTokenQuery.data?.rtcToken);

  const agora = useAgoraRoom({
    appId: agoraConfigQuery.data?.appId || "",
    channel: agoraTokenQuery.data?.channelName || "",
    token: agoraTokenQuery.data?.rtcToken || null,
    uid: agoraTokenQuery.data?.uid,
    onTokenWillExpire: () => {
      if (sessionId && sessionId !== "demo") {
        getAgoraToken(sessionId).then(() => {
          // Token refresh would be handled by the hook in a real implementation
        }).catch(console.error);
      }
    },
  });

  const roomId = liveAccessQuery.data?.roomId ?? sessionQuery.data?.liveRoomId ?? `session-${sessionId ?? "demo"}`;
  const session = sessionQuery.data;

  const { connectionStatus, presenceCount, connectionQuality, pendingCount, isOnline, sendMessage, socketRef } =
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

  const handleAskQuestion = (text: string) => {
    if (!socketRef.current) return;
    const questionId = `q-${Date.now()}`;
    socketRef.current.emit("question:submit", { roomId, questionId, text });
  };

  const handleUpvoteQuestion = (questionId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit("question:upvote", { roomId, questionId });
    // Optimistic update
    setClassroomQuestions(prev => prev.map(q => 
      q.questionId === questionId ? { ...q, upvoteCount: (q.upvoteCount || 0) + 1, hasUpvoted: true } : q
    ));
  };

  const handleVotePoll = (pollId: string, optionIndex: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit("poll:vote", { roomId, pollId, optionIndex });
    // Optimistic update
    setLivePolls(prev => prev.map(p => 
      p.pollId === pollId ? { ...p, hasVoted: true } : p
    ));
  };

  const toggleHandRaise = () => {
    if (!socketRef.current) return;
    if (handRaised) {
      socketRef.current.emit("hand:lower", { roomId });
      setHandRaised(false);
    } else {
      socketRef.current.emit("hand:raise", { roomId });
      setHandRaised(true);
    }
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onQuestionNew = (payload: any) => {
      setClassroomQuestions((prev) => [payload, ...prev]);
      setEvents((prev) => [createSystemEvent("New question", `Someone asked a question.`), ...prev].slice(0, 4));
    };

    const onQuestionUpdated = (payload: any) => {
      setClassroomQuestions((prev) => prev.map((q) => (q.questionId === payload.questionId ? payload : q)));
    };

    const onQuestionDeleted = (payload: any) => {
      setClassroomQuestions((prev) => prev.filter((q) => q.questionId !== payload.questionId));
    };

    const onPollCreated = (payload: any) => {
      setLivePolls((prev) => [payload, ...prev]);
      setEvents((prev) => [createSystemEvent("New poll", `A new poll is active.`), ...prev].slice(0, 4));
      setActivePanel("polls");
    };

    const onPollUpdated = (payload: any) => {
      setLivePolls((prev) => prev.map((p) => (p.pollId === payload.pollId ? payload : p)));
    };

    const onPollResults = (payload: any) => {
      setLivePolls((prev) => prev.map((p) => (p.pollId === payload.pollId ? payload : p)));
    };

    const onHandCalledOn = (payload: any) => {
      if (payload.userId === user?.id) {
        setEvents((prev) => [createSystemEvent("Called on", `The mentor called on you to speak!`), ...prev].slice(0, 4));
        setHandRaised(false);
      }
    };

    socket.on("question:new", onQuestionNew);
    socket.on("question:updated", onQuestionUpdated);
    socket.on("question:deleted", onQuestionDeleted);
    socket.on("poll:created", onPollCreated);
    socket.on("poll:updated", onPollUpdated);
    socket.on("poll:results", onPollResults);
    socket.on("hand:called-on", onHandCalledOn);

    const onScreenShareStarted = (payload: { roomId: string; userId: string }) => {
      if (payload.userId !== user?.id) {
        setEvents((prev) => [createSystemEvent("Screen Share", `Another participant started sharing their screen.`), ...prev].slice(0, 4));
      }
    };

    const onScreenShareStopped = () => {
      setEvents((prev) => [createSystemEvent("Screen Share", `Screen sharing has ended.`), ...prev].slice(0, 4));
    };

    const onRecordingStarted = () => {
      setEvents((prev) => [createSystemEvent("Recording", `Session recording has started.`), ...prev].slice(0, 4));
    };

    const onRecordingStopped = () => {
      setEvents((prev) => [createSystemEvent("Recording", `Session recording has stopped.`), ...prev].slice(0, 4));
    };

    socket.on("video:screen-share:started", onScreenShareStarted);
    socket.on("video:screen-share:stopped", onScreenShareStopped);
    socket.on("video:recording:started", onRecordingStarted);
    socket.on("video:recording:stopped", onRecordingStopped);

    return () => {
      socket.off("question:new", onQuestionNew);
      socket.off("question:updated", onQuestionUpdated);
      socket.off("question:deleted", onQuestionDeleted);
      socket.off("poll:created", onPollCreated);
      socket.off("poll:updated", onPollUpdated);
      socket.off("poll:results", onPollResults);
      socket.off("hand:called-on", onHandCalledOn);
      socket.off("video:screen-share:started", onScreenShareStarted);
      socket.off("video:screen-share:stopped", onScreenShareStopped);
      socket.off("video:recording:started", onRecordingStarted);
      socket.off("video:recording:stopped", onRecordingStopped);
    };
  }, [socketRef.current, user?.id]);

  useEffect(() => {
    if (sessionId && sessionId !== "demo") {
      api.get(`/sessions/${sessionId}/resources`).then(res => {
        setResources(res.data.data?.resources || []);
      }).catch(() => undefined);
    }
  }, [sessionId]);

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
    <div className="page-shell space-y-4">
      <Card className="surface-panel p-4">
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
          className="relative min-h-[26rem] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-base)] shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
        >
          {useVideo ? (
            <>
              <div className="absolute inset-0 p-4">
                {agora.isScreenSharing && agora.screenTrack ? (
                  <ScreenShareView
                    screenTrack={agora.screenTrack}
                    presenterName="You"
                  />
                ) : (
                  <VideoGrid
                    localVideoTrack={agora.localVideoTrack}
                    remoteUsers={agora.remoteUsers}
                    screenTrack={null}
                  />
                )}
              </div>
              <div className="absolute left-4 top-4 flex max-w-[calc(100%-1rem)] flex-wrap gap-2 z-10">
                <Badge variant="purple">Session {sessionId}</Badge>
                <Badge className={meta.className}>
                  <StatusIcon size={14} className="mr-1 inline" />
                  {meta.label}
                </Badge>
                <Badge variant="success">
                  <Users size={14} className="mr-1 inline" />
                  {presenceCount} in room
                </Badge>
                {agora.isScreenSharing && (
                  <Badge variant="warning">Screen Sharing</Badge>
                )}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <VideoControls
                  isAudioEnabled={agora.isAudioEnabled}
                  isVideoEnabled={agora.isVideoEnabled}
                  isScreenSharing={agora.isScreenSharing}
                  isHandRaised={handRaised}
                  onToggleAudio={() => {
                    agora.toggleAudio();
                    if (socketRef.current) {
                      socketRef.current.emit("video:toggle-audio", { roomId, enabled: !agora.isAudioEnabled });
                    }
                  }}
                  onToggleVideo={() => {
                    agora.toggleVideo();
                    if (socketRef.current) {
                      socketRef.current.emit("video:toggle-video", { roomId, enabled: !agora.isVideoEnabled });
                    }
                  }}
                  onToggleScreenShare={() => {
                    if (agora.isScreenSharing) {
                      agora.stopScreenShare();
                      if (socketRef.current) {
                        socketRef.current.emit("video:screen-share:stop", { roomId });
                      }
                    } else {
                      agora.startScreenShare();
                      if (socketRef.current) {
                        socketRef.current.emit("video:screen-share:start", { roomId });
                      }
                    }
                  }}
                  onToggleHand={toggleHandRaise}
                  onLeave={() => {
                    agora.leave();
                    navigate("/app/sessions");
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Card className="surface-panel w-full max-w-md text-center">
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
                <Card className="surface-panel min-w-[220px] border-primary/25 p-3 text-center backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Instructor</p>
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <Avatar src={mentor?.avatar} name={mentor?.fullName ?? "Mentor"} userId={mentor?._id} role="mentor" size="md" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{mentor?.fullName ?? "Mentor"}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Guiding the session</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="absolute bottom-4 left-4 right-4 space-y-3">
                <Card className="surface-panel p-4 backdrop-blur">
                  <div className="grid gap-3 md:grid-cols-4">
                    <SessionBadge icon={Video} label="Mode" value={session?.classroomMode ?? "immersive-3d"} />
                    <SessionBadge icon={Code2} label="Collab" value={session?.codeCollabEnabled ? "Enabled" : "Paused"} />
                    <SessionBadge icon={SquareDashedMousePointer} label="Whiteboard" value={session?.whiteboardEnabled ? "Enabled" : "Paused"} />
                    <SessionBadge icon={MonitorPlay} label="Network" value={activityLabel} />
                  </div>
                </Card>

                {showControls ? (
                  <Card className="surface-panel p-3 backdrop-blur">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button variant={audioMuted ? "danger" : "outline"} size="sm" onClick={() => setAudioMuted((value) => !value)}>
                        {audioMuted ? <MicOff size={16} /> : <Mic size={16} />}
                        {audioMuted ? "Unmute" : "Mute"}
                      </Button>
                      <Button variant={cameraHidden ? "danger" : "outline"} size="sm" onClick={() => setCameraHidden((value) => !value)}>
                        {cameraHidden ? <CameraOff size={16} /> : <Camera size={16} />}
                        {cameraHidden ? "Hide camera" : "Show camera"}
                      </Button>
                      <Button variant={handRaised ? "primary" : "outline"} size="sm" onClick={toggleHandRaise}>
                        <Hand size={16} />
                        {handRaised ? "Hand Raised" : "Raise Hand"}
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
            </>
          )}
        </section>

        {!compactScene ? (
          <aside className="flex min-h-0 flex-col gap-4">
            <Card id="classroom-activity" className="surface-panel">
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
              className="surface-panel flex min-h-0 flex-1 flex-col overflow-hidden p-0"
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
                          <Avatar src={person.avatar} name={person.name} userId={person.id} role={person.role === "mentor" ? "mentor" : "student"} size="sm" />
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
                ) : activePanel === "questions" ? (
                  <StudentQuestionsPanel 
                    questions={classroomQuestions} 
                    onAskQuestion={handleAskQuestion} 
                    onUpvote={handleUpvoteQuestion} 
                    currentUserId={user?.id} 
                  />
                ) : activePanel === "polls" ? (
                  <StudentPollsPanel 
                    polls={livePolls} 
                    onVote={handleVotePoll} 
                  />
                ) : activePanel === "resources" ? (
                  <StudentResourcesPanel 
                    resources={resources} 
                    sessionId={sessionId || ""} 
                  />
                ) : activePanel === "notes" ? (
                  <StudentNotesPanel notes={classnotes} />
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
                        title="No session events yet"
                        description="Events and highlights will appear as the classroom becomes active."
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

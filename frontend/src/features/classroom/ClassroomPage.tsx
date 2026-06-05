/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Send, Signal, Sparkles, Wifi, WifiOff, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import { useRealtimeRoom } from "@/hooks/useRealtimeRoom";
import { fetchSessionById, getJitsiConfig, getJitsiToken } from "@/services/sessionsService";
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
import { JitsiMeeting, type JitsiMeetingHandle } from "@/components/jitsi/JitsiMeeting";
import { MeetingToolbar } from "@/components/jitsi/MeetingToolbar";
import { MeetingHeader } from "@/components/jitsi/MeetingHeader";
import { cn } from "@/lib/utils";

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

function MessageThread({ messages, userId }: { messages: RealtimeChatMessage[]; userId?: string }) {
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
                  : "border-[var(--border)] bg-[var(--bg-card)]",
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
  const [messages, setMessages] = useState<RealtimeChatMessage[]>([]);
  const [events, setEvents] = useState<RealtimeSystemEvent[]>([]);
  const [roomState, setRoomState] = useState<RealtimeRoomState | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [classroomQuestions, setClassroomQuestions] = useState<any[]>([]);
  const [livePolls, setLivePolls] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [classnotes] = useState<any>(null);

  const [jitsiAudioMuted, setJitsiAudioMuted] = useState(true);
  const [jitsiVideoMuted, setJitsiVideoMuted] = useState(true);
  const [jitsiScreenSharing, setJitsiScreenSharing] = useState(false);
  const [jitsiParticipantCount] = useState(0);
  const jitsiRef = useRef<JitsiMeetingHandle>(null);

  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchSessionById(sessionId!),
    enabled: !!sessionId && sessionId !== "demo",
  });

  const jitsiConfigQuery = useQuery({
    queryKey: ["jitsi-config"],
    queryFn: getJitsiConfig,
  });

  const jitsiTokenQuery = useQuery({
    queryKey: ["jitsi-token", sessionId],
    queryFn: () => getJitsiToken(sessionId!),
    enabled: !!sessionId && sessionId !== "demo" && Boolean(jitsiConfigQuery.data?.enabled),
  });

  const roomId = sessionQuery.data?.liveRoomId ?? `session-${sessionId ?? "demo"}`;
  const session = sessionQuery.data;

  const { connectionStatus, presenceCount, pendingCount, isOnline, sendMessage, socketRef } =
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
    setClassroomQuestions((prev) =>
      prev.map((q) =>
        q.questionId === questionId ? { ...q, upvoteCount: (q.upvoteCount || 0) + 1, hasUpvoted: true } : q,
      ),
    );
  };

  const handleVotePoll = (pollId: string, optionIndex: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit("poll:vote", { roomId, pollId, optionIndex });
    setLivePolls((prev) => prev.map((p) => (p.pollId === pollId ? { ...p, hasVoted: true } : p)));
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
        setEvents((prev) =>
          [createSystemEvent("Called on", `The mentor called on you to speak!`), ...prev].slice(0, 4),
        );
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

    return () => {
      socket.off("question:new", onQuestionNew);
      socket.off("question:updated", onQuestionUpdated);
      socket.off("question:deleted", onQuestionDeleted);
      socket.off("poll:created", onPollCreated);
      socket.off("poll:updated", onPollUpdated);
      socket.off("poll:results", onPollResults);
      socket.off("hand:called-on", onHandCalledOn);
    };
  }, [socketRef.current, user?.id]);

  useEffect(() => {
    if (sessionId && sessionId !== "demo") {
      api
        .get(`/sessions/${sessionId}/resources`)
        .then((res) => {
          setResources(res.data.data?.resources || []);
        })
        .catch(() => undefined);
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
  const roster = useMemo(() => {
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
  }, [mentor, roomState?.connectedUserIds, sessionParticipants, user?.id]);

  const meta = statusMeta[connectionStatus];
  const StatusIcon = meta.icon;

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
      setEvents([createSystemEvent("Session ready", "Jitsi-powered classroom is ready for this room.")]);
      setRoomState(null);
      setActivePanel("chat");
    });
  }, [roomId]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    sendMessage(text, { author: user?.fullName ?? "You", userId: user?.id });
    setDraft("");
    setEvents((prev) =>
      [createSystemEvent("Shared a question", "Your message is now visible to the room."), ...prev].slice(0, 4),
    );
  };

  if (sessionQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message="Unable to open this classroom session."
          onRetry={() => void sessionQuery.refetch()}
        />
      </div>
    );
  }

  if (sessionQuery.isLoading) {
    return <ClassroomShellSkeleton />;
  }

  const isMentor = user?.id && session?.mentor?._id ? user.id === session.mentor._id : false;
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isHost = isMentor || isAdmin;

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-base)]">
      <MeetingHeader
        title={sessionTitle}
        status={session?.status ?? "scheduled"}
        liveStartedAt={session?.liveStartedAt}
        participantCount={jitsiParticipantCount || presenceCount}
        isRecording={session?.recordingMode === "cloud"}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <div className="flex-1 relative">
            {jitsiConfigQuery.data?.enabled && jitsiTokenQuery.data ? (
              <JitsiMeeting
                ref={jitsiRef}
                domain={jitsiConfigQuery.data.domain}
                roomName={jitsiTokenQuery.data.roomName}
                token={jitsiTokenQuery.data.token}
                displayName={user?.fullName}
                email={user?.email}
                sessionId={sessionId || "demo"}
                onConferenceJoined={() => {
                  setEvents((prev) =>
                    [createSystemEvent("Joined", "You have joined the meeting."), ...prev].slice(0, 4),
                  );
                }}
                onConferenceLeft={() => navigate("/app/sessions")}
                onParticipantJoined={(p) => {
                  if (!p.isLocal) {
                    setEvents((prev) =>
                      [createSystemEvent("Participant joined", `${p.displayName} joined the meeting.`), ...prev].slice(0, 4),
                    );
                  }
                }}
                onParticipantLeft={(p) => {
                  if (!p.isLocal) {
                    setEvents((prev) =>
                      [createSystemEvent("Participant left", `${p.displayName} left the meeting.`), ...prev].slice(0, 4),
                    );
                  }
                }}
                onAudioMuteChanged={setJitsiAudioMuted}
                onVideoMuteChanged={setJitsiVideoMuted}
                onScreenShareChanged={setJitsiScreenSharing}
                onReadyToClose={() => navigate("/app/sessions")}
                onError={(err) => {
                  console.error("Jitsi error:", err);
                  setEvents((prev) =>
                    [createSystemEvent("Meeting error", "There was an issue with the meeting connection."), ...prev].slice(0, 4),
                  );
                }}
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">Meeting not available</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Jitsi is not configured. Please contact your administrator.
                  </p>
                </div>
              </div>
            )}
          </div>

          <MeetingToolbar
            isAudioMuted={jitsiAudioMuted}
            isVideoMuted={jitsiVideoMuted}
            isScreenSharing={jitsiScreenSharing}
            isHandRaised={handRaised}
            onToggleAudio={() => jitsiRef.current?.toggleAudio()}
            onToggleVideo={() => jitsiRef.current?.toggleVideo()}
            onToggleScreenShare={() => jitsiRef.current?.toggleScreenShare()}
            onToggleHandRaise={toggleHandRaise}
            onLeave={() => navigate("/app/sessions")}
            isHost={isHost}
          />
        </div>

        <aside className="hidden w-[380px] flex-col border-l border-[var(--border)] bg-[var(--bg-card)] xl:flex">
          <div className="border-b border-[var(--border)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-primary">Live chat</p>
                <h3 className="text-lg font-semibold text-white">Collaborate</h3>
              </div>
              <Badge variant="purple">
                <Sparkles size={14} className="mr-1 inline" />
                Realtime
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
              <span>{roomState?.messageCount ?? messages.length} messages</span>
              <span>&middot;</span>
              <span>{pendingCount} queued</span>
              <span>&middot;</span>
              <Badge className={meta.className}>
                <StatusIcon size={12} className="mr-1 inline" />
                {meta.label}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {panelTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActivePanel(tab)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs capitalize transition",
                    activePanel === tab
                      ? "bg-primary text-[var(--bg-base)]"
                      : "border border-[var(--border)] text-[var(--text-secondary)] hover:text-white",
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
                    <div
                      key={person.id}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/5 p-3"
                    >
                      <Avatar
                        src={person.avatar}
                        name={person.name}
                        userId={person.id}
                        role={person.role === "mentor" ? "mentor" : "student"}
                        size="sm"
                      />
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
              <StudentPollsPanel polls={livePolls} onVote={handleVotePoll} />
            ) : activePanel === "resources" ? (
              <StudentResourcesPanel resources={resources} sessionId={sessionId || ""} />
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
            <div className="flex gap-2">
              <Input
                placeholder={isOnline ? "Type a message..." : "Draft — will send when online"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button type="button" onClick={handleSend} aria-label="Send message">
                <Send size={16} />
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

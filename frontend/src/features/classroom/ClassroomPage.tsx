import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/composites/ToastProvider";
import {
  endSession,
  fetchSessionById,
  getLiveKitConfig,
  getLiveKitToken,
  leaveLiveSession,
} from "@/services/sessionsService";
import { QueryError } from "@/components/composites/QueryError";
import { LiveKitMeeting, type LiveKitMeetingHandle } from "@/components/livekit/LiveKitMeeting";
import { MeetingStatusBanner } from "@/components/meeting/MeetingStatusBanner";
import { useMeetingStatus } from "@/hooks/useMeetingStatus";
import { acquireSocketConnection, releaseSocketConnection } from "@/services/socket";
import type { OutboxMessage } from "@/lib/realtime";

// Interactive Classroom Panels
import { WhiteboardCanvas } from "./WhiteboardCanvas";
import { BreakoutPanel } from "./BreakoutPanel";
import { StudentQuestionsPanel } from "./panels/StudentQuestionsPanel";
import { StudentPollsPanel } from "./panels/StudentPollsPanel";
import { StudentNotesPanel } from "./panels/StudentNotesPanel";
import { StudentResourcesPanel } from "./panels/StudentResourcesPanel";

import {
  MessageSquare,
  HelpCircle,
  BarChart3,
  FileText,
  Folder,
  Layers,
  X,
  Send,
  Sparkles,
} from "lucide-react";

interface ChatMsg {
  id: string;
  userId: string;
  author: string;
  text: string;
  at: string;
  isSystem?: boolean;
}

interface QuestionItem {
  questionId: string;
  text: string;
  userName: string;
  status: string;
  upvoteCount?: number;
  hasUpvoted?: boolean;
}

interface PollOptionItem {
  text: string;
  percentage?: number;
}

interface PollItem {
  pollId: string;
  question: string;
  status: string;
  options: PollOptionItem[];
  hasVoted?: boolean;
  totalVotes?: number;
}

export function ClassroomPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const toast = useToast();
  const livekitRef = useRef<LiveKitMeetingHandle>(null);

  // Real-time panel tab state
  const [activePanel, setActivePanel] = useState<
    "none" | "chat" | "qa" | "polls" | "notes" | "resources" | "breakout" | "whiteboard" | "participants"
  >("none");

  // Real-time Chat
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Real-time Questions & Polls
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [polls, setPolls] = useState<PollItem[]>([]);

  // Socket instance for real-time collaboration
  const socketRef = useRef<ReturnType<typeof acquireSocketConnection> | null>(null);

  // 1. Session Data Query
  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchSessionById(sessionId!),
    enabled: !!sessionId && sessionId !== "demo",
  });

  // 2. LiveKit Public Config Query
  const livekitConfigQuery = useQuery({
    queryKey: ["livekit-config"],
    queryFn: getLiveKitConfig,
  });

  // 3. Real-time Meeting Status
  const {
    status: meetingStatus,
    joinable,
    meeting,
  } = useMeetingStatus({
    sessionId: sessionId && sessionId !== "demo" ? sessionId : null,
    enabled: !!sessionId && sessionId !== "demo",
  });

  // 4. LiveKit Token Query
  const livekitTokenQuery = useQuery({
    queryKey: ["livekit-token", sessionId],
    queryFn: () => getLiveKitToken(sessionId!),
    enabled:
      !!sessionId &&
      sessionId !== "demo" &&
      Boolean(livekitConfigQuery.data?.enabled) &&
      (meetingStatus === "active" || meetingStatus === "waiting_for_host" || meetingStatus === "scheduled"),
  });

  // End Session Mutation (Host)
  const endMutation = useMutation({
    mutationFn: () => endSession(sessionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["meeting"] });
      toast.success("Session ended successfully");
      navigate(`/app/sessions/${sessionId}/feedback`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to end meeting";
      toast.error(message);
    },
  });

  const session = sessionQuery.data;
  const sessionTitle = session?.title ?? meeting?.title ?? "Interactive Live Classroom";
  const isMentor = user?.id && session?.mentor?._id ? String(user.id) === String(session.mentor._id) : false;
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isHostFromToken = livekitTokenQuery.data?.role === "host";
  const isHost = isHostFromToken || isMentor || isAdmin;

  // Setup Socket.IO for real-time room communication
  useEffect(() => {
    if (!sessionId || sessionId === "demo") return;

    const socket = acquireSocketConnection();
    socketRef.current = socket;

    const roomId = `session-${sessionId}`;
    socket.emit("join-room", roomId);

    // Chat messages
    const handleChat = (payload: {
      messageId?: string;
      userId?: string;
      author?: string;
      text?: string;
      at?: string;
      system?: boolean;
    }) => {
      if (!payload.text) return;
      setChatMessages((prev) => [
        ...prev,
        {
          id: payload.messageId || String(Date.now()),
          userId: payload.userId || "anonymous",
          author: payload.author || "User",
          text: payload.text || "",
          at: payload.at || new Date().toISOString(),
          isSystem: Boolean(payload.system),
        },
      ]);
      setUnreadChatCount((prev) => (activePanel === "chat" ? 0 : prev + 1));
    };

    // Questions
    const handleQuestion = (payload: {
      questionId: string;
      text: string;
      userName: string;
      status: string;
      upvoteCount?: number;
    }) => {
      setQuestions((prev) => [
        ...prev.filter((q) => q.questionId !== payload.questionId),
        {
          questionId: payload.questionId,
          text: payload.text,
          userName: payload.userName,
          status: payload.status,
          upvoteCount: payload.upvoteCount ?? 0,
        },
      ]);
    };

    // Polls
    const handlePoll = (payload: {
      pollId: string;
      question: string;
      status: string;
      options: Array<{ text: string; voteCount: number; percentage: number }>;
      totalVotes?: number;
    }) => {
      setPolls((prev) => [
        ...prev.filter((p) => p.pollId !== payload.pollId),
        {
          pollId: payload.pollId,
          question: payload.question,
          status: payload.status,
          options: payload.options.map((opt) => ({ text: opt.text, percentage: opt.percentage })),
          totalVotes: payload.totalVotes,
        },
      ]);
    };

    socket.on("chat:message", handleChat);
    socket.on("question:new", handleQuestion);
    socket.on("poll:created", handlePoll);

    return () => {
      socket.emit("leave-room", roomId);
      socket.off("chat:message", handleChat);
      socket.off("question:new", handleQuestion);
      socket.off("poll:created", handlePoll);
      releaseSocketConnection();
      socketRef.current = null;
    };
  }, [sessionId, activePanel]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (activePanel === "chat") {
      setUnreadChatCount(0);
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activePanel, chatMessages]);

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatDraft.trim();
    if (!text || !sessionId) return;

    if (socketRef.current) {
      const msgPayload: OutboxMessage = {
        roomId: `session-${sessionId}`,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text,
        at: new Date().toISOString(),
        clientId: `client_${user?.id || "guest"}`,
      };
      socketRef.current.emit("chat:message", msgPayload);
    }

    setChatDraft("");
  };

  const handleLeave = async () => {
    if (sessionId) {
      await leaveLiveSession(sessionId).catch(() => undefined);
    }
    livekitRef.current?.hangUp();
    navigate("/app/sessions");
  };

  const handleEndMeeting = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("End the meeting for everyone? All participants will be disconnected and attendance XP awarded.");
      if (!confirmed) return;
    }
    endMutation.mutate();
  };

  const handleTogglePanel = (
    panel: "chat" | "qa" | "polls" | "notes" | "resources" | "participants" | "whiteboard" | "breakout",
  ) => {
    if (panel === "chat") {
      setUnreadChatCount(0);
    }
    setActivePanel((curr) => (curr === panel ? "none" : panel));
  };

  // Socket adapter for sub-panels
  const socketAdapter = useMemo(
    () => ({
      emit: (event: string, payload: unknown) => {
        (socketRef.current as any)?.emit(event, payload);
      },
      on: (event: string, handler: (payload: unknown) => void) => {
        (socketRef.current as any)?.on(event, handler);
        return () => {
          (socketRef.current as any)?.off(event, handler);
        };
      },
    }),
    [],
  );

  if (sessionQuery.isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0F19]">
        <QueryError message="Unable to open this classroom session." onRetry={() => void sessionQuery.refetch()} />
      </div>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0F19]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading interactive classroom...</p>
        </div>
      </div>
    );
  }

  const livekitReady = Boolean(
    livekitConfigQuery.data?.enabled &&
    livekitTokenQuery.data?.token &&
    (meetingStatus === "active" || isHost),
  );

  const classroomHref = `/app/classroom/${sessionId ?? ""}`;

  return (
    <div className="flex h-screen flex-col bg-[#0B0F19] text-white overflow-hidden select-none">
      {/* Top Meeting Status Banner */}
      {meetingStatus !== "active" && (
        <div className="border-b border-white/5 bg-[#101726]/80 px-4 py-2.5 md:px-6">
          <MeetingStatusBanner
            status={meetingStatus}
            meeting={meeting}
            joinHref={classroomHref}
            joinable={joinable}
          />
        </div>
      )}

      {/* Main Classroom Split Workspace */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Center Live Media & Whiteboard Stage */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {activePanel === "whiteboard" ? (
            /* Whiteboard Canvas Mode */
            <div className="relative flex flex-1 flex-col bg-slate-950">
              <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 py-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span>Collaborative Whiteboard</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePanel("none")}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 p-2">
                <WhiteboardCanvas sessionId={sessionId || "demo"} socket={socketAdapter} />
              </div>
            </div>
          ) : livekitReady ? (
            /* LiveKit Video Conference Stage */
            <LiveKitMeeting
              ref={livekitRef}
              url={livekitTokenQuery.data!.url || livekitConfigQuery.data!.url}
              token={livekitTokenQuery.data!.token}
              roomName={livekitTokenQuery.data!.roomName}
              displayName={user?.fullName}
              sessionId={sessionId || "demo"}
              sessionTitle={sessionTitle}
              mentorName={session?.mentor?.fullName}
              isHost={isHost}
              liveStartedAt={session?.liveStartedAt}
              isRecording={session?.recordingMode === "cloud"}
              activePanel={activePanel}
              onTogglePanel={handleTogglePanel}
              unreadChatCount={unreadChatCount}
              unreadQaCount={questions.filter((q) => q.status === "pending").length}
              activePollCount={polls.filter((p) => p.status === "active").length}
              onLeave={handleLeave}
              onEndMeeting={isHost ? handleEndMeeting : undefined}
              isEndingMeeting={endMutation.isPending}
              className="h-full w-full"
            />
          ) : (
            /* Waiting / Scheduled State Screen */
            <div className="flex h-full items-center justify-center bg-[#0B0F19] px-6 text-center">
              <div className="max-w-md rounded-3xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-xl">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {meetingStatus === "active" ? "Connecting to LiveKit Media Server..." : "Session is Not Live Yet"}
                </h2>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {meetingStatus === "scheduled"
                    ? "This meeting is scheduled. The live classroom will unlock automatically when the host starts."
                    : meetingStatus === "waiting_for_host"
                      ? "Waiting for the mentor to start the session. You will be able to join as soon as they go live."
                      : meetingStatus === "completed"
                        ? "This session has completed and the room is closed."
                        : livekitConfigQuery.isLoading
                          ? "Connecting to live infrastructure..."
                          : "Preparing room access..."}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/app/sessions")}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Back to Sessions
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Side Dock Panel */}
        {activePanel !== "none" && activePanel !== "whiteboard" && activePanel !== "participants" && (
          <aside aria-label="Classroom side panel" className="flex w-80 md:w-96 flex-col border-l border-white/10 bg-[#0F172A] shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right duration-200 z-30">
            {/* Panel Header */}
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                {activePanel === "chat" && <MessageSquare className="h-4 w-4 text-indigo-400" />}
                {activePanel === "qa" && <HelpCircle className="h-4 w-4 text-indigo-400" />}
                {activePanel === "polls" && <BarChart3 className="h-4 w-4 text-indigo-400" />}
                {activePanel === "notes" && <FileText className="h-4 w-4 text-indigo-400" />}
                {activePanel === "resources" && <Folder className="h-4 w-4 text-indigo-400" />}
                {activePanel === "breakout" && <Layers className="h-4 w-4 text-indigo-400" />}
                <span>
                  {activePanel === "chat"
                    ? "Live Chat"
                    : activePanel === "qa"
                      ? "Q&A Questions"
                      : activePanel === "polls"
                        ? "Interactive Polls"
                        : activePanel === "notes"
                          ? "Collaborative Notes"
                          : activePanel === "resources"
                            ? "Session Resources"
                            : "Breakout Rooms"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel("none")}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel Content Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {activePanel === "chat" && (
                <div className="flex h-full flex-col">
                  {/* Messages Stream */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {chatMessages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-center text-xs text-slate-500">
                        No messages yet. Say hello in chat!
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`rounded-xl p-2.5 text-xs ${
                            msg.isSystem
                              ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-center font-medium"
                              : msg.userId === user?.id
                                ? "bg-indigo-600/30 border border-indigo-500/30 text-slate-100 ml-4"
                                : "bg-slate-900/80 border border-white/5 text-slate-200 mr-4"
                          }`}
                        >
                          {!msg.isSystem && (
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-slate-300 text-[11px] truncate">
                                {msg.author}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {new Date(msg.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          )}
                          <p className="leading-relaxed break-words">{msg.text}</p>
                        </div>
                      ))
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendChat} className="mt-3 flex gap-2 pt-2 border-t border-white/10">
                    <input
                      type="text"
                      placeholder="Send a message..."
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      className="flex-1 rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatDraft.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}

              {activePanel === "qa" && (
                <StudentQuestionsPanel
                  questions={questions}
                  onAskQuestion={(text) => {
                    if (socketRef.current) {
                      socketRef.current.emit("question:submit", {
                        roomId: `session-${sessionId}`,
                        questionId: `q_${Date.now()}`,
                        text,
                      });
                    }
                  }}
                  onUpvote={(questionId) => {
                    if (socketRef.current) {
                      socketRef.current.emit("question:upvote", {
                        roomId: `session-${sessionId}`,
                        questionId,
                      });
                    }
                  }}
                  currentUserId={user?.id}
                />
              )}

              {activePanel === "polls" && (
                <StudentPollsPanel
                  polls={polls}
                  onVote={(pollId, optionIndex) => {
                    if (socketRef.current) {
                      socketRef.current.emit("poll:vote", {
                        roomId: `session-${sessionId}`,
                        pollId,
                        optionIndex,
                      });
                    }
                  }}
                />
              )}

              {activePanel === "notes" && (
                <StudentNotesPanel notes={{ summary: session?.title, actionItems: [], keyTakeaways: [] }} />
              )}

              {activePanel === "resources" && (
                <StudentResourcesPanel resources={[]} sessionId={sessionId || "demo"} />
              )}

              {activePanel === "breakout" && (
                <BreakoutPanel
                  sessionId={sessionId || "demo"}
                  isHost={isHost}
                  socket={socketAdapter}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

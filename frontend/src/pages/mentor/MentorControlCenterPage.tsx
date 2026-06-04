import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, Activity, Megaphone, Video, Link2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { usePageTitle } from "@/hooks/usePageTitle";
import { QueryError } from "@/components/composites/QueryError";

// Socket connection
import { acquireSocketConnection, releaseSocketConnection, getSocket } from "@/services/socket";

// Services
import {
  fetchMentorControlCenter,
  admitUser, denyUser, removeParticipant, muteParticipant, unmuteParticipant,
  timeoutParticipant, setParticipantRole, callOnStudent, markHandAnswered, clearAllRaisedHands
} from "@/services/mentorControlService";

// Extracted Sub-Components
import SessionOverviewPanel from "./control-center/SessionOverviewPanel";
import ParticipantPanel from "./control-center/ParticipantPanel";
import WaitingRoomPanel from "./control-center/WaitingRoomPanel";
import RaisedHandsPanel from "./control-center/RaisedHandsPanel";
import QuestionsPanel from "./control-center/QuestionsPanel";
import ChatPanel from "./control-center/ChatPanel";
import PollsPanel from "./control-center/PollsPanel";
import NotesPanel from "./control-center/NotesPanel";
import EngagementPanel from "./control-center/EngagementPanel";
import ResourcesPanel from "./control-center/ResourcesPanel";
import RecordingsPanel from "./control-center/RecordingsPanel";
import NotificationsPanel from "./control-center/NotificationsPanel";

// Styling
import "./control-center/MentorControlCenter.css";

export default function MentorControlCenterPage() {
  usePageTitle("Mentor Control Center");
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Keyboard shortcuts for tab navigation
  const TAB_KEYS: Record<string, string> = {
    "1": "overview", "2": "participants", "3": "chat", "4": "questions",
    "5": "polls", "6": "resources", "7": "recordings", "8": "notes",
    "9": "engagement", "0": "alerts",
  };

  const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs/textareas
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable) return;

    if (e.key === "Escape") {
      navigate(-1);
      return;
    }

    const tab = TAB_KEYS[e.key];
    if (tab) {
      e.preventDefault();
      setActiveTab(tab);
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["mentor-control", sessionId],
    queryFn: () => fetchMentorControlCenter(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!sessionId) return;
    const socket = acquireSocketConnection();
    const roomId = `session-${sessionId}`;
    socket.emit("join-room", roomId);

    const handleOverview = () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    };

    socket.on("hand:raised", handleOverview);
    socket.on("hand:lowered", handleOverview);
    socket.on("question:new", handleOverview);
    socket.on("question:updated", handleOverview);
    socket.on("poll:updated", handleOverview);
    socket.on("notification:mentor", () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    });

    return () => {
      socket.emit("leave-room", roomId);
      releaseSocketConnection();
    };
  }, [sessionId, queryClient]);

  const handleParticipantAction = async (action: string, userId: string) => {
    if (!sessionId) return;
    try {
      switch (action) {
        case "admit":
          await admitUser(sessionId, userId);
          break;
        case "deny":
          await denyUser(sessionId, userId);
          break;
        case "admit-all":
          getSocket()?.emit("admission:admit-all", { roomId: `session-${sessionId}` });
          break;
        case "remove":
          await removeParticipant(sessionId, userId);
          break;
        case "mute":
          await muteParticipant(sessionId, userId);
          break;
        case "unmute":
          await unmuteParticipant(sessionId, userId);
          break;
        case "timeout":
          await timeoutParticipant(sessionId, userId);
          break;
        case "promote":
          await setParticipantRole(sessionId, userId, "cohost");
          break;
        case "demote":
          await setParticipantRole(sessionId, userId, "participant");
          break;
        case "speaking_granted":
          getSocket()?.emit("participant:control", { roomId: `session-${sessionId}`, targetUserId: userId, action: "speaking_granted" });
          break;
        case "speaking_removed":
          getSocket()?.emit("participant:control", { roomId: `session-${sessionId}`, targetUserId: userId, action: "speaking_removed" });
          break;
        case "call-on":
          await callOnStudent(sessionId, userId);
          break;
        case "mark-answered":
          await markHandAnswered(sessionId, userId);
          break;
        case "clear-hands":
          await clearAllRaisedHands(sessionId);
          break;
        case "block":
          // Call block endpoint or moderation block
          await removeParticipant(sessionId, userId, "Blocked");
          getSocket()?.emit("participant:control", { roomId: `session-${sessionId}`, targetUserId: userId, action: "blocked" });
          break;
      }
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    }
  };

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <QueryError message={error instanceof Error ? error.message : "Failed to load control center"} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 mcc-container">
        <Skeleton className="h-16 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const overview = data?.overview;

  return (
    <div className="mcc-container p-4 sm:p-6 space-y-6" role="main" aria-label="Mentor Control Center">
      {/* Header section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-white/5 text-white" onClick={() => navigate(-1)} aria-label="Go back" title="Go back (Esc)">
            <ArrowLeft size={18} aria-hidden="true" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl tracking-tight">Mentor OS Control Center</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Session ID: {sessionId?.toUpperCase()}</p>
          </div>
          <Badge className="mcc-live-badge ml-3 animate-pulse" aria-live="polite" aria-label="Session is live">
            <Activity size={12} className="mr-1.5" aria-hidden="true" /> LIVE
          </Badge>
        </div>
        <Button size="sm" variant="outline" className="h-9 text-xs border-white/10 hover:bg-white/5 text-white rounded-xl" onClick={() => refetch()} aria-label="Refresh dashboard data">
          <RefreshCw size={13} className="mr-1.5" aria-hidden="true" /> Refresh Dashboard
        </Button>
      </div>

      {/* Grid of counters */}
      <section aria-label="Session overview statistics" aria-live="polite">
        <SessionOverviewPanel overview={overview} />
      </section>

      {/* Main workspace tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mcc-tabs-list w-full overflow-x-auto flex-nowrap shrink-0 mb-4" aria-label="Control center panels">
          <TabsTrigger value="overview" className="mcc-tabs-trigger text-xs py-2 px-4" title="Press 1">Overview</TabsTrigger>
          <TabsTrigger value="participants" className="mcc-tabs-trigger text-xs py-2 px-4" title="Press 2">Participants ({overview?.liveParticipants})</TabsTrigger>
          <TabsTrigger value="chat" className="mcc-tabs-trigger text-xs py-2 px-4" title="Press 3">Live Chat</TabsTrigger>
          <TabsTrigger value="questions" className="mcc-tabs-trigger text-xs py-2 px-4" title="Press 4">Q&A ({overview?.questionsWaiting})</TabsTrigger>
          <TabsTrigger value="polls" className="mcc-tabs-trigger text-xs py-2 px-4" title="Press 5">Polls ({overview?.activePolls})</TabsTrigger>
          <TabsTrigger value="resources" className="mcc-tabs-trigger text-xs py-2 px-4" title="Press 6">Resources</TabsTrigger>
          <TabsTrigger value="recordings" className="mcc-tabs-trigger text-xs py-2 px-4" title="Press 7">Playbacks</TabsTrigger>
          <TabsTrigger value="notes" className="mcc-tabs-trigger text-xs py-2 px-4" title="Press 8">Class Notes</TabsTrigger>
          <TabsTrigger value="engagement" className="mcc-tabs-trigger text-xs py-2 px-4" title="Press 9">Engagement</TabsTrigger>
          <TabsTrigger value="alerts" className="mcc-tabs-trigger text-xs py-2 px-4" title="Press 0">Alerts</TabsTrigger>
        </TabsList>

        <div className="mt-2">
          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <RaisedHandsPanel hands={data?.raisedHands || []} sessionId={sessionId!} onAction={handleParticipantAction} />
                <WaitingRoomPanel queue={data?.waitingQueue || []} sessionId={sessionId!} onAction={handleParticipantAction} />
              </div>
              <div className="space-y-6">
                <Card className="mcc-card border-white/5 bg-[var(--bg-card)]/50 p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Live Participants</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto mcc-scrollbar pr-1">
                    {(data?.participants || []).slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 p-2 border-b border-white/5 text-xs text-white">
                        <span>{p.name}</span>
                        <Badge variant="default" className="text-[9px] border-white/10 uppercase bg-white/5 text-white">{p.role}</Badge>
                      </div>
                    ))}
                    {(!data?.participants || data.participants.length === 0) && (
                      <p className="text-xs text-[var(--text-muted)] text-center py-4">No participants online</p>
                    )}
                  </div>
                  {data?.participants && data.participants.length > 5 && (
                    <Button size="sm" variant="ghost" className="w-full mt-2 text-xs text-primary" onClick={() => setActiveTab("participants")}>
                      View All {data.participants.length} Participants
                    </Button>
                  )}
                </Card>
                
                {/* Quick actions panel */}
                <Card className="mcc-card border-white/5 bg-[var(--bg-card)]/50 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="justify-center text-xs h-9 border-white/10 hover:bg-white/5 text-white rounded-xl" onClick={() => setActiveTab("chat")}>
                      <Megaphone size={13} className="mr-2" /> Announce
                    </Button>
                    <Button variant="outline" className="justify-center text-xs h-9 border-white/10 hover:bg-white/5 text-white rounded-xl" onClick={() => setActiveTab("recordings")}>
                      <Video size={13} className="mr-2" /> Playbacks
                    </Button>
                    <Button variant="outline" className="justify-center text-xs h-9 border-white/10 hover:bg-white/5 text-white rounded-xl" onClick={() => setActiveTab("resources")}>
                      <Link2 size={13} className="mr-2" /> Resources
                    </Button>
                    <Button variant="danger" className="justify-center text-xs h-9 rounded-xl" onClick={() => navigate(-1)}>
                      <Square size={13} className="mr-2" /> Leave Session
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="participants" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <ParticipantPanel participants={data?.participants || []} sessionId={sessionId!} onAction={handleParticipantAction} />
              <div className="space-y-6">
                <WaitingRoomPanel queue={data?.waitingQueue || []} sessionId={sessionId!} onAction={handleParticipantAction} />
                <RaisedHandsPanel hands={data?.raisedHands || []} sessionId={sessionId!} onAction={handleParticipantAction} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <ChatPanel sessionId={sessionId!} />
          </TabsContent>

          <TabsContent value="questions" className="mt-0">
            <QuestionsPanel questions={data?.questions || []} sessionId={sessionId!} />
          </TabsContent>

          <TabsContent value="polls" className="mt-0">
            <PollsPanel polls={data?.polls || []} sessionId={sessionId!} />
          </TabsContent>

          <TabsContent value="resources" className="mt-0">
            <ResourcesPanel sessionId={sessionId!} />
          </TabsContent>

          <TabsContent value="recordings" className="mt-0">
            <RecordingsPanel sessionId={sessionId!} />
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <NotesPanel sessionId={sessionId!} />
          </TabsContent>

          <TabsContent value="engagement" className="mt-0">
            <EngagementPanel scores={data?.engagementScores || []} />
          </TabsContent>

          <TabsContent value="alerts" className="mt-0">
            <NotificationsPanel sessionId={sessionId!} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

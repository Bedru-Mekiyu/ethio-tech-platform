/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { fetchSessionById, getJitsiConfig, getJitsiToken } from "@/services/sessionsService";
import { QueryError } from "@/components/composites/QueryError";
import { JitsiMeeting, type JitsiMeetingHandle } from "@/components/jitsi/JitsiMeeting";
import { MeetingToolbar } from "@/components/jitsi/MeetingToolbar";
import { MeetingHeader } from "@/components/jitsi/MeetingHeader";
import { MeetingStatusBanner } from "@/components/meeting/MeetingStatusBanner";
import { useMeetingStatus } from "@/hooks/useMeetingStatus";

export function ClassroomPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const user = useAuthStore((s) => s.user);
  const jitsiRef = useRef<JitsiMeetingHandle>(null);

  const [handRaised, setHandRaised] = useState(false);
  const [jitsiAudioMuted, setJitsiAudioMuted] = useState(true);
  const [jitsiVideoMuted, setJitsiVideoMuted] = useState(true);
  const [jitsiScreenSharing, setJitsiScreenSharing] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchSessionById(sessionId!),
    enabled: !!sessionId && sessionId !== "demo",
  });

  const jitsiConfigQuery = useQuery({
    queryKey: ["jitsi-config"],
    queryFn: getJitsiConfig,
  });

  const {
    status: meetingStatus,
    joinable,
    presenceCount,
    meeting,
  } = useMeetingStatus({
    sessionId: sessionId && sessionId !== "demo" ? sessionId : null,
    enabled: !!sessionId && sessionId !== "demo",
  });

  const jitsiTokenQuery = useQuery({
    queryKey: ["jitsi-token", sessionId],
    queryFn: () => getJitsiToken(sessionId!),
    enabled:
      !!sessionId && sessionId !== "demo" && Boolean(jitsiConfigQuery.data?.enabled) && meetingStatus === "active",
  });

  const session = sessionQuery.data;
  const sessionTitle = session?.title ?? meeting?.title ?? "Virtual classroom";

  useEffect(() => {
    setHandRaised(false);
    setJitsiAudioMuted(true);
    setJitsiVideoMuted(true);
    setJitsiScreenSharing(false);
  }, [sessionId]);

  if (sessionQuery.isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-base)]">
        <QueryError message="Unable to open this classroom session." onRetry={() => void sessionQuery.refetch()} />
      </div>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-[var(--text-secondary)]">Loading classroom...</p>
        </div>
      </div>
    );
  }

  const isMentor = user?.id && session?.mentor?._id ? user.id === session.mentor._id : false;
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isHost = isMentor || isAdmin;

  const jitsiReady = jitsiConfigQuery.data?.enabled && jitsiTokenQuery.data && meetingStatus === "active";

  const classroomHref = `/app/classroom/${sessionId ?? ""}`;

  return (
    <div className="flex h-screen flex-col bg-[#0B0F19]">
      <MeetingHeader
        title={sessionTitle}
        status={
          meetingStatus === "active"
            ? "live"
            : meetingStatus === "completed"
              ? "ended"
              : (session?.status ?? "scheduled")
        }
        liveStartedAt={session?.liveStartedAt}
        participantCount={presenceCount}
        isRecording={session?.recordingMode === "cloud"}
      />

      <div className="border-b border-white/5 bg-[rgba(16,20,28,0.55)] px-4 py-3 md:px-6">
        <MeetingStatusBanner status={meetingStatus} meeting={meeting} joinHref={classroomHref} joinable={joinable} />
      </div>

      <div className="flex-1 overflow-hidden">
        {jitsiReady ? (
          <JitsiMeeting
            ref={jitsiRef}
            domain={jitsiConfigQuery.data!.domain}
            roomName={jitsiTokenQuery.data!.roomName}
            token={jitsiTokenQuery.data!.token}
            displayName={user?.fullName}
            email={user?.email}
            sessionId={sessionId || "demo"}
            onConferenceJoined={() => {}}
            onConferenceLeft={() => navigate("/app/sessions")}
            onParticipantJoined={() => {}}
            onParticipantLeft={() => {}}
            onAudioMuteChanged={setJitsiAudioMuted}
            onVideoMuteChanged={setJitsiVideoMuted}
            onScreenShareChanged={setJitsiScreenSharing}
            onReadyToClose={() => navigate("/app/sessions")}
            onError={(err) => console.error("Jitsi error:", err)}
            className="h-full w-full rounded-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#0B0F19] px-6">
            <div className="max-w-md text-center">
              <p className="text-lg font-semibold text-white">
                {meetingStatus === "active" ? "Connecting to meeting..." : "Meeting is not live yet"}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {meetingStatus === "scheduled"
                  ? "Your meeting has not started yet. The room will unlock when the mentor begins the session."
                  : meetingStatus === "waiting_for_host"
                    ? "Waiting for the mentor to start. You will be able to join as soon as they go live."
                    : meetingStatus === "completed"
                      ? "This session has ended. The room is no longer accepting new participants."
                      : meetingStatus === "cancelled"
                        ? "This meeting was cancelled and the room is unavailable."
                        : jitsiConfigQuery.isLoading
                          ? "Loading meeting configuration..."
                          : "Jitsi is not configured. Please contact your administrator."}
              </p>
              <button
                type="button"
                onClick={() => navigate("/app/sessions")}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                Back to sessions
              </button>
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
        onToggleHandRaise={() => {
          if (handRaised) {
            jitsiRef.current?.lowerHand();
          } else {
            jitsiRef.current?.raiseHand();
          }
          setHandRaised((prev) => !prev);
        }}
        onLeave={() => navigate("/app/sessions")}
        isHost={isHost}
        disabled={meetingStatus !== "active"}
      />
    </div>
  );
}

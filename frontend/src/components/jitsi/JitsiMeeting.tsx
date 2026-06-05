import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useJitsiMeet, type UseJitsiMeetReturn } from "@/hooks/useJitsiMeet";

interface JitsiMeetingProps {
  domain: string;
  roomName: string;
  token?: string | null;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  sessionId: string;
  onReady?: () => void;
  onConferenceJoined?: () => void;
  onConferenceLeft?: () => void;
  onParticipantJoined?: (participant: { id: string; displayName: string; role: string; isLocal: boolean }) => void;
  onParticipantLeft?: (participant: { id: string; displayName: string; role: string; isLocal: boolean }) => void;
  onAudioMuteChanged?: (muted: boolean) => void;
  onVideoMuteChanged?: (muted: boolean) => void;
  onScreenShareChanged?: (sharing: boolean) => void;
  onReadyToClose?: () => void;
  onError?: (error: unknown) => void;
  className?: string;
}

export interface JitsiMeetingHandle {
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  raiseHand: () => void;
  lowerHand: () => void;
  sendChatMessage: (message: string) => void;
  hangUp: () => void;
  kickParticipant: (participantId: string) => void;
  muteParticipant: (participantId: string) => void;
  getParticipants: () => Array<{ id: string; displayName: string; role: string; isLocal: boolean }>;
  isReady: boolean;
  isJoined: boolean;
  participantCount: number;
  localAudioMuted: boolean;
  localVideoMuted: boolean;
  isScreenSharing: boolean;
}

export const JitsiMeeting = forwardRef<JitsiMeetingHandle, JitsiMeetingProps>(function JitsiMeeting(
  {
    domain,
    roomName,
    token,
    displayName,
    email,
    avatarUrl,
    sessionId,
    onReady,
    onConferenceJoined,
    onConferenceLeft,
    onParticipantJoined,
    onParticipantLeft,
    onAudioMuteChanged,
    onVideoMuteChanged,
    onScreenShareChanged,
    onReadyToClose,
    onError,
    className,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = `jitsi-container-${sessionId}`;

  const jitsi = useJitsiMeet({
    domain,
    roomName,
    token,
    displayName,
    email,
    avatarUrl,
    containerId,
    onReady,
    onConferenceJoined,
    onConferenceLeft,
    onParticipantJoined,
    onParticipantLeft,
    onAudioMuteChanged,
    onVideoMuteChanged,
    onScreenShareChanged,
    onReadyToClose,
    onError,
  });

  useImperativeHandle(ref, () => ({
    toggleAudio: jitsi.toggleAudio,
    toggleVideo: jitsi.toggleVideo,
    toggleScreenShare: jitsi.toggleScreenShare,
    raiseHand: jitsi.raiseHand,
    lowerHand: jitsi.lowerHand,
    sendChatMessage: jitsi.sendChatMessage,
    hangUp: jitsi.hangUp,
    kickParticipant: jitsi.kickParticipant,
    muteParticipant: jitsi.muteParticipant,
    getParticipants: jitsi.getParticipants,
    isReady: jitsi.isReady,
    isJoined: jitsi.isJoined,
    participantCount: jitsi.participantCount,
    localAudioMuted: jitsi.localAudioMuted,
    localVideoMuted: jitsi.localVideoMuted,
    isScreenSharing: jitsi.isScreenSharing,
  }), [jitsi]);

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const observer = new ResizeObserver(() => {
        if (container.querySelector("iframe")) {
          const iframe = container.querySelector("iframe") as HTMLIFrameElement;
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.border = "none";
          iframe.style.borderRadius = "16px";
        }
      });
      observer.observe(container);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      id={containerId}
      className={`relative overflow-hidden rounded-2xl bg-[#0B0F19] ${className ?? ""}`}
      style={{ minHeight: "400px" }}
    />
  );
});

export type { UseJitsiMeetReturn };

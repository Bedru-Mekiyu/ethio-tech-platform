import { useRef, useEffect } from "react";
import { useJitsiMeet } from "@/hooks/useJitsiMeet";

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

export function JitsiMeeting({
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
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = `jitsi-container-${sessionId}`;

  useJitsiMeet({
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
}

export type { JitsiMeetingProps };

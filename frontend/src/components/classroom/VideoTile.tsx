import { useEffect, useRef } from "react";
import type { IAgoraRTCRemoteUser, ICameraVideoTrack, ILocalVideoTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import { cn } from "@/lib/utils";

interface VideoTileProps {
  user?: IAgoraRTCRemoteUser;
  localVideoTrack?: ICameraVideoTrack | ILocalVideoTrack | null;
  videoTrack?: IRemoteVideoTrack;
  label?: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isSpeaking?: boolean;
  size?: "compact" | "full" | "spotlight";
  className?: string;
}

function VideoTrackRenderer({
  track,
  className,
}: {
  track: ICameraVideoTrack | IRemoteVideoTrack;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !track) return;

    track.play(containerRef.current);
    const videoElement = containerRef.current.querySelector("video");
    if (videoElement) {
      videoElement.style.width = "100%";
      videoElement.style.height = "100%";
      videoElement.style.objectFit = "cover";
    }

    return () => {
      track.stop();
    };
  }, [track]);

  return <div ref={containerRef} className={cn("w-full h-full", className)} />;
}

export function VideoTile({
  user,
  localVideoTrack,
  videoTrack,
  label,
  isLocal = false,
  isMuted = false,
  isSpeaking = false,
  size = "full",
  className,
}: VideoTileProps) {
  const displayName = label || (isLocal ? "You" : `User ${user?.uid || "?"}`);
  const hasVideo = isLocal ? Boolean(localVideoTrack) : Boolean(videoTrack || user?.videoTrack);
  const hasAudio = isLocal ? !isMuted : Boolean(user?.audioTrack);
  const activeVideoTrack = isLocal ? localVideoTrack : videoTrack || user?.videoTrack;

  const sizeClasses = {
    compact: "w-32 h-24",
    full: "w-full aspect-video",
    spotlight: "w-full h-full",
  };

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden bg-gray-900 border-2 transition-all",
        isSpeaking ? "border-green-500 shadow-lg shadow-green-500/20" : "border-transparent",
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={`Video of ${displayName}${hasAudio ? "" : " (muted)"}`}
    >
      {hasVideo && activeVideoTrack ? (
        <VideoTrackRenderer track={activeVideoTrack as ICameraVideoTrack | IRemoteVideoTrack} />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
          <span className="text-white font-semibold text-lg">
            {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center gap-1.5">
          <span className="text-white text-xs font-medium truncate">{displayName}</span>
          {isLocal && (
            <span className="text-white/60 text-[10px]">(You)</span>
          )}
        </div>
      </div>

      <div className="absolute top-1.5 right-1.5">
        {hasAudio ? (
          <div className="w-5 h-5 rounded-full bg-green-500/80 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a2 2 0 00-2 2v6a2 2 0 104 0V4a2 2 0 00-2-2z" />
              <path d="M7 10a3 3 0 006 0h-6z" />
            </svg>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Participant, Track, TrackPublication, ConnectionQuality } from "livekit-client";
import { Mic, MicOff, Pin, Hand, Signal, Wifi, WifiOff, User as UserIcon, Monitor } from "lucide-react";

interface LiveKitParticipantTileProps {
  participant: Participant;
  isLocal?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  aspectRatio?: "video" | "square" | "auto";
  className?: string;
  isScreenShare?: boolean;
}

export function LiveKitParticipantTile({
  participant,
  isLocal = false,
  isPinned = false,
  onTogglePin,
  aspectRatio = "video",
  className = "",
  isScreenShare = false,
}: LiveKitParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoTrack, setVideoTrack] = useState<TrackPublication | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(participant.isSpeaking);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(participant.connectionQuality);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(!participant.isMicrophoneEnabled);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(!participant.isCameraEnabled);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);

  // Metadata parsing
  let role = "student";
  let avatarUrl: string | null = null;
  try {
    if (participant.metadata) {
      const meta = JSON.parse(participant.metadata);
      if (meta.role) role = meta.role;
      if (meta.avatar) avatarUrl = meta.avatar;
      if (meta.handRaised) setIsHandRaised(true);
    }
  } catch {
    // metadata is string or unformatted
  }

  // Subscribe to participant events
  useEffect(() => {
    const updateTracks = () => {
      let trackPub: TrackPublication | undefined;
      if (isScreenShare) {
        trackPub = participant.getTrackPublication(Track.Source.ScreenShare);
      } else {
        trackPub = participant.getTrackPublication(Track.Source.Camera);
      }
      setVideoTrack(trackPub ?? null);
      setIsVideoMuted(isScreenShare ? !trackPub : !participant.isCameraEnabled);
      setIsAudioMuted(!participant.isMicrophoneEnabled);
    };

    updateTracks();

    const handleTrackSubscribed = () => updateTracks();
    const handleTrackUnsubscribed = () => updateTracks();
    const handleTrackMuted = () => updateTracks();
    const handleTrackUnmuted = () => updateTracks();
    const handleIsSpeakingChanged = (speaking: boolean) => setIsSpeaking(speaking);
    const handleConnectionQualityChanged = (quality: ConnectionQuality) => setConnectionQuality(quality);
    const handleMetadataChanged = (meta?: string) => {
      if (meta) {
        try {
          const parsed = JSON.parse(meta);
          if (parsed.handRaised !== undefined) setIsHandRaised(Boolean(parsed.handRaised));
        } catch {
          // ignore
        }
      }
    };

    participant.on("trackSubscribed", handleTrackSubscribed);
    participant.on("trackUnsubscribed", handleTrackUnsubscribed);
    participant.on("trackMuted", handleTrackMuted);
    participant.on("trackUnmuted", handleTrackUnmuted);
    participant.on("isSpeakingChanged", handleIsSpeakingChanged);
    participant.on("connectionQualityChanged", handleConnectionQualityChanged);
    participant.on("participantMetadataChanged", handleMetadataChanged);

    return () => {
      participant.off("trackSubscribed", handleTrackSubscribed);
      participant.off("trackUnsubscribed", handleTrackUnsubscribed);
      participant.off("trackMuted", handleTrackMuted);
      participant.off("trackUnmuted", handleTrackUnmuted);
      participant.off("isSpeakingChanged", handleIsSpeakingChanged);
      participant.off("connectionQualityChanged", handleConnectionQualityChanged);
      participant.off("participantMetadataChanged", handleMetadataChanged);
    };
  }, [participant, isScreenShare]);

  // Attach video track to element
  useEffect(() => {
    const track = videoTrack?.track;
    const el = videoRef.current;
    if (track && el) {
      track.attach(el);
      return () => {
        track.detach(el);
      };
    }
  }, [videoTrack]);

  const displayName = participant.name || participant.identity || "Participant";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isHost = role === "host" || role === "mentor" || role === "admin";

  const renderQualityIcon = () => {
    switch (connectionQuality) {
      case ConnectionQuality.Excellent:
        return (
          <span title="Connection: Excellent">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
          </span>
        );
      case ConnectionQuality.Good:
        return (
          <span title="Connection: Good">
            <Wifi className="h-3.5 w-3.5 text-teal-400" />
          </span>
        );
      case ConnectionQuality.Poor:
        return (
          <span title="Connection: Poor">
            <Signal className="h-3.5 w-3.5 text-amber-400" />
          </span>
        );
      case ConnectionQuality.Lost:
        return (
          <span title="Connection: Lost">
            <WifiOff className="h-3.5 w-3.5 text-rose-500" />
          </span>
        );
      default:
        return (
          <span title="Connection: Stable">
            <Wifi className="h-3.5 w-3.5 text-slate-400" />
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900 border transition-all duration-300 ${
        isSpeaking ? "border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30" : "border-white/10 hover:border-white/20"
      } ${aspectRatio === "video" ? "aspect-video" : aspectRatio === "square" ? "aspect-square" : "h-full w-full"} ${className}`}
    >
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isVideoMuted ? "opacity-0 invisible" : "opacity-100 visible"
        }`}
      />

      {/* Avatar Fallback when video is muted */}
      {isVideoMuted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#0E1726] to-slate-950 p-4 select-none">
          <div
            className={`relative flex items-center justify-center rounded-2xl shadow-xl transition-transform duration-300 ${
              isSpeaking ? "scale-105 ring-4 ring-emerald-500/40" : ""
            } ${aspectRatio === "video" ? "h-20 w-20 md:h-24 md:w-24 text-2xl md:text-3xl" : "h-16 w-16 text-xl"} font-bold text-white bg-gradient-to-tr ${
              isHost ? "from-violet-600 to-violet-500" : "from-emerald-600 to-teal-500"
            }`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-2xl object-cover" />
            ) : initials ? (
              <span>{initials}</span>
            ) : (
              <UserIcon className="h-8 w-8 text-white/80" />
            )}

            {/* Speaking audio wave indicator around avatar */}
            {isSpeaking && (
              <span className="absolute -inset-1.5 animate-ping rounded-2xl border-2 border-emerald-400/60" />
            )}
          </div>
          <p className="mt-3 text-xs md:text-sm font-medium text-slate-300 max-w-[85%] truncate text-center">
            {displayName} {isLocal && "(You)"}
          </p>
        </div>
      )}

      {/* Top Indicators Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
        {/* Hand Raised Badge */}
        {isHandRaised && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-slate-950 shadow-lg animate-bounce">
            <Hand className="h-3.5 w-3.5 fill-current" />
            <span>Hand Raised</span>
          </div>
        )}

        {/* Screen Share Pill */}
        {isScreenShare && (
          <div className="flex items-center gap-1.5 rounded-full bg-violet-500/90 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white shadow-lg">
            <Monitor className="h-3.5 w-3.5" />
            <span>Screen Share</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Connection Signal */}
          <div className="rounded-lg bg-black/50 backdrop-blur-md p-1.5">
            {renderQualityIcon()}
          </div>

          {/* Pin Button */}
          {onTogglePin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin();
              }}
              className={`pointer-events-auto rounded-lg p-1.5 backdrop-blur-md transition-all ${
                isPinned
                  ? "bg-violet-600 text-white"
                  : "bg-black/50 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-black/80 hover:text-white"
              }`}
              title={isPinned ? "Unpin participant" : "Pin participant"}
            >
              <Pin className={`h-3.5 w-3.5 ${isPinned ? "rotate-45" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Identity & Mic Badge */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs text-white max-w-[80%] border border-white/5">
          <span className="truncate font-medium">{displayName} {isLocal && "(You)"}</span>
          {isHost && (
            <span className="rounded-md bg-violet-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300 uppercase tracking-wider">
              {role === "admin" ? "Admin" : "Mentor"}
            </span>
          )}
        </div>

        <div
          className={`flex h-7 w-7 items-center justify-center rounded-xl backdrop-blur-md ${
            isAudioMuted ? "bg-rose-500/80 text-white" : "bg-black/60 text-emerald-400 border border-white/5"
          }`}
          title={isAudioMuted ? "Muted" : "Unmuted"}
        >
          {isAudioMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        </div>
      </div>
    </div>
  );
}

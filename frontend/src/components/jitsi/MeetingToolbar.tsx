import { Mic, MicOff, Video, VideoOff, Monitor, Hand, PhoneOff, Volume2, Shield } from "lucide-react";

interface MeetingToolbarProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onLeave: () => void;
  isHost?: boolean;
  disabled?: boolean;
  onMuteAll?: () => void;
  onEndMeeting?: () => void;
  isEndingMeeting?: boolean;
}

export function MeetingToolbar({
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  isHandRaised,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onLeave,
  isHost = false,
  disabled = false,
  onMuteAll,
  onEndMeeting,
  isEndingMeeting = false,
}: MeetingToolbarProps) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-[var(--bg-card)] border-t border-white/5">
      <button
        onClick={onToggleAudio}
        disabled={disabled}
        aria-label={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
          isAudioMuted
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            : "bg-white/10 text-white hover:bg-white/20"
        } disabled:opacity-50`}
        title={isAudioMuted ? "Unmute" : "Mute"}
      >
        {isAudioMuted ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      <button
        onClick={onToggleVideo}
        disabled={disabled}
        aria-label={isVideoMuted ? "Start video" : "Stop video"}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
          isVideoMuted
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            : "bg-white/10 text-white hover:bg-white/20"
        } disabled:opacity-50`}
        title={isVideoMuted ? "Start Video" : "Stop Video"}
      >
        {isVideoMuted ? <VideoOff size={18} /> : <Video size={18} />}
      </button>

      {isHost ? (
        <button
          onClick={onToggleScreenShare}
          disabled={disabled}
          aria-label={isScreenSharing ? "Stop screen share" : "Start screen share"}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
            isScreenSharing
              ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              : "bg-white/10 text-white hover:bg-white/20"
          } disabled:opacity-50`}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          <Monitor size={18} />
        </button>
      ) : null}

      <button
        onClick={onToggleHandRaise}
        disabled={disabled}
        aria-label={isHandRaised ? "Lower hand" : "Raise hand"}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
          isHandRaised
            ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
            : "bg-white/10 text-white hover:bg-white/20"
        } disabled:opacity-50`}
        title={isHandRaised ? "Lower Hand" : "Raise Hand"}
      >
        <Hand size={18} />
      </button>

      {isHost && onMuteAll ? (
        <button
          onClick={onMuteAll}
          disabled={disabled}
          aria-label="Mute all participants"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50"
          title="Mute all participants"
        >
          <Volume2 size={18} />
        </button>
      ) : null}

      <button
        onClick={onLeave}
        disabled={isEndingMeeting}
        aria-label="Leave meeting"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
        title="Leave Meeting"
      >
        <PhoneOff size={18} />
      </button>

      {isHost && onEndMeeting ? (
        <button
          onClick={onEndMeeting}
          disabled={isEndingMeeting}
          aria-label="End meeting for everyone"
          className="flex h-10 items-center gap-1.5 rounded-full bg-danger px-4 text-sm font-semibold text-white hover:bg-danger/90 transition-all disabled:opacity-50"
          title="End meeting for everyone"
        >
          <Shield size={16} />
          {isEndingMeeting ? "Ending..." : "End meeting"}
        </button>
      ) : null}
    </div>
  );
}

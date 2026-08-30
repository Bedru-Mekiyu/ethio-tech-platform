import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Hand,
  MessageSquare,
  Pen,
  HelpCircle,
  BarChart3,
  FileText,
  Users,
  Settings,
  PhoneOff,
  VolumeX,
} from "lucide-react";

interface LiveKitToolbarProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;

  // Panel toggles
  activePanel: "none" | "chat" | "qa" | "polls" | "notes" | "resources" | "participants" | "whiteboard" | "breakout";
  onTogglePanel: (panel: "chat" | "qa" | "polls" | "notes" | "resources" | "participants" | "whiteboard" | "breakout") => void;

  // Counts / Badges
  unreadChatCount?: number;
  unreadQaCount?: number;
  activePollCount?: number;
  participantCount?: number;

  // Settings & Exit
  onOpenSettings: () => void;
  onLeave: () => void;
  onEndMeeting?: () => void;
  onMuteAll?: () => void;
  isHost?: boolean;
  isEndingMeeting?: boolean;
}

export function LiveKitToolbar({
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  isHandRaised,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  activePanel,
  onTogglePanel,
  unreadChatCount = 0,
  unreadQaCount = 0,
  activePollCount = 0,
  participantCount = 1,
  onOpenSettings,
  onLeave,
  onEndMeeting,
  onMuteAll,
  isHost = false,
  isEndingMeeting = false,
}: LiveKitToolbarProps) {
  return (
    <nav aria-label="Live session control bar" className="flex h-20 items-center justify-between border-t border-white/10 bg-[#0B0F19]/95 px-4 md:px-8 backdrop-blur-2xl z-30 select-none">
      {/* Left: Host quick tools or secondary shortcuts */}
      <div className="flex items-center gap-2 min-w-0">
        {isHost && onMuteAll && (
          <button
            type="button"
            onClick={onMuteAll}
            className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
            title="Mute all participant microphones"
          >
            <VolumeX className="h-4 w-4" />
            <span>Mute All</span>
          </button>
        )}

        {/* Whiteboard Canvas Toggle */}
        <button
          type="button"
          onClick={() => onTogglePanel("whiteboard")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all border ${
            activePanel === "whiteboard"
              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25"
              : "bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
          title="Toggle Collaborative Whiteboard"
        >
          <Pen className="h-4 w-4" />
          <span className="hidden sm:inline">Whiteboard</span>
        </button>
      </div>

      {/* Center: Primary AV Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Microphone Toggle */}
        <div className="relative group">
          <button
            type="button"
            onClick={onToggleAudio}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition-all shadow-lg ${
              isAudioMuted
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 ring-2 ring-rose-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-white/10 hover:border-emerald-500/50"
            }`}
            title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>

        {/* Camera Toggle */}
        <div className="relative group">
          <button
            type="button"
            onClick={onToggleVideo}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition-all shadow-lg ${
              isVideoMuted
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 ring-2 ring-rose-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-sky-400 border border-white/10 hover:border-sky-500/50"
            }`}
            title={isVideoMuted ? "Turn On Camera" : "Turn Off Camera"}
          >
            {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>
        </div>

        {/* Screen Share Toggle */}
        <button
          type="button"
          onClick={onToggleScreenShare}
          className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition-all border ${
            isScreenSharing
              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-500/30"
              : "bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
          title={isScreenSharing ? "Stop Screen Share" : "Share Your Screen"}
        >
          {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </button>

        {/* Raise Hand Toggle */}
        <button
          type="button"
          onClick={onToggleHandRaise}
          className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition-all border ${
            isHandRaised
              ? "bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/25 animate-bounce"
              : "bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
          title={isHandRaised ? "Lower Your Hand" : "Raise Your Hand"}
        >
          <Hand className={`h-5 w-5 ${isHandRaised ? "fill-current" : ""}`} />
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="hidden sm:flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Device Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Right: Drawer Panels & Leave/End actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Chat Drawer Toggle */}
        <button
          type="button"
          onClick={() => onTogglePanel("chat")}
          className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl transition-all border ${
            activePanel === "chat"
              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25"
              : "bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
          title="Chat Messages"
        >
          <MessageSquare className="h-4 w-4" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white shadow-md">
              {unreadChatCount > 9 ? "9+" : unreadChatCount}
            </span>
          )}
        </button>

        {/* Q&A Drawer Toggle */}
        <button
          type="button"
          onClick={() => onTogglePanel("qa")}
          className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl transition-all border ${
            activePanel === "qa"
              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25"
              : "bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
          title="Questions & Answers"
        >
          <HelpCircle className="h-4 w-4" />
          {unreadQaCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white shadow-md">
              {unreadQaCount}
            </span>
          )}
        </button>

        {/* Polls Drawer Toggle */}
        <button
          type="button"
          onClick={() => onTogglePanel("polls")}
          className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl transition-all border ${
            activePanel === "polls"
              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25"
              : "bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
          title="Interactive Polls"
        >
          <BarChart3 className="h-4 w-4" />
          {activePollCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-md animate-pulse">
              {activePollCount}
            </span>
          )}
        </button>

        {/* Notes & Resources */}
        <button
          type="button"
          onClick={() => onTogglePanel("notes")}
          className={`hidden md:flex relative h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl transition-all border ${
            activePanel === "notes" || activePanel === "resources"
              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25"
              : "bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
          title="Session Notes & Resources"
        >
          <FileText className="h-4 w-4" />
        </button>

        {/* Participants Roster Toggle */}
        <button
          type="button"
          onClick={() => onTogglePanel("participants")}
          className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl transition-all border ${
            activePanel === "participants"
              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25"
              : "bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
          title="Participants Roster"
        >
          <Users className="h-4 w-4" />
          {participantCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 border border-white/20 text-[9px] font-bold text-white">
              {participantCount}
            </span>
          )}
        </button>

        {/* Leave or End Session Button */}
        {isHost && onEndMeeting ? (
          <button
            type="button"
            disabled={isEndingMeeting}
            onClick={onEndMeeting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 sm:px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500 transition-colors disabled:opacity-50"
            title="End Session for Everyone"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="hidden sm:inline">{isEndingMeeting ? "Ending..." : "End Session"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onLeave}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 sm:px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
            title="Leave Session"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        )}
      </div>
    </nav>
  );
}

import { useState } from "react";
import { Participant } from "livekit-client";
import {
  Users,
  X,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  MoreHorizontal,
  Pin,
  UserX,
  VolumeX,
  Shield,
} from "lucide-react";

interface LiveKitParticipantsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  localParticipant: Participant;
  isHost?: boolean;
  onMuteParticipant?: (participant: Participant) => void;
  onKickParticipant?: (participant: Participant) => void;
  onPinParticipant?: (participant: Participant) => void;
  onMuteAll?: () => void;
  onLowerAllHands?: () => void;
  pinnedParticipantId?: string | null;
}

export function LiveKitParticipantsDrawer({
  isOpen,
  onClose,
  participants,
  localParticipant,
  isHost = false,
  onMuteParticipant,
  onKickParticipant,
  onPinParticipant,
  onMuteAll,
  onLowerAllHands,
  pinnedParticipantId,
}: LiveKitParticipantsDrawerProps) {
  const [search, setSearch] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Combine local and remote participants (local first)
  const allParticipants = [localParticipant, ...participants.filter((p) => p.sid !== localParticipant.sid)];

  const filtered = allParticipants.filter((p) => {
    const name = (p.name || p.identity || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const parseMeta = (p: Participant) => {
    try {
      if (p.metadata) return JSON.parse(p.metadata);
    } catch {
      // ignore
    }
    return {};
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-zinc-100 p-2 text-zinc-900">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Participants</h2>
            <p className="text-[11px] text-slate-500">{allParticipants.length} people in session</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search participants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-xs"
          />
        </div>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 divide-y divide-slate-100">
        {filtered.map((p) => {
          const isLocal = p.sid === localParticipant.sid;
          const meta = parseMeta(p);
          const role = meta.role || (p.name?.includes("Mentor") ? "host" : "student");
          const isParticipantHost = role === "host" || role === "mentor" || role === "admin";
          const isAudioMuted = !p.isMicrophoneEnabled;
          const isVideoMuted = !p.isCameraEnabled;
          const hasHandRaised = Boolean(meta.handRaised);
          const isPinned = pinnedParticipantId === p.identity || pinnedParticipantId === p.sid;

          const displayName = p.name || p.identity || "Participant";
          const initials = displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={p.sid || p.identity}
              className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 transition-colors group relative"
            >
              {/* Left: Avatar & Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-semibold text-xs text-white shadow-xs ${
                    isParticipantHost ? "bg-zinc-900 ring-2 ring-zinc-200" : "bg-slate-700 text-white"
                  }`}
                >
                  {meta.avatar ? (
                    <img src={meta.avatar} alt={displayName} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">{displayName}</p>
                    {isLocal && <span className="text-[10px] text-slate-500">(You)</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isParticipantHost ? (
                      <span className="inline-flex items-center gap-0.5 rounded bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-900 uppercase tracking-wider">
                        <Shield className="h-2.5 w-2.5" /> Mentor
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Student</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: State Icons & Host Action Menu */}
              <div className="flex items-center gap-2 shrink-0">
                {hasHandRaised && (
                  <span className="rounded-md bg-amber-50 p-1 text-amber-600 animate-bounce" title="Hand Raised">
                    <Hand className="h-3.5 w-3.5 fill-current" />
                  </span>
                )}

                <span
                  className={`p-1 rounded-md ${isAudioMuted ? "text-rose-600 bg-rose-50" : "text-slate-400"}`}
                  title={isAudioMuted ? "Mic Off" : "Mic On"}
                >
                  {isAudioMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </span>

                <span
                  className={`p-1 rounded-md ${isVideoMuted ? "text-slate-400" : "text-zinc-900 bg-zinc-100"}`}
                  title={isVideoMuted ? "Camera Off" : "Camera On"}
                >
                  {isVideoMuted ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                </span>

                {/* Host Moderation Menu */}
                {isHost && !isLocal && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === p.sid ? null : p.sid)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>

                    {activeMenuId === p.sid && (
                      <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl z-50">
                        {onPinParticipant && (
                          <button
                            type="button"
                            onClick={() => {
                              onPinParticipant(p);
                              setActiveMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <Pin className="h-3.5 w-3.5 text-slate-500" />{" "}
                            {isPinned ? "Unpin participant" : "Spotlight / Pin"}
                          </button>
                        )}
                        {onMuteParticipant && !isAudioMuted && (
                          <button
                            type="button"
                            onClick={() => {
                              onMuteParticipant(p);
                              setActiveMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50"
                          >
                            <VolumeX className="h-3.5 w-3.5" /> Mute participant
                          </button>
                        )}
                        {onKickParticipant && (
                          <button
                            type="button"
                            onClick={() => {
                              onKickParticipant(p);
                              setActiveMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            <UserX className="h-3.5 w-3.5" /> Remove from session
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Global Quick Actions */}
      {isHost && (
        <div className="border-t border-slate-200 p-4 bg-slate-50/60 space-y-2">
          <div className="flex gap-2">
            {onMuteAll && (
              <button
                type="button"
                onClick={onMuteAll}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors shadow-xs"
              >
                <VolumeX className="h-3.5 w-3.5" /> Mute All
              </button>
            )}
            {onLowerAllHands && (
              <button
                type="button"
                onClick={onLowerAllHands}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Hand className="h-3.5 w-3.5" /> Lower Hands
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

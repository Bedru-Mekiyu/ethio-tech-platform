import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Room,
  RoomEvent,
  VideoPresets,
  Participant,
  RemoteParticipant,
  Track,
  TrackPublication,
  ConnectionState,
} from "livekit-client";
import { LiveKitParticipantTile } from "./LiveKitParticipantTile";
import { LiveKitToolbar } from "./LiveKitToolbar";
import { LiveKitHeader } from "./LiveKitHeader";
import { LiveKitParticipantsDrawer } from "./LiveKitParticipantsDrawer";
import { LiveKitDeviceSettingsModal } from "./LiveKitDeviceSettingsModal";
import { LiveKitLobby } from "./LiveKitLobby";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface LiveKitMeetingProps {
  url: string;
  token: string;
  roomName?: string;
  displayName?: string;
  sessionId?: string;
  sessionTitle?: string;
  mentorName?: string;
  isHost?: boolean;
  liveStartedAt?: string | null;
  isRecording?: boolean;
  skipLobby?: boolean;
  onConferenceJoined?: () => void;
  onConferenceLeft?: () => void;
  onParticipantJoined?: (p: Participant) => void;
  onParticipantLeft?: (p: Participant) => void;
  onAudioMuteChanged?: (muted: boolean) => void;
  onVideoMuteChanged?: (muted: boolean) => void;
  onScreenShareChanged?: (sharing: boolean) => void;
  onLeave?: () => void;
  onEndMeeting?: () => void;
  isEndingMeeting?: boolean;
  className?: string;

  // Active side panel state passed from parent
  activePanel?: "none" | "chat" | "qa" | "polls" | "notes" | "resources" | "participants" | "whiteboard" | "breakout";
  onTogglePanel?: (panel: "chat" | "qa" | "polls" | "notes" | "resources" | "participants" | "whiteboard" | "breakout") => void;

  // Badge counts
  unreadChatCount?: number;
  unreadQaCount?: number;
  activePollCount?: number;
}

export interface LiveKitMeetingHandle {
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  raiseHand: () => void;
  lowerHand: () => void;
  hangUp: () => void;
  muteParticipant: (participantId: string) => Promise<void>;
  muteAllParticipants: () => Promise<void>;
  kickParticipant: (participantId: string) => Promise<void>;
  getParticipants: () => Participant[];
  isReady: boolean;
  isJoined: boolean;
  localAudioMuted: boolean;
  localVideoMuted: boolean;
  isScreenSharing: boolean;
  room: Room | null;
}

export const LiveKitMeeting = forwardRef<LiveKitMeetingHandle, LiveKitMeetingProps>(function LiveKitMeeting(
  {
    url,
    token,
    sessionTitle = "Classroom Live Session",
    mentorName,
    isHost = false,
    liveStartedAt,
    isRecording = false,
    skipLobby = false,
    onConferenceJoined,
    onConferenceLeft,
    onParticipantJoined,
    onParticipantLeft,
    onAudioMuteChanged,
    onVideoMuteChanged,
    onScreenShareChanged,
    onLeave,
    onEndMeeting,
    isEndingMeeting = false,
    className = "",
    activePanel = "none",
    onTogglePanel,
    unreadChatCount = 0,
    unreadQaCount = 0,
    activePollCount = 0,
  },
  ref,
) {
  const [inLobby, setInLobby] = useState(!skipLobby);
  const [isJoining, setIsJoining] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<Participant | null>(null);
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [screenShareTrack, setScreenShareTrack] = useState<{ participant: Participant; track: TrackPublication } | null>(null);

  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const [layout, setLayout] = useState<"grid" | "speaker">("grid");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isParticipantsDrawerOpen, setIsParticipantsDrawerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Connect to LiveKit Room
  const connectToRoom = useCallback(
    async (options?: { initialAudio?: boolean; initialVideo?: boolean }) => {
      try {
        setIsJoining(true);
        setConnectionError(null);

        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
        });

        // Event listeners
        newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
          setConnectionState(state);
          if (state === ConnectionState.Disconnected) {
            onConferenceLeft?.();
          }
        });

        newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          setParticipants((prev) => [...prev.filter((p) => p.sid !== participant.sid), participant]);
          onParticipantJoined?.(participant);
        });

        newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          setParticipants((prev) => prev.filter((p) => p.sid !== participant.sid));
          if (pinnedParticipantId === participant.sid || pinnedParticipantId === participant.identity) {
            setPinnedParticipantId(null);
          }
          if (screenShareTrack?.participant.sid === participant.sid) {
            setScreenShareTrack(null);
          }
          onParticipantLeft?.(participant);
        });

        newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          if (speakers.length > 0) {
            setActiveSpeaker(speakers[0]);
          } else {
            setActiveSpeaker(null);
          }
        });

        newRoom.on(RoomEvent.TrackSubscribed, (_track, publication, participant) => {
          if (publication.source === Track.Source.ScreenShare) {
            setScreenShareTrack({ participant, track: publication });
          }
          setParticipants([...newRoom.remoteParticipants.values()]);
        });

        newRoom.on(RoomEvent.TrackUnsubscribed, (_track, publication, participant) => {
          if (publication.source === Track.Source.ScreenShare) {
            setScreenShareTrack((curr) => (curr?.participant.sid === participant.sid ? null : curr));
          }
          setParticipants([...newRoom.remoteParticipants.values()]);
        });

        newRoom.on(RoomEvent.LocalTrackPublished, (publication) => {
          if (publication.source === Track.Source.ScreenShare) {
            setIsScreenSharing(true);
            onScreenShareChanged?.(true);
            setScreenShareTrack({ participant: newRoom.localParticipant, track: publication });
          }
        });

        newRoom.on(RoomEvent.LocalTrackUnpublished, (publication) => {
          if (publication.source === Track.Source.ScreenShare) {
            setIsScreenSharing(false);
            onScreenShareChanged?.(false);
            setScreenShareTrack((curr) => (curr?.participant.sid === newRoom.localParticipant.sid ? null : curr));
          }
        });

        await newRoom.connect(url, token);
        setRoom(newRoom);
        setParticipants([...newRoom.remoteParticipants.values()]);

        // Publish local camera and mic based on initial preferences
        const audioInit = options?.initialAudio ?? !isAudioMuted;
        const videoInit = options?.initialVideo ?? !isVideoMuted;

        if (audioInit) {
          await newRoom.localParticipant.setMicrophoneEnabled(true).catch(console.warn);
          setIsAudioMuted(false);
          onAudioMuteChanged?.(false);
        } else {
          setIsAudioMuted(true);
          onAudioMuteChanged?.(true);
        }

        if (videoInit) {
          await newRoom.localParticipant.setCameraEnabled(true).catch(console.warn);
          setIsVideoMuted(false);
          onVideoMuteChanged?.(false);
        } else {
          setIsVideoMuted(true);
          onVideoMuteChanged?.(true);
        }

        setInLobby(false);
        onConferenceJoined?.();
      } catch (err: unknown) {
        console.error("LiveKit connection error:", err);
        const message = err instanceof Error ? err.message : "Failed to connect to LiveKit media server";
        setConnectionError(message);
      } finally {
        setIsJoining(false);
      }
    },
    [
      url,
      token,
      isAudioMuted,
      isVideoMuted,
      pinnedParticipantId,
      screenShareTrack,
      onConferenceJoined,
      onConferenceLeft,
      onParticipantJoined,
      onParticipantLeft,
      onAudioMuteChanged,
      onVideoMuteChanged,
      onScreenShareChanged,
    ],
  );

  // Auto-connect if skipLobby is true
  useEffect(() => {
    if (skipLobby && url && token) {
      void connectToRoom();
    }
  }, [skipLobby, url, token]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  // Imperative Actions
  const toggleAudio = async () => {
    if (!room) return;
    try {
      const nextState = !isAudioMuted;
      await room.localParticipant.setMicrophoneEnabled(!nextState);
      setIsAudioMuted(nextState);
      onAudioMuteChanged?.(nextState);
    } catch (err) {
      console.error("Error toggling audio:", err);
    }
  };

  const toggleVideo = async () => {
    if (!room) return;
    try {
      const nextState = !isVideoMuted;
      await room.localParticipant.setCameraEnabled(!nextState);
      setIsVideoMuted(nextState);
      onVideoMuteChanged?.(nextState);
    } catch (err) {
      console.error("Error toggling video:", err);
    }
  };

  const toggleScreenShare = async () => {
    if (!room) return;
    try {
      const nextState = !isScreenSharing;
      await room.localParticipant.setScreenShareEnabled(nextState);
      setIsScreenSharing(nextState);
      onScreenShareChanged?.(nextState);
    } catch (err) {
      console.error("Error toggling screen share:", err);
    }
  };

  const raiseHand = () => {
    setIsHandRaised(true);
    if (room?.localParticipant) {
      const existingMeta = room.localParticipant.metadata ? JSON.parse(room.localParticipant.metadata) : {};
      room.localParticipant.setMetadata(JSON.stringify({ ...existingMeta, handRaised: true }));
    }
  };

  const lowerHand = () => {
    setIsHandRaised(false);
    if (room?.localParticipant) {
      const existingMeta = room.localParticipant.metadata ? JSON.parse(room.localParticipant.metadata) : {};
      room.localParticipant.setMetadata(JSON.stringify({ ...existingMeta, handRaised: false }));
    }
  };

  const toggleHandRaise = () => {
    if (isHandRaised) {
      lowerHand();
    } else {
      raiseHand();
    }
  };

  const hangUp = () => {
    if (room) {
      room.disconnect();
    }
    (onLeave || onConferenceLeft)?.();
  };

  const muteParticipant = async (participantId: string) => {
    if (!isHost) return;
    const target = participants.find((p) => p.identity === participantId || p.sid === participantId);
    if (target) {
      const track = target.getTrackPublication(Track.Source.Microphone);
      if (track?.track?.mediaStreamTrack) {
        track.track.mediaStreamTrack.enabled = false;
      }
    }
  };

  const muteAllParticipants = async () => {
    if (!isHost) return;
    for (const p of participants) {
      const track = p.getTrackPublication(Track.Source.Microphone);
      if (track?.track?.mediaStreamTrack) {
        track.track.mediaStreamTrack.enabled = false;
      }
    }
  };

  const kickParticipant = async (participantId: string) => {
    if (!isHost) return;
    setParticipants((prev) => prev.filter((p) => p.identity !== participantId && p.sid !== participantId));
  };

  useImperativeHandle(
    ref,
    () => ({
      toggleAudio,
      toggleVideo,
      toggleScreenShare,
      raiseHand,
      lowerHand,
      hangUp,
      muteParticipant,
      muteAllParticipants,
      kickParticipant,
      getParticipants: () => (room ? [room.localParticipant, ...participants] : []),
      isReady: Boolean(room && connectionState === ConnectionState.Connected),
      isJoined: connectionState === ConnectionState.Connected,
      localAudioMuted: isAudioMuted,
      localVideoMuted: isVideoMuted,
      isScreenSharing,
      room,
    }),
    [room, connectionState, isAudioMuted, isVideoMuted, isScreenSharing, participants],
  );

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen().catch(console.warn);
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen().catch(console.warn);
      setIsFullscreen(false);
    }
  };

  // If in Lobby mode
  if (inLobby) {
    return (
      <LiveKitLobby
        sessionTitle={sessionTitle}
        mentorName={mentorName}
        isJoining={isJoining}
        onJoin={(options) => void connectToRoom(options)}
      />
    );
  }

  // Connection Error Screen
  if (connectionError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#0B0F19] p-6 text-center">
        <div className="max-w-md rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Connection Error</h2>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">{connectionError}</p>
          <button
            type="button"
            onClick={() => void connectToRoom()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/25"
          >
            <RefreshCw className="h-4 w-4" /> Try Reconnecting
          </button>
        </div>
      </div>
    );
  }

  // Active participants list
  const localParticipant = room?.localParticipant;
  const allTiles: Array<{ participant: Participant; isLocal: boolean; isScreenShare?: boolean }> = [];

  if (screenShareTrack) {
    allTiles.push({
      participant: screenShareTrack.participant,
      isLocal: screenShareTrack.participant.sid === localParticipant?.sid,
      isScreenShare: true,
    });
  }

  if (localParticipant) {
    allTiles.push({ participant: localParticipant, isLocal: true });
  }

  participants.forEach((p) => {
    allTiles.push({ participant: p, isLocal: false });
  });

  const pinnedParticipant = pinnedParticipantId
    ? allTiles.find((t) => t.participant.identity === pinnedParticipantId || t.participant.sid === pinnedParticipantId)
    : null;

  // Decide prominent hero tile for Spotlight/Speaker View
  const heroTile = screenShareTrack
    ? { participant: screenShareTrack.participant, isLocal: screenShareTrack.participant.sid === localParticipant?.sid, isScreenShare: true }
    : pinnedParticipant || (activeSpeaker ? { participant: activeSpeaker, isLocal: activeSpeaker.sid === localParticipant?.sid } : allTiles[0]);

  const secondaryTiles = allTiles.filter((t) => t.participant.sid !== heroTile?.participant.sid);

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full w-full flex-col overflow-hidden bg-[#0B0F19] text-white ${className}`}
    >
      {/* Header Bar */}
      <LiveKitHeader
        title={sessionTitle}
        mentorName={mentorName}
        liveStartedAt={liveStartedAt}
        participantCount={allTiles.length}
        isRecording={isRecording}
        layout={layout}
        onChangeLayout={setLayout}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      />

      {/* Main Video Arena */}
      <main aria-label="Video arena" className="relative flex-1 overflow-hidden p-3 md:p-4">
        {layout === "speaker" || screenShareTrack || pinnedParticipant ? (
          /* Speaker / Spotlight Layout */
          <div className="flex h-full w-full flex-col lg:flex-row gap-3 md:gap-4">
            {/* Primary Hero Stage */}
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
              {heroTile && (
                <LiveKitParticipantTile
                  participant={heroTile.participant}
                  isLocal={heroTile.isLocal}
                  isScreenShare={heroTile.isScreenShare}
                  isPinned={Boolean(pinnedParticipantId)}
                  onTogglePin={() =>
                    setPinnedParticipantId((curr) =>
                      curr === heroTile.participant.identity ? null : heroTile.participant.identity,
                    )
                  }
                  aspectRatio="auto"
                  className="h-full w-full shadow-2xl"
                />
              )}
            </div>

            {/* Side / Top Secondary Strip */}
            {secondaryTiles.length > 0 && (
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:w-64 shrink-0 py-1">
                {secondaryTiles.map((tile) => (
                  <div key={tile.participant.sid || tile.participant.identity} className="w-44 lg:w-full shrink-0">
                    <LiveKitParticipantTile
                      participant={tile.participant}
                      isLocal={tile.isLocal}
                      isScreenShare={tile.isScreenShare}
                      isPinned={pinnedParticipantId === tile.participant.identity}
                      onTogglePin={() =>
                        setPinnedParticipantId((curr) =>
                          curr === tile.participant.identity ? null : tile.participant.identity,
                        )
                      }
                      aspectRatio="video"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Auto-adapting Grid Layout */
          <div
            className={`grid h-full w-full gap-3 md:gap-4 auto-rows-fr ${
              allTiles.length <= 1
                ? "grid-cols-1"
                : allTiles.length <= 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : allTiles.length <= 4
                    ? "grid-cols-2"
                    : allTiles.length <= 6
                      ? "grid-cols-2 md:grid-cols-3"
                      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {allTiles.map((tile) => (
              <LiveKitParticipantTile
                key={tile.participant.sid || tile.participant.identity}
                participant={tile.participant}
                isLocal={tile.isLocal}
                isScreenShare={tile.isScreenShare}
                isPinned={pinnedParticipantId === tile.participant.identity}
                onTogglePin={() =>
                  setPinnedParticipantId((curr) =>
                    curr === tile.participant.identity ? null : tile.participant.identity,
                  )
                }
                aspectRatio="auto"
              />
            ))}
          </div>
        )}
      </main>

      {/* Interactive Bottom Toolbar */}
      <LiveKitToolbar
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        onToggleAudio={() => void toggleAudio()}
        onToggleVideo={() => void toggleVideo()}
        onToggleScreenShare={() => void toggleScreenShare()}
        onToggleHandRaise={toggleHandRaise}
        activePanel={activePanel}
        onTogglePanel={(panel) => {
          if (panel === "participants") {
            setIsParticipantsDrawerOpen((prev) => !prev);
          } else if (onTogglePanel) {
            onTogglePanel(panel);
          }
        }}
        unreadChatCount={unreadChatCount}
        unreadQaCount={unreadQaCount}
        activePollCount={activePollCount}
        participantCount={allTiles.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLeave={hangUp}
        onEndMeeting={isHost ? onEndMeeting : undefined}
        onMuteAll={isHost ? () => void muteAllParticipants() : undefined}
        isHost={isHost}
        isEndingMeeting={isEndingMeeting}
      />

      {/* Participants Drawer */}
      {localParticipant && (
        <LiveKitParticipantsDrawer
          isOpen={isParticipantsDrawerOpen}
          onClose={() => setIsParticipantsDrawerOpen(false)}
          participants={participants}
          localParticipant={localParticipant}
          isHost={isHost}
          onMuteParticipant={(p) => void muteParticipant(p.identity)}
          onKickParticipant={(p) => void kickParticipant(p.identity)}
          onPinParticipant={(p) =>
            setPinnedParticipantId((curr) => (curr === p.identity ? null : p.identity))
          }
          onMuteAll={() => void muteAllParticipants()}
          onLowerAllHands={() => setIsHandRaised(false)}
          pinnedParticipantId={pinnedParticipantId}
        />
      )}

      {/* Device Settings Modal */}
      <LiveKitDeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        room={room}
      />
    </div>
  );
});

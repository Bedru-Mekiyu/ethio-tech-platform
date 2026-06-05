import { useEffect, useRef, useCallback, useState } from "react";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>
    ) => JitsiMeetAPI;
  }
}

interface JitsiMeetAPI {
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  addListener: (event: string, handler: (data: unknown) => void) => void;
  removeListener: (event: string, handler: (data: unknown) => void) => void;
  getParticipantsInfo: () => Array<{ id: string; displayName: string; role: string }>;
  isAudioMuted: () => Promise<boolean>;
  isVideoMuted: () => Promise<boolean>;
}

interface JitsiParticipant {
  id: string;
  displayName: string;
  role: string;
  isLocal: boolean;
}

interface UseJitsiMeetOptions {
  domain: string;
  roomName: string;
  token?: string | null;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  containerId: string;
  onReady?: () => void;
  onConferenceJoined?: () => void;
  onConferenceLeft?: () => void;
  onParticipantJoined?: (participant: JitsiParticipant) => void;
  onParticipantLeft?: (participant: JitsiParticipant) => void;
  onAudioMuteChanged?: (muted: boolean) => void;
  onVideoMuteChanged?: (muted: boolean) => void;
  onScreenShareChanged?: (sharing: boolean) => void;
  onChatMessage?: (message: { sender: string; text: string; timestamp: number }) => void;
  onReadyToClose?: () => void;
  onError?: (error: unknown) => void;
}

export interface UseJitsiMeetReturn {
  isReady: boolean;
  isJoined: boolean;
  participantCount: number;
  localAudioMuted: boolean;
  localVideoMuted: boolean;
  isScreenSharing: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  raiseHand: () => void;
  lowerHand: () => void;
  sendChatMessage: (message: string) => void;
  hangUp: () => void;
  kickParticipant: (participantId: string) => void;
  muteParticipant: (participantId: string) => void;
  getParticipants: () => JitsiParticipant[];
}

const JITSI_SCRIPT_ID = "jitsi-meet-api-script";

export function useJitsiMeet(options: UseJitsiMeetOptions): UseJitsiMeetReturn {
  const {
    domain,
    roomName,
    token,
    containerId,
  } = options;

  const apiRef = useRef<JitsiMeetAPI | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [localAudioMuted, setLocalAudioMuted] = useState(false);
  const [localVideoMuted, setLocalVideoMuted] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const loadScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.getElementById(JITSI_SCRIPT_ID)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.id = JITSI_SCRIPT_ID;
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Jitsi Meet API"));
      document.head.appendChild(script);
    });
  }, [domain]);

  const toggleAudio = useCallback(() => {
    apiRef.current?.executeCommand("toggleAudio");
    setLocalAudioMuted((prev) => {
      const next = !prev;
      callbacksRef.current.onAudioMuteChanged?.(next);
      return next;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    apiRef.current?.executeCommand("toggleVideo");
    setLocalVideoMuted((prev) => {
      const next = !prev;
      callbacksRef.current.onVideoMuteChanged?.(next);
      return next;
    });
  }, []);

  const toggleScreenShare = useCallback(() => {
    apiRef.current?.executeCommand("toggleShareScreen");
  }, []);

  const raiseHand = useCallback(() => {
    apiRef.current?.executeCommand("toggleHandRaise");
  }, []);

  const lowerHand = useCallback(() => {
    apiRef.current?.executeCommand("toggleHandRaise");
  }, []);

  const sendChatMessage = useCallback((message: string) => {
    apiRef.current?.executeCommand("sendChatMessage", message);
  }, []);

  const hangUp = useCallback(() => {
    apiRef.current?.executeCommand("hangup");
  }, []);

  const kickParticipant = useCallback((participantId: string) => {
    apiRef.current?.executeCommand("kickParticipant", participantId);
  }, []);

  const muteParticipant = useCallback((participantId: string) => {
    apiRef.current?.executeCommand("muteParticipant", participantId, true);
  }, []);

  const getParticipants = useCallback((): JitsiParticipant[] => {
    const raw = apiRef.current?.getParticipantsInfo() ?? [];
    return raw.map((p) => ({ ...p, isLocal: false })) as JitsiParticipant[];
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await loadScript();

        if (!mounted || !window.JitsiMeetExternalAPI) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        const api = new window.JitsiMeetExternalAPI(domain, {
          roomName,
          token: token || undefined,
          parentNode: container,
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            disableInitialLiveStreaming: true,
            defaultLanguage: "en",
            toolbarButtons: [],
            hideConferenceSubject: true,
            hideConferenceTimer: true,
            readOnly: false,
          },
          interfaceConfigOverwrite: {
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            SHOW_PROMOTIONAL_PAGE: false,
            TOOLBAR_ALWAYS_VISIBLE: false,
            TOOLBAR_TIMEOUT: 0,
            DEFAULT_BACKGROUND: "#0B0F19",
            filmstripOnly: false,
            VIDEO_LAYOUT_CHOICE: "auto",
          },
        });

        apiRef.current = api;

        api.addListener("ready", () => {
          if (mounted) {
            setIsReady(true);
            callbacksRef.current.onReady?.();
          }
        });

        api.addListener("videoConferenceJoined", () => {
          if (mounted) {
            setIsJoined(true);
            setParticipantCount((c) => c + 1);
            callbacksRef.current.onConferenceJoined?.();
          }
        });

        api.addListener("videoConferenceLeft", () => {
          if (mounted) {
            setIsJoined(false);
            setParticipantCount(0);
            callbacksRef.current.onConferenceLeft?.();
          }
        });

        api.addListener("participantJoined", (data: unknown) => {
          const p = data as JitsiParticipant;
          if (mounted) {
            setParticipantCount((c) => c + 1);
            callbacksRef.current.onParticipantJoined?.(p);
          }
        });

        api.addListener("participantLeft", (data: unknown) => {
          const p = data as JitsiParticipant;
          if (mounted) {
            setParticipantCount((c) => Math.max(0, c - 1));
            callbacksRef.current.onParticipantLeft?.(p);
          }
        });

        api.addListener("audioMuteStatusChanged", (data: unknown) => {
          const { muted } = data as { muted: boolean };
          if (mounted) {
            setLocalAudioMuted(muted);
            callbacksRef.current.onAudioMuteChanged?.(muted);
          }
        });

        api.addListener("videoMuteStatusChanged", (data: unknown) => {
          const { muted } = data as { muted: boolean };
          if (mounted) {
            setLocalVideoMuted(muted);
            callbacksRef.current.onVideoMuteChanged?.(muted);
          }
        });

        api.addListener("screenSharingStatusChanged", (data: unknown) => {
          const { on } = data as { on: boolean };
          if (mounted) {
            setIsScreenSharing(on);
            callbacksRef.current.onScreenShareChanged?.(on);
          }
        });

        api.addListener("chatMessageReceived", (data: unknown) => {
          const msg = data as { sender: string; message: string; timestamp: number };
          callbacksRef.current.onChatMessage?.({
            sender: msg.sender,
            text: msg.message,
            timestamp: msg.timestamp,
          });
        });

        api.addListener("readyToClose", () => {
          callbacksRef.current.onReadyToClose?.();
        });

        api.addListener("error", (data: unknown) => {
          callbacksRef.current.onError?.(data);
        });
      } catch (err) {
        if (mounted) {
          callbacksRef.current.onError?.(err);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [domain, roomName, token, containerId, loadScript]);

  return {
    isReady,
    isJoined,
    participantCount,
    localAudioMuted,
    localVideoMuted,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    raiseHand,
    lowerHand,
    sendChatMessage,
    hangUp,
    kickParticipant,
    muteParticipant,
    getParticipants,
  };
}

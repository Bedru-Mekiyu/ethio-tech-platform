import { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, {
  type IAgoraRTCClient,
  type IMicrophoneAudioTrack,
  type ICameraVideoTrack,
  type ILocalVideoTrack,
  type IRemoteVideoTrack,
  type IRemoteAudioTrack,
  type UID,
} from "agora-rtc-sdk-ng";

export interface AgoraUser {
  uid: UID;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
  hasAudio: boolean;
  hasVideo: boolean;
}

export interface UseAgoraRoomOptions {
  appId: string;
  channel: string;
  token: string | null;
  uid?: string | number;
  onTokenWillExpire?: () => void;
  onTokenExpired?: () => void;
}

export interface UseAgoraRoomReturn {
  localAudioTrack: IMicrophoneAudioTrack | null;
  localVideoTrack: ICameraVideoTrack | null;
  remoteUsers: AgoraUser[];
  screenTrack: ILocalVideoTrack | null;
  isJoined: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  error: string | null;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
}

AgoraRTC.setLogLevel(3);

export function useAgoraRoom({
  appId,
  channel,
  token,
  uid,
  onTokenWillExpire,
  onTokenExpired,
}: UseAgoraRoomOptions): UseAgoraRoomReturn {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const screenRef = useRef<ILocalVideoTrack | null>(null);

  const [isJoined, setIsJoined] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<AgoraUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const updateRemoteUsers = useCallback((client: IAgoraRTCClient) => {
    const users = client.remoteUsers.map((user) => ({
      uid: user.uid,
      videoTrack: user.videoTrack,
      audioTrack: user.audioTrack,
      hasAudio: Boolean(user.audioTrack),
      hasVideo: Boolean(user.videoTrack),
    }));
    setRemoteUsers(users);
  }, []);

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    client.on("user-published", async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        updateRemoteUsers(client);
      } catch (err) {
        console.error("[Agora] Subscribe failed:", err);
      }
    });

    client.on("user-unpublished", () => {
      updateRemoteUsers(client);
    });

    client.on("user-joined", () => {
      updateRemoteUsers(client);
    });

    client.on("user-left", () => {
      updateRemoteUsers(client);
    });

    client.on("token-privilege-will-expire", () => {
      onTokenWillExpire?.();
    });

    client.on("token-privilege-did-expire", () => {
      onTokenExpired?.();
    });

    return () => {
      client.removeAllListeners();
      clientRef.current = null;
    };
  }, [appId, updateRemoteUsers, onTokenWillExpire, onTokenExpired]);

  const join = useCallback(async () => {
    if (!clientRef.current) return;
    try {
      setError(null);
      const client = clientRef.current;
      const joinedUid = await client.join(channel, token || "", uid);
      console.log("[Agora] Joined channel:", channel, "UID:", joinedUid);

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioRef.current = audioTrack;
      localVideoRef.current = videoTrack;

      await client.publish([audioTrack, videoTrack]);
      setIsJoined(true);
      updateRemoteUsers(client);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join room";
      setError(message);
      console.error("[Agora] Join failed:", err);
    }
  }, [channel, token, uid, updateRemoteUsers]);

  const leave = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      if (screenRef.current) {
        screenRef.current.stop();
        screenRef.current.close();
        screenRef.current = null;
        setIsScreenSharing(false);
      }

      localAudioRef.current?.stop();
      localAudioRef.current?.close();
      localVideoRef.current?.stop();
      localVideoRef.current?.close();
      localAudioRef.current = null;
      localVideoRef.current = null;

      await clientRef.current.leave();
      setIsJoined(false);
      setRemoteUsers([]);
    } catch (err) {
      console.error("[Agora] Leave failed:", err);
    }
  }, []);

  const toggleAudio = useCallback(async () => {
    if (!localAudioRef.current) return;
    const enabled = !isAudioEnabled;
    await localAudioRef.current.setEnabled(enabled);
    setIsAudioEnabled(enabled);
  }, [isAudioEnabled]);

  const toggleVideo = useCallback(async () => {
    if (!localVideoRef.current) return;
    const enabled = !isVideoEnabled;
    await localVideoRef.current.setEnabled(enabled);
    setIsVideoEnabled(enabled);
  }, [isVideoEnabled]);

  const startScreenShare = useCallback(async () => {
    if (!clientRef.current || isScreenSharing) return;
    try {
      const screenVideoTrackResult = await AgoraRTC.createScreenVideoTrack(
        { encoderConfig: "1080p_1" },
        "auto"
      );
      const screenVideoTrack = Array.isArray(screenVideoTrackResult)
        ? screenVideoTrackResult[0]
        : screenVideoTrackResult;
      screenRef.current = screenVideoTrack;
      await clientRef.current.publish(screenVideoTrack);
      setIsScreenSharing(true);

      screenVideoTrack.on("track-ended", () => {
        stopScreenShare();
      });
    } catch (err) {
      console.error("[Agora] Screen share failed:", err);
      setError("Screen share failed");
    }
  }, [isScreenSharing]);

  const stopScreenShare = useCallback(async () => {
    if (!clientRef.current || !screenRef.current) return;
    screenRef.current.stop();
    screenRef.current.close();
    await clientRef.current.unpublish(screenRef.current);
    screenRef.current = null;
    setIsScreenSharing(false);
  }, []);

  useEffect(() => {
    return () => {
      if (isJoined) {
        leave();
      }
    };
  }, [isJoined, leave]);

  return {
    localAudioTrack: localAudioRef.current,
    localVideoTrack: localVideoRef.current,
    remoteUsers,
    screenTrack: screenRef.current,
    isJoined,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    error,
    join,
    leave,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  };
}

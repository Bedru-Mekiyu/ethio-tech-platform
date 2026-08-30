import { AccessToken, RoomServiceClient, WebhookReceiver } from "livekit-server-sdk";
import { getLiveKitConfig } from "../config/livekit.js";
import { logger } from "../lib/logger.js";

const ROOM_PREFIX = "session";

export const generateRoomName = (sessionId) => {
  return `${ROOM_PREFIX}_${String(sessionId)}`;
};

export const getPublicLiveKitConfig = () => {
  const config = getLiveKitConfig();
  return {
    url: config.url,
    enabled: config.enabled,
  };
};

const getHttpServerUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("wss://")) return url.replace("wss://", "https://");
  if (url.startsWith("ws://")) return url.replace("ws://", "http://");
  return url;
};

let cachedRoomService = null;
export const getRoomServiceClient = () => {
  if (cachedRoomService) return cachedRoomService;
  const config = getLiveKitConfig();
  if (!config.apiKey || !config.apiSecret) return null;
  const host = getHttpServerUrl(config.url);
  try {
    cachedRoomService = new RoomServiceClient(host, config.apiKey, config.apiSecret);
    return cachedRoomService;
  } catch (err) {
    logger.warn("Failed to initialize LiveKit RoomServiceClient", { error: err?.message });
    return null;
  }
};

let cachedWebhookReceiver = null;
export const getWebhookReceiver = () => {
  if (cachedWebhookReceiver) return cachedWebhookReceiver;
  const config = getLiveKitConfig();
  if (!config.apiKey || !config.apiSecret) return null;
  try {
    cachedWebhookReceiver = new WebhookReceiver(config.apiKey, config.apiSecret);
    return cachedWebhookReceiver;
  } catch (err) {
    logger.warn("Failed to initialize LiveKit WebhookReceiver", { error: err?.message });
    return null;
  }
};

export const generateLiveKitToken = async ({
  sessionId,
  user,
  role = "participant",
  roomName,
}) => {
  const config = getLiveKitConfig();
  const actualRoomName = roomName || generateRoomName(sessionId);
  const isHost = role === "host" || role === "moderator" || role === "admin";
  const userId = String(user._id || user.id || "guest");
  const name = user.fullName || user.name || "Learner";

  const at = new AccessToken(config.apiKey, config.apiSecret, {
    identity: userId,
    name,
    ttl: "4h",
    metadata: JSON.stringify({
      userId,
      name,
      role: isHost ? "host" : "participant",
      avatar: user.avatar || null,
      sessionId: String(sessionId),
    }),
  });

  at.addGrant({
    room: actualRoomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost,
    roomRecord: isHost,
  });

  const token = await at.toJwt();

  return {
    token,
    url: config.url,
    roomName: actualRoomName,
    identity: userId,
    name,
    role: isHost ? "host" : "participant",
  };
};

export const muteParticipantTrack = async ({ roomName, identity, trackSid, muted = true }) => {
  const client = getRoomServiceClient();
  if (!client) {
    throw new Error("LiveKit RoomServiceClient not initialized");
  }
  return client.mutePublishedTrack(roomName, identity, trackSid, muted);
};

export const removeParticipantFromRoom = async ({ roomName, identity }) => {
  const client = getRoomServiceClient();
  if (!client) {
    throw new Error("LiveKit RoomServiceClient not initialized");
  }
  return client.removeParticipant(roomName, identity);
};

export const listRoomParticipants = async (roomName) => {
  const client = getRoomServiceClient();
  if (!client) return [];
  try {
    return await client.listParticipants(roomName);
  } catch (err) {
    logger.warn("Failed to list participants from LiveKit server", { roomName, error: err?.message });
    return [];
  }
};

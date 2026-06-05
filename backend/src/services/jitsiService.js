import crypto from "crypto";
import { getJitsiConfig } from "../config/jitsi.js";

const ROOM_PREFIX = "ethiotech";

export const generateRoomName = (sessionId) => {
  return `${ROOM_PREFIX}-${String(sessionId)}`;
};

export const generateJwtToken = (roomName, user, role = "participant") => {
  const config = getJitsiConfig();
  if (!config.sharedSecret) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: config.appId || "ethiotech",
    sub: config.domain,
    aud: config.domain,
    room: roomName,
    exp: now + 7200,
    iat: now,
    context: {
      user: {
        id: user._id || user.id,
        name: user.fullName || user.name || "User",
        email: user.email,
        avatar: user.avatar,
      },
    },
    room_id: roomName,
  };

  if (role === "moderator") {
    payload.moderator = true;
  }

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", config.sharedSecret).update(`${header}.${body}`).digest("base64url");

  return `${header}.${body}.${signature}`;
};

export const getJitsiDomain = () => {
  return getJitsiConfig().domain;
};

export const getPublicJitsiConfig = () => {
  const config = getJitsiConfig();
  return {
    domain: config.domain,
    appId: config.appId,
    enabled: Boolean(config.domain),
  };
};

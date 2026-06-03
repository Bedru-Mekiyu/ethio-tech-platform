import crypto from "crypto";
import { getAgoraConfig } from "../config/agora.js";

const TOKEN_EXPIRY_SECONDS = 3600;

function hmacSign(message, key) {
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(message);
  return hmac.digest("base64");
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildTokenBuffer({ version, role, expiry, signature, appCertificate }) {
  const buffer = Buffer.alloc(4096);
  let offset = 0;

  buffer.writeUInt8(version, offset); offset += 1;
  buffer.writeUInt8(role, offset); offset += 1;
  buffer.writeUInt32BE(expiry, offset); offset += 4;

  const sigBuffer = Buffer.from(signature, "base64");
  buffer.writeUInt16BE(sigBuffer.length, offset); offset += 2;
  sigBuffer.copy(buffer, offset); offset += sigBuffer.length;

  const certCrc = crc32(Buffer.from(appCertificate, "utf-8"));
  buffer.writeUInt32BE(certCrc, offset); offset += 4;

  return buffer.subarray(0, offset);
}

function encodeFields(fields) {
  const buffer = Buffer.alloc(512);
  let offset = 0;

  const fieldLengths = fields.map((f) => Buffer.byteLength(f, "utf-8"));

  for (const len of fieldLengths) {
    buffer.writeUInt16BE(len, offset); offset += 2;
  }

  for (const f of fields) {
    buffer.write(f, offset, "utf-8");
    offset += Buffer.byteLength(f, "utf-8");
  }

  return buffer.subarray(0, offset).toString();
}

export function generateRtcToken(channelName, uid, role = "publisher", expirySeconds = TOKEN_EXPIRY_SECONDS) {
  const { appId, appCertificate, enabled } = getAgoraConfig();
  if (!enabled) return null;

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + expirySeconds;
  const roleInt = role === "publisher" ? 1 : 2;

  const fields = [appId, channelName, String(uid), String(now), String(expiry)];
  const messageForSignature = encodeFields(fields);
  const signature = hmacSign(messageForSignature, appCertificate);

  const tokenBuffer = buildTokenBuffer({ version: 1, role: roleInt, expiry, signature, appCertificate });
  return tokenBuffer.toString("base64");
}

export function generateRtmToken(userId, expirySeconds = TOKEN_EXPIRY_SECONDS) {
  const { appId, appCertificate, enabled } = getAgoraConfig();
  if (!enabled) return null;

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + expirySeconds;

  const fields = [appId, userId, String(now), String(expiry)];
  const messageForSignature = encodeFields(fields);
  const signature = hmacSign(messageForSignature, appCertificate);

  const tokenBuffer = buildTokenBuffer({ version: 1, role: 1, expiry, signature, appCertificate });
  return tokenBuffer.toString("base64");
}

export function buildChannelName(sessionId) {
  return `ethio-${String(sessionId)}`;
}

export function getAgoraConfigSafe() {
  const config = getAgoraConfig();
  return { appId: config.appId, enabled: config.enabled };
}

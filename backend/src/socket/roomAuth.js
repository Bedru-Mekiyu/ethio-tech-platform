import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import PeerGroup from "../models/PeerGroup.js";
import mongoose from "mongoose";

const PUBLIC_ROOM_PREFIXES = ["lobby-", "public-"];

export const parseRoomId = (roomId) => {
  if (roomId.startsWith("classroom-")) {
    return { type: "classroom", resourceId: roomId.slice("classroom-".length) };
  }
  if (roomId.startsWith("session-")) {
    return { type: "session", resourceId: roomId.slice("session-".length) };
  }
  if (roomId.startsWith("squad-")) {
    return { type: "squad", resourceId: roomId.slice("squad-".length) };
  }
  if (roomId.startsWith("peer-")) {
    return { type: "peer", resourceId: roomId.slice("peer-".length) };
  }
  return { type: "generic", resourceId: roomId };
};

export const canUserJoinRoom = async (roomId, user) => {
  if (!user?.id) return { allowed: false };

  if (PUBLIC_ROOM_PREFIXES.some((prefix) => roomId.startsWith(prefix))) {
    return { allowed: true };
  }

  const { type, resourceId } = parseRoomId(roomId);

  if (type === "generic") {
    return { allowed: user.role === "admin" };
  }

  if (type === "classroom" || type === "session") {
    const sessionId = type === "session" ? resourceId : resourceId;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) return { allowed: false };
    const session = await Session.findById(sessionId).select("mentor status");
    if (!session) return { allowed: false };
    if (["ended", "canceled"].includes(session.status) && user.role !== "admin") {
      return { allowed: false };
    }
    const isMentor = String(session.mentor) === String(user.id);
    if (isMentor) return { allowed: true, role: "host" };
    if (user.role === "admin") return { allowed: true, role: "host" };
    const participant = await SessionParticipant.findOne({
      session: sessionId,
      user: user.id,
      status: { $in: ["registered", "joined", "active", "completed"] },
    }).select("role");
    if (!participant) return { allowed: false };
    return { allowed: true, role: participant.role };
  }

  if (type === "squad" || type === "peer") {
    if (!mongoose.Types.ObjectId.isValid(resourceId)) return { allowed: false };
    const group = await PeerGroup.findById(resourceId).select("members leader isActive");
    if (!group || !group.isActive) return { allowed: false };
    const memberIds = [...group.members.map(String), String(group.leader)].filter(Boolean);
    return { allowed: memberIds.includes(String(user.id)) || user.role === "admin" };
  }

  return { allowed: false };
};

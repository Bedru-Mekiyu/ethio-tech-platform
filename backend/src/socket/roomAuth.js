import Session from "../models/Session.js";
import PeerGroup from "../models/PeerGroup.js";

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
  if (!user?.id) return false;

  if (PUBLIC_ROOM_PREFIXES.some((prefix) => roomId.startsWith(prefix))) {
    return true;
  }

  const { type, resourceId } = parseRoomId(roomId);

  if (type === "generic") {
    return user.role === "admin";
  }

  if (type === "classroom" || type === "session") {
    const sessionId = type === "session" ? resourceId : resourceId;
    const session = await Session.findById(sessionId).select("mentor participants status");
    if (!session) return false;
    if (["ended", "canceled"].includes(session.status) && user.role !== "admin") {
      return false;
    }
    const isMentor = String(session.mentor) === String(user.id);
    const isParticipant = session.participants.map(String).includes(String(user.id));
    return isMentor || isParticipant || user.role === "admin";
  }

  if (type === "squad" || type === "peer") {
    const group = await PeerGroup.findById(resourceId).select("members leader isActive");
    if (!group || !group.isActive) return false;
    const memberIds = [...group.members.map(String), String(group.leader)].filter(Boolean);
    return memberIds.includes(String(user.id)) || user.role === "admin";
  }

  return false;
};

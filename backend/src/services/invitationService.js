import Invitation from "../models/Invitation.js";
import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import SessionAuditLog from "../models/SessionAuditLog.js";
import { notifyUser } from "./notificationService.js";

export const createInvitation = async ({ sessionId, inviterId, inviteeId, method, message, ip }) => {
  const session = await Session.findById(sessionId).select("title mentor");
  if (!session) throw new Error("Session not found");

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    session: sessionId,
    inviter: inviterId,
    invitee: inviteeId,
    method,
    message,
    expiresAt,
    status: "pending",
  });

  await SessionAuditLog.create({
    session: sessionId,
    action: "updated",
    actor: inviterId,
    targetUser: inviteeId,
    metadata: { source: "invitation", method },
    ip,
  });

  await notifyUser({
    recipientId: inviteeId,
    type: "session",
    message: `You've been invited to: ${session.title}`,
    link: `/sessions/${sessionId}`,
  });

  return invitation;
};

export const acceptInvitation = async ({ invitationId, userId, ip }) => {
  const invitation = await Invitation.findById(invitationId).populate("session", "title mentor");
  if (!invitation) throw new Error("Invitation not found");
  if (String(invitation.invitee) !== String(userId)) throw new Error("This invitation is not for you");
  if (invitation.status !== "pending") throw new Error("Invitation is no longer valid");

  invitation.status = "accepted";
  await invitation.save();

  await SessionParticipant.findOneAndUpdate(
    { session: invitation.session._id, user: userId },
    {
      session: invitation.session._id,
      user: userId,
      status: "registered",
      role: "participant",
      invitedBy: invitation.inviter,
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  await Session.findByIdAndUpdate(invitation.session._id, { $addToSet: { participants: userId } });

  await SessionAuditLog.create({
    session: invitation.session._id,
    action: "user_joined",
    actor: userId,
    targetUser: userId,
    metadata: { source: "invitation" },
    ip,
  });

  return invitation;
};

export const declineInvitation = async ({ invitationId, userId }) => {
  const invitation = await Invitation.findById(invitationId);
  if (!invitation) throw new Error("Invitation not found");
  if (String(invitation.invitee) !== String(userId)) throw new Error("This invitation is not for you");

  invitation.status = "declined";
  await invitation.save();

  return invitation;
};

export const getInvitationsForUser = async (userId) => {
  return Invitation.find({ invitee: userId, status: "pending" })
    .populate("session", "title scheduledAt mentor")
    .populate("inviter", "fullName avatar")
    .sort({ createdAt: -1 });
};

import Conversation from "../models/Conversation.js";

export const getOrCreateDirect = async (userId1, userId2) => {
  const existing = await Conversation.findOne({
    type: "direct",
    participants: { $all: [userId1, userId2], $size: 2 },
  });

  if (existing) return existing;

  return Conversation.create({
    type: "direct",
    participants: [userId1, userId2],
  });
};

export const createGroup = async (participantIds, name, _createdBy) => {
  const uniqueIds = [...new Set(participantIds)];
  if (uniqueIds.length < 2) throw new Error("At least 2 participants required");

  return Conversation.create({
    type: "group",
    participants: uniqueIds,
    name: name || "Group Chat",
  });
};

export const getConversations = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const conversations = await Conversation.find({
    participants: userId,
    isArchived: { $ne: userId },
  })
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("participants", "fullName avatar role");

  const total = await Conversation.countDocuments({
    participants: userId,
    isArchived: { $ne: userId },
  });

  return { conversations, total, page, limit };
};

export const getConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId).populate("participants", "fullName avatar role");

  if (!conversation) return null;
  if (!conversation.participants.some((p) => String(p._id) === String(userId))) {
    return null;
  }

  return conversation;
};

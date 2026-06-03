import DMMessage from "../models/DMMessage.js";
import Conversation from "../models/Conversation.js";

export const sendMessage = async ({ conversationId, senderId, text, replyTo, attachments }) => {
  const message = await DMMessage.create({
    conversationId,
    senderId,
    text,
    type: attachments?.length ? "file" : "text",
    replyTo,
    attachments,
    readBy: [{ userId: senderId }],
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessageAt: new Date(),
    lastMessagePreview: text?.slice(0, 100) || "Attachment",
  });

  return DMMessage.findById(message._id)
    .populate("senderId", "fullName avatar")
    .populate("replyTo");
};

export const getMessages = async (conversationId, userId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const messages = await DMMessage.find({
    conversationId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("senderId", "fullName avatar")
    .populate("replyTo");

  return messages.reverse();
};

export const markRead = async (conversationId, userId) => {
  await DMMessage.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      "readBy.userId": { $ne: userId },
    },
    {
      $push: { readBy: { userId, readAt: new Date() } },
    }
  );
};

export const editMessage = async (messageId, userId, newText) => {
  const message = await DMMessage.findById(messageId);
  if (!message) throw new Error("Message not found");
  if (String(message.senderId) !== String(userId)) throw new Error("Can only edit own messages");

  const editWindow = 15 * 60 * 1000;
  if (Date.now() - message.createdAt.getTime() > editWindow) {
    throw new Error("Edit window expired (15 minutes)");
  }

  message.text = newText;
  await message.save();
  return message;
};

export const deleteMessage = async (messageId, userId) => {
  const message = await DMMessage.findById(messageId);
  if (!message) throw new Error("Message not found");
  if (String(message.senderId) !== String(userId)) throw new Error("Can only delete own messages");

  message.isDeleted = true;
  message.deletedAt = new Date();
  await message.save();
  return { deleted: true };
};

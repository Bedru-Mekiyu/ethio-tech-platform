import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ChatMessage from "../models/ChatMessage.js";
import { canUserJoinRoom } from "../socket/roomAuth.js";
import ApiError from "../utils/ApiError.js";

export const getRoomMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const allowed = await canUserJoinRoom(roomId, { id: String(req.user._id), role: req.user.role });
  if (!allowed) throw new ApiError(403, "Cannot access this room");

  const limit = Math.min(Math.max(Number.parseInt(req.query.limit || "50", 10) || 50, 1), 100);
  const before = req.query.before ? new Date(String(req.query.before)) : null;
  const filter = { roomId };

  if (before && !Number.isNaN(before.getTime())) {
    filter.createdAt = { $lt: before };
  }

  const messages = await ChatMessage.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "fullName")
    .lean();

  const formatted = messages.reverse().map((message) => ({
    messageId: message.messageId,
    text: message.text,
    at: message.createdAt?.toISOString?.() ?? new Date().toISOString(),
    userId: message.userId?._id ? String(message.userId._id) : message.userId ? String(message.userId) : undefined,
    author: message.userId?.fullName ?? "Participant",
  }));

  sendResponse(res, 200, "Chat history fetched", {
    messages: formatted,
    pagination: {
      limit,
      before: before && !Number.isNaN(before.getTime()) ? before.toISOString() : null,
      hasMore: messages.length === limit,
    },
  });
});

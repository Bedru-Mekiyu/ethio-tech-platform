import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ChatMessage from "../models/ChatMessage.js";
import { canUserJoinRoom } from "../socket/roomAuth.js";
import ApiError from "../utils/ApiError.js";

export const getRoomMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const allowed = await canUserJoinRoom(roomId, { id: String(req.user._id), role: req.user.role });
  if (!allowed) throw new ApiError(403, "Cannot access this room");

  const messages = await ChatMessage.find({ roomId }).sort({ createdAt: 1 }).limit(100);
  sendResponse(res, 200, "Chat history fetched", { messages });
});

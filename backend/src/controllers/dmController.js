import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getOrCreateDirect, createGroup, getConversations, getConversation } from "../services/conversationService.js";
import { sendMessage, getMessages, markRead } from "../services/dmMessageService.js";

export const listConversations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const result = await getConversations(req.user._id, page, limit);
  sendResponse(res, 200, "Conversations", result);
});

export const createConversation = asyncHandler(async (req, res) => {
  const { participantId, participantIds, name } = req.body;

  let conversation;
  if (participantId) {
    conversation = await getOrCreateDirect(req.user._id, participantId);
  } else if (participantIds?.length) {
    conversation = await createGroup([req.user._id, ...participantIds], name, req.user._id);
  } else {
    throw new ApiError(400, "participantId or participantIds required");
  }

  sendResponse(res, 201, "Conversation created", { conversation });
});

export const getConversationMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  const conversation = await getConversation(conversationId, req.user._id);
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const messages = await getMessages(conversationId, req.user._id, page, limit);
  sendResponse(res, 200, "Messages", { messages });
});

export const sendConversationMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { text, replyTo, attachments } = req.body;

  if (!text && !attachments?.length) {
    throw new ApiError(400, "Message text or attachments required");
  }

  const conversation = await getConversation(conversationId, req.user._id);
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const message = await sendMessage({
    conversationId,
    senderId: req.user._id,
    text,
    replyTo,
    attachments,
  });

  sendResponse(res, 201, "Message sent", { message });
});

export const markConversationRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  await markRead(conversationId, req.user._id);
  sendResponse(res, 200, "Messages marked as read");
});

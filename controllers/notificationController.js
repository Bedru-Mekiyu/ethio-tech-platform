import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";

export const createNotification = asyncHandler(async (req, res) => {
  const { recipient, type, message, link } = req.body;
  if (!recipient || !type || !message) {
    throw new ApiError(400, "recipient, type, message are required");
  }

  const notification = await Notification.create({
    recipient,
    type,
    message,
    link,
    createdBy: req.user._id,
  });

  sendResponse(res, 201, "Notification created", { notification });
});

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);
  sendResponse(res, 200, "Notifications fetched", { notifications });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw new ApiError(404, "Notification not found");
  notification.isRead = true;
  await notification.save();
  sendResponse(res, 200, "Notification marked as read", { notification });
});

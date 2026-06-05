import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getPagination } from "../utils/pagination.js";
import { emitNotification } from "../services/notificationHelper.js";

export const createNotification = asyncHandler(async (req, res) => {
  const { recipient, type, message, link } = req.body;
  if (!recipient || !type || !message) {
    throw new ApiError(400, "recipient, type, message are required");
  }

  const notification = await emitNotification({
    recipientId: recipient,
    type,
    message,
    link,
    createdBy: req.user._id,
  });

  sendResponse(res, 201, "Notification created", { notification });
});

export const getMyNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { recipient: req.user._id };

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  sendResponse(res, 200, "Notifications fetched", {
    notifications,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  sendResponse(res, 200, "Unread count fetched", { count });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw new ApiError(404, "Notification not found");
  notification.isRead = true;
  await notification.save();
  sendResponse(res, 200, "Notification marked as read", { notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { $set: { isRead: true } });
  sendResponse(res, 200, "All notifications marked as read");
});

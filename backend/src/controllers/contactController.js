import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    throw new ApiError(400, "name, email, and message are required");
  }

  const admins = await User.find({ role: "admin" }).select("_id").limit(5);
  if (admins.length) {
    await Notification.insertMany(
      admins.map((admin) => ({
        recipient: admin._id,
        type: "system",
        message: `Contact from ${name} (${email}): ${message.slice(0, 120)}`,
        link: "/admin",
      }))
    );
  }

  sendResponse(res, 201, "Message received", { received: true });
});

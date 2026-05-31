import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sanitizePlainText } from "../utils/sanitize.js";

export const submitContact = asyncHandler(async (req, res) => {
  const name = sanitizePlainText(req.body.name, 120);
  const email = sanitizePlainText(req.body.email, 200).toLowerCase();
  const message = sanitizePlainText(req.body.message, 2000);

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

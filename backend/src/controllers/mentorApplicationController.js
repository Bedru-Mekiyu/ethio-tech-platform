import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import MentorApplication from "../models/MentorApplication.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const submitMentorApplication = asyncHandler(async (req, res) => {
  const payload = req.body;
  const normalizedEmail = payload.email.toLowerCase();

  const existing = await MentorApplication.findOne({
    email: normalizedEmail,
    status: { $in: ["pending", "in-review", "approved"] },
  }).select("_id status");

  if (existing) {
    throw new ApiError(409, "A mentor application is already active for this email");
  }

  const application = await MentorApplication.create({
    ...payload,
    email: normalizedEmail,
  });

  const admins = await User.find({ role: "admin" }).select("_id").limit(5);
  if (admins.length) {
    await Notification.insertMany(
      admins.map((admin) => ({
        recipient: admin._id,
        type: "system",
        message: `Mentor application submitted by ${payload.fullName} (${payload.currentCompany || payload.currentRole})`,
        link: "/admin/moderation",
      }))
    );
  }

  sendResponse(res, 201, "Mentor application submitted", {
    application: {
      _id: application._id,
      status: application.status,
    },
  });
});

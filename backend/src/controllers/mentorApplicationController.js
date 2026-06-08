import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import MentorApplication from "../models/MentorApplication.js";
import User from "../models/User.js";
import { notifyUser } from "../services/notificationService.js";

export const submitMentorApplication = asyncHandler(async (req, res) => {
  const { email, fullName, whyMentor, consent, ...rest } = req.body;

  if (!consent) {
    throw new ApiError(400, "You must consent to the mentorship terms");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  const existingPending = await MentorApplication.findOne({
    email: email.toLowerCase(),
    status: "pending",
  });

  if (existingPending) {
    throw new ApiError(409, "You already have a pending application. Please wait for it to be reviewed.");
  }

  const lastRejected = await MentorApplication.findOne({
    email: email.toLowerCase(),
    status: "rejected",
  }).sort({ createdAt: -1 });

  if (lastRejected && existingUser?.mentorStatus === "rejected") {
    const cooldownDays = 7;
    const daysSinceRejection = Math.floor(
      (Date.now() - new Date(lastRejected.reviewedAt || lastRejected.createdAt).getTime()) / (24 * 60 * 60 * 1000),
    );
    if (daysSinceRejection < cooldownDays) {
      throw new ApiError(
        429,
        `You can reapply in ${cooldownDays - daysSinceRejection} days. Please review the feedback from your previous application.`,
      );
    }
  }

  const application = await MentorApplication.create({
    fullName,
    email: email.toLowerCase(),
    whyMentor,
    ...rest,
    previousApplicationId: lastRejected?._id,
  });

  if (existingUser && existingUser.mentorStatus === "rejected") {
    existingUser.mentorStatus = "pending";
    existingUser.status = "pending";
    await existingUser.save();
  }

  const admins = await User.find({ role: { $in: ["admin", "super_admin"] } }, { _id: 1 });

  for (const admin of admins) {
    await notifyUser({
      recipientId: admin._id,
      type: "mentor",
      message: `New mentor application from ${fullName} (${email})`,
      link: "/admin/moderation",
    }).catch(() => undefined);
  }

  if (existingUser) {
    await notifyUser({
      recipientId: existingUser._id,
      type: "mentor",
      message: "Your mentor application has been received. We'll review it and get back to you soon.",
      link: "/mentor-recruitment",
    }).catch(() => undefined);
  }

  sendResponse(res, 201, "Application submitted successfully. We'll review it and get back to you.", {
    application: {
      _id: application._id,
      status: application.status,
    },
  });
});

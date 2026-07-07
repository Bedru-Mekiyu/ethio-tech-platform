import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import MentorApplication from "../models/MentorApplication.js";
import User from "../models/User.js";
import {
  notifyUser,
  notifyMentorApplicationReceived,
} from "../services/notificationService.js";
import { APPLICATION_STATUS, MENTOR_STATUS } from "../config/permissions.js";
import { sendMentorApplicationReceivedEmail } from "../services/emailService.js";

export const submitMentorApplication = asyncHandler(async (req, res) => {
  const { email, fullName, whyMentor, consent, ...rest } = req.body;

  if (!consent) {
    throw new ApiError(400, "You must consent to the mentorship terms");
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  const existingPending = await MentorApplication.findOne({
    email: normalizedEmail,
    status: { $in: [APPLICATION_STATUS.PENDING_REVIEW, APPLICATION_STATUS.CHANGES_REQUESTED] },
  });

  if (existingPending) {
    throw new ApiError(409, "You already have a pending application. Please wait for it to be reviewed.");
  }

  const lastRejected = await MentorApplication.findOne({
    email: normalizedEmail,
    status: APPLICATION_STATUS.REJECTED,
  }).sort({ createdAt: -1 });

  if (lastRejected && existingUser?.mentorStatus === MENTOR_STATUS.REJECTED) {
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
    email: normalizedEmail,
    whyMentor,
    ...rest,
    previousApplicationId: lastRejected?._id,
    userId: existingUser?._id ?? req.user?._id,
  });

  if (existingUser && existingUser.mentorStatus === MENTOR_STATUS.REJECTED) {
    existingUser.mentorStatus = MENTOR_STATUS.PENDING;
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
    await notifyMentorApplicationReceived({ userId: existingUser._id });
  }

  await sendMentorApplicationReceivedEmail({ to: normalizedEmail, fullName }).catch(() => undefined);

  sendResponse(res, 201, "Application submitted successfully. We'll review it and get back to you.", {
    application: {
      _id: application._id,
      status: application.status,
    },
  });
});

export const resubmitMentorApplication = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  if (application.status !== APPLICATION_STATUS.CHANGES_REQUESTED) {
    throw new ApiError(400, "Only applications with requested changes can be resubmitted");
  }

  const { fullName, whyMentor, ...rest } = req.body;
  if (req.user && application.email !== req.user.email.toLowerCase()) {
    throw new ApiError(403, "You can only resubmit your own application");
  }

  application.fullName = fullName ?? application.fullName;
  application.whyMentor = whyMentor ?? application.whyMentor;
  Object.assign(application, rest);
  application.status = APPLICATION_STATUS.PENDING_REVIEW;
  application.reviewNotes = undefined;
  await application.save();

  const admins = await User.find({ role: { $in: ["admin", "super_admin"] } }, { _id: 1 });
  for (const admin of admins) {
    await notifyUser({
      recipientId: admin._id,
      type: "mentor",
      message: `${application.fullName} resubmitted their mentor application`,
      link: "/admin/moderation",
    }).catch(() => undefined);
  }

  sendResponse(res, 200, "Application resubmitted", { application: application.toObject() });
});

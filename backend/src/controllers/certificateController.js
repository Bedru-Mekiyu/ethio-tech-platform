import Certificate from "../models/Certificate.js";
import Track from "../models/Track.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { notifyUser } from "../services/notificationService.js";

export const issueCertificate = asyncHandler(async (req, res) => {
  const { student, track, certificateUrl } = req.body;
  if (!student || !track) {
    throw new ApiError(400, "student and track are required");
  }

  const [studentUser, trackDoc] = await Promise.all([User.findById(student), Track.findById(track)]);

  if (!studentUser) throw new ApiError(404, "Student not found");
  if (!trackDoc) throw new ApiError(404, "Track not found");

  const certificate = await Certificate.findOneAndUpdate(
    { student, track },
    { certificateUrl, verifiedBy: req.user._id },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  );

  await notifyUser({
    recipientId: student,
    type: "badge",
    message: `Certificate issued for track: ${trackDoc.title}`,
    link: "/app/certificates",
    createdBy: req.user._id,
  });

  sendResponse(res, 201, "Certificate issued", { certificate });
});

export const getCertificates = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "student") {
    filter.student = req.user._id;
  } else if (req.query.student) {
    filter.student = req.query.student;
  }
  if (req.query.track) filter.track = req.query.track;

  const certificates = await Certificate.find(filter)
    .sort({ createdAt: -1 })
    .populate("student", "fullName email")
    .populate("track", "title")
    .populate("verifiedBy", "fullName role");

  sendResponse(res, 200, "Certificates fetched", { certificates });
});

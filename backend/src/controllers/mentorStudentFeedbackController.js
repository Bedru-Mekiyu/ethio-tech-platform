import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import MentorStudentFeedback from "../models/MentorStudentFeedback.js";

export const submitStudentFeedback = asyncHandler(async (req, res) => {
  const { studentId, participationScore, communicationScore, professionalismScore, comment } = req.body;
  if (!studentId) throw new ApiError(400, "studentId is required");
  if (!participationScore || !communicationScore || !professionalismScore) {
    throw new ApiError(400, "All three scores are required");
  }
  const feedback = await MentorStudentFeedback.findOneAndUpdate(
    { session: req.params.sessionId, student: studentId },
    {
      session: req.params.sessionId,
      mentor: req.user._id,
      student: studentId,
      participationScore,
      communicationScore,
      professionalismScore,
      comment,
    },
    { upsert: true, new: true, runValidators: true }
  );
  sendResponse(res, 200, "Student feedback submitted", { feedback });
});

export const getStudentFeedback = asyncHandler(async (req, res) => {
  const feedback = await MentorStudentFeedback.findOne({
    session: req.params.sessionId,
    student: req.params.studentId,
  });
  sendResponse(res, 200, "Student feedback", { feedback });
});

export const getSessionStudentFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await MentorStudentFeedback.find({ session: req.params.sessionId })
    .populate("student", "fullName avatar")
    .sort({ createdAt: -1 });
  sendResponse(res, 200, "Session student feedback", { feedbacks });
});

export const getMyStudentFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await MentorStudentFeedback.find({ student: req.user._id })
    .populate("mentor", "fullName")
    .populate("session", "title")
    .sort({ createdAt: -1 });
  sendResponse(res, 200, "My feedback", { feedbacks });
});

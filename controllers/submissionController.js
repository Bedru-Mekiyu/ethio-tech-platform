import Submission from "../models/Submission.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { grantXPWithOptions } from "../services/xpService.js";

export const createSubmission = asyncHandler(async (req, res) => {
  const { project: projectId } = req.body;
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const submission = await Submission.create({
    ...req.body,
    student: req.user._id,
  });

  sendResponse(res, 201, "Submission created", { submission });
});

export const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate("project", "title xpReward");
  sendResponse(res, 200, "My submissions fetched", { submissions });
});

export const getSubmissions = asyncHandler(async (req, res) => {
  const { project, status } = req.query;
  const filter = {};
  if (project) filter.project = project;
  if (status) filter.status = status;

  const submissions = await Submission.find(filter)
    .sort({ createdAt: -1 })
    .populate("student", "fullName email")
    .populate("project", "title xpReward")
    .populate("reviewedBy", "fullName role");

  sendResponse(res, 200, "Submissions fetched", { submissions });
});

export const reviewSubmission = asyncHandler(async (req, res) => {
  const { status, feedback, grade } = req.body;
  if (!["reviewed", "approved", "rejected"].includes(status)) {
    throw new ApiError(400, "Invalid review status");
  }

  const submission = await Submission.findById(req.params.id).populate("project");
  if (!submission) throw new ApiError(404, "Submission not found");

  submission.status = status;
  submission.feedback = feedback ?? submission.feedback;
  submission.grade = grade ?? submission.grade;
  submission.reviewedBy = req.user._id;

  await submission.save();

  if (status === "approved") {
    await grantXPWithOptions({
      userId: submission.student,
      amount: submission.project?.xpReward || 0,
      reason: `Project approved: ${submission.project?.title || "Project"}`,
      sourceType: "project",
      sourceId: submission.project?._id,
      enforceUniqueSource: true,
      allowExisting: true,
    });
  }

  await Notification.create({
    recipient: submission.student,
    type: "project",
    message: `Your submission for ${submission.project?.title || "project"} was marked as ${status}.`,
    link: `/submissions/${submission._id}`,
    createdBy: req.user._id,
  });

  sendResponse(res, 200, "Submission reviewed", { submission });
});

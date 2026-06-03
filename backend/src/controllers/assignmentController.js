import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  getStudentAssignments,
  submitAssignment,
} from "../services/assignmentService.js";

export const createNewAssignment = asyncHandler(async (req, res) => {
  const { title, description, instructions, track, module, lesson, dueDate, maxScore, rubric, xpReward, allowLateSubmission, latePenaltyPercent, assignedTo, assignToAll } = req.body;
  if (!title) throw new ApiError(400, "Title is required");

  const assignment = await createAssignment({
    title, description, instructions, track, module, lesson,
    mentor: req.user._id, dueDate, maxScore, rubric, xpReward,
    allowLateSubmission, latePenaltyPercent, assignedTo, assignToAll,
    status: "published",
  });

  sendResponse(res, 201, "Assignment created", { assignment });
});

export const listAssignments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { track, status } = req.query;

  const filters = {};
  if (track) filters.track = track;
  if (status) filters.status = status;
  else filters.status = "published";

  if (req.user.role === "student") {
    const result = await getStudentAssignments(req.user._id, page, limit);
    return sendResponse(res, 200, "Assignments", result);
  }

  filters.mentor = req.user._id;
  const result = await getAssignments(filters, page, limit);
  sendResponse(res, 200, "Assignments", result);
});

export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await getAssignmentById(req.params.id);
  if (!assignment) throw new ApiError(404, "Assignment not found");
  sendResponse(res, 200, "Assignment", { assignment });
});

export const updateAssignmentDetails = asyncHandler(async (req, res) => {
  const assignment = await updateAssignment(req.params.id, req.body);
  if (!assignment) throw new ApiError(404, "Assignment not found");
  sendResponse(res, 200, "Assignment updated", { assignment });
});

export const submitStudentWork = asyncHandler(async (req, res) => {
  const { githubLink, deployedUrl, files, text } = req.body;
  const submission = await submitAssignment({
    assignmentId: req.params.id,
    studentId: req.user._id,
    githubLink, deployedUrl, files, text,
  });
  sendResponse(res, 201, "Submission received", { submission });
});

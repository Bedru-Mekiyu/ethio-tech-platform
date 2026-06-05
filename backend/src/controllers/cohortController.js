import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import {
  createCohort,
  getCohorts,
  getCohort,
  updateCohort,
  addStudentToCohort,
  removeStudentFromCohort,
  getCohortAnalytics,
  bulkUpdateProgress,
} from "../services/cohortService.js";
import { notifyUser } from "../services/notificationService.js";

export const createNewCohort = asyncHandler(async (req, res) => {
  const { name, description, track, startDate, endDate, maxStudents, tags } = req.body;
  if (!name) throw new ApiError(400, "Cohort name is required");

  const cohort = await createCohort({
    name,
    description,
    mentor: req.user._id,
    track,
    startDate,
    endDate,
    maxStudents,
    tags,
  });

  sendResponse(res, 201, "Cohort created", { cohort });
});

export const listCohorts = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const cohorts = await getCohorts(req.user._id, status);
  sendResponse(res, 200, "Cohorts", { cohorts });
});

export const getCohortDetails = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const cohort = await getCohort(cohortId);
  if (!cohort) throw new ApiError(404, "Cohort not found");
  sendResponse(res, 200, "Cohort", { cohort });
});

export const updateCohortDetails = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const cohort = await updateCohort(cohortId, req.body);
  if (!cohort) throw new ApiError(404, "Cohort not found");
  sendResponse(res, 200, "Cohort updated", { cohort });
});

export const addStudent = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const { userId } = req.body;
  if (!userId) throw new ApiError(400, "userId is required");

  const cohort = await addStudentToCohort(cohortId, userId);

  await notifyUser({
    recipientId: userId,
    type: "system",
    message: `You have been added to cohort: ${cohort.name || "a cohort"}`,
    link: "/app/dashboard",
    createdBy: req.user._id,
  });

  sendResponse(res, 200, "Student added", { cohort });
});

export const removeStudent = asyncHandler(async (req, res) => {
  const { cohortId, userId } = req.params;
  await removeStudentFromCohort(cohortId, userId);

  await notifyUser({
    recipientId: userId,
    type: "system",
    message: "You have been removed from a cohort.",
    link: "/app/dashboard",
    createdBy: req.user._id,
  });

  sendResponse(res, 200, "Student removed");
});

export const getCohortAnalyticsData = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  const data = await getCohortAnalytics(cohortId);
  sendResponse(res, 200, "Cohort analytics", data);
});

export const refreshCohortProgress = asyncHandler(async (req, res) => {
  const { cohortId } = req.params;
  await bulkUpdateProgress(cohortId);
  sendResponse(res, 200, "Progress updated");
});

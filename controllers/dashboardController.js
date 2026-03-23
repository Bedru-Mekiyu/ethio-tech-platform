import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getMentorDashboardData, getStudentDashboardData } from "../services/dashboardService.js";

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const data = await getStudentDashboardData(req.user._id);
  sendResponse(res, 200, "Student dashboard fetched", data);
});

export const getMentorDashboard = asyncHandler(async (req, res) => {
  const data = await getMentorDashboardData(req.user._id);
  sendResponse(res, 200, "Mentor dashboard fetched", data);
});

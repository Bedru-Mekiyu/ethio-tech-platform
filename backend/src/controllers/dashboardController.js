import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getMentorDashboardData, getStudentDashboardData } from "../services/dashboardService.js";

import User from "../models/User.js";

export const getStudentDashboard = asyncHandler(async (req, res) => {
  let targetUserId = req.user._id;

  if (req.user.role === "parent") {
    const parent = await User.findById(req.user._id).select("linkedStudents");
    const linked = parent?.linkedStudents || [];
    if (req.query.studentId && linked.some((id) => id.toString() === String(req.query.studentId))) {
      targetUserId = req.query.studentId;
    } else if (linked.length > 0) {
      targetUserId = linked[0];
    }
  } else if ((req.user.role === "admin" || req.user.role === "super_admin") && req.query.studentId) {
    targetUserId = req.query.studentId;
  }

  const data = await getStudentDashboardData(targetUserId);
  sendResponse(res, 200, "Student dashboard fetched", data);
});

export const getMentorDashboard = asyncHandler(async (req, res) => {
  const data = await getMentorDashboardData(req.user._id);
  sendResponse(res, 200, "Mentor dashboard fetched", data);
});

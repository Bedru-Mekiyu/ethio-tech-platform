import Hub from "../models/Hub.js";
import HubAttendance from "../models/HubAttendance.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { grantXPWithOptions } from "../services/xpService.js";

export const createHub = asyncHandler(async (req, res) => {
  const hub = await Hub.create(req.body);
  sendResponse(res, 201, "Hub created", { hub });
});

export const getHubs = asyncHandler(async (req, res) => {
  const hubs = await Hub.find({ isActive: true }).populate("mentorInCharge", "fullName");
  sendResponse(res, 200, "Hubs fetched", { hubs });
});

export const updateHub = asyncHandler(async (req, res) => {
  const hub = await Hub.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!hub) throw new ApiError(404, "Hub not found");
  sendResponse(res, 200, "Hub updated", { hub });
});

export const markAttendance = asyncHandler(async (req, res) => {
  const { hubId, studentId, date } = req.body;
  if (!hubId || !studentId || !date) {
    throw new ApiError(400, "hubId, studentId and date are required");
  }

  const attendance = await HubAttendance.create({
    hub: hubId,
    student: studentId,
    date,
  });

  await grantXPWithOptions({
    userId: studentId,
    amount: attendance.xpAwarded,
    reason: "Physical hub attendance",
    sourceType: "hub",
    sourceId: attendance._id,
    enforceUniqueSource: true,
    allowExisting: true,
  });

  sendResponse(res, 201, "Attendance marked and XP awarded", { attendance });
});

export const getAttendance = asyncHandler(async (req, res) => {
  const { hubId, studentId } = req.query;
  const filter = {};
  if (hubId) filter.hub = hubId;
  if (studentId) filter.student = studentId;

  const attendance = await HubAttendance.find(filter)
    .sort({ date: -1 })
    .populate("hub", "city")
    .populate("student", "fullName");

  sendResponse(res, 200, "Attendance fetched", { attendance });
});

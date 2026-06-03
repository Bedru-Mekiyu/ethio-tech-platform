import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import {
  createBreakout,
  assignToBreakout,
  bulkAssign,
  closeBreakout,
  closeAllBreakouts,
  getActiveBreakouts,
  getBreakoutParticipants,
  startBreakoutTimer,
} from "../services/breakoutService.js";

export const createBreakoutRoom = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { name, maxParticipants, timerSeconds } = req.body;

  if (!name) throw new ApiError(400, "Breakout room name is required");

  const parentRoomId = `session-${sessionId}`;
  const breakout = await createBreakout({
    sessionId,
    parentRoomId,
    name,
    maxParticipants,
    timerSeconds,
    createdBy: req.user._id,
  });

  sendResponse(res, 201, "Breakout room created", { breakout });
});

export const assignParticipant = asyncHandler(async (req, res) => {
  const { breakoutId } = req.params;
  const { userId } = req.body;

  if (!userId) throw new ApiError(400, "userId is required");

  const result = await assignToBreakout({
    breakoutId,
    userId,
    movedBy: req.user._id,
  });

  sendResponse(res, 200, "Participant assigned", result);
});

export const bulkAssignParticipants = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { assignments } = req.body;

  if (!Array.isArray(assignments) || assignments.length === 0) {
    throw new ApiError(400, "assignments array is required");
  }

  const results = await bulkAssign({
    sessionId,
    assignments,
    movedBy: req.user._id,
  });

  sendResponse(res, 200, "Bulk assignment complete", { results });
});

export const closeBreakoutRoom = asyncHandler(async (req, res) => {
  const { breakoutId } = req.params;
  const breakout = await closeBreakout({ breakoutId, movedBy: req.user._id });
  sendResponse(res, 200, "Breakout room closed", { breakout });
});

export const closeAllBreakoutRooms = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const count = await closeAllBreakouts({ sessionId, movedBy: req.user._id });
  sendResponse(res, 200, `${count} breakout rooms closed`, { count });
});

export const getBreakouts = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const breakouts = await getActiveBreakouts(sessionId);
  sendResponse(res, 200, "Active breakout rooms", { breakouts });
});

export const getBreakoutParticipantsList = asyncHandler(async (req, res) => {
  const { breakoutId } = req.params;
  const participants = await getBreakoutParticipants(breakoutId);
  sendResponse(res, 200, "Breakout participants", { participants });
});

export const startTimer = asyncHandler(async (req, res) => {
  const { breakoutId } = req.params;
  const breakout = await startBreakoutTimer(breakoutId);
  sendResponse(res, 200, "Timer started", { breakout });
});

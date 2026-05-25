import User from "../models/User.js";
import PeerGroup from "../models/PeerGroup.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getCachedLeaderboard, setCachedLeaderboard } from "../utils/leaderboardCache.js";

export const getStudentLeaderboard = asyncHandler(async (req, res) => {
  const top = Number(req.query.top || 20);
  const cacheKey = `students:${top}`;
  const cached = getCachedLeaderboard(cacheKey);
  if (cached) {
    return sendResponse(res, 200, "Student leaderboard fetched", { students: cached, cached: true });
  }

  const students = await User.find({ role: "student" })
    .select("fullName avatar xp level")
    .sort({ xp: -1, level: -1, createdAt: 1 })
    .limit(top);

  setCachedLeaderboard(cacheKey, students);
  sendResponse(res, 200, "Student leaderboard fetched", { students });
});

export const getMentorLeaderboard = asyncHandler(async (req, res) => {
  const top = Number(req.query.top || 20);
  const mentors = await User.find({ role: "mentor" })
    .select("fullName mentorScore totalSessions")
    .sort({ mentorScore: -1, totalSessions: -1, createdAt: 1 })
    .limit(top);

  sendResponse(res, 200, "Mentor leaderboard fetched", { mentors });
});

export const getPeerGroupLeaderboard = asyncHandler(async (req, res) => {
  const top = Number(req.query.top || 20);
  const groups = await PeerGroup.find({ isActive: true })
    .select("name groupXP members leader")
    .sort({ groupXP: -1, createdAt: 1 })
    .limit(top)
    .populate("leader", "fullName");

  sendResponse(res, 200, "Peer group leaderboard fetched", { groups });
});

import { Router } from "express";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import { optionalProtect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get(
  "/",
  optionalProtect,
  asyncHandler(async (req, res) => {
    const mentors = await User.find({
      role: "mentor",
      status: "active",
    })
      .select("fullName avatar bio expertise rating mentorRating totalSessions currentCompany")
      .sort({ mentorRating: -1, totalSessions: -1 })
      .lean();

    const formattedMentors = mentors.map((m) => ({
      _id: m._id,
      fullName: m.fullName,
      avatar: m.avatar,
      bio: m.bio,
      expertise: m.expertise || [],
      rating: m.mentorRating || m.rating || 5.0,
      sessionCount: m.totalSessions || 0,
      studentCount: 0,
    }));

    sendResponse(res, 200, "Mentors retrieved successfully", { mentors: formattedMentors });
  })
);

export default router;

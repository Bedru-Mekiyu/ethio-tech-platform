import User from "../models/User.js";
import LessonProgress from "../models/LessonProgress.js";
import Submission from "../models/Submission.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";

export const getParentDashboard = asyncHandler(async (req, res) => {
  const parent = await User.findById(req.user._id).populate(
    "linkedStudents",
    "fullName email level xp gradeLevel enrolledTracks"
  );
  if (!parent) throw new ApiError(404, "Parent not found");

  const students = parent.linkedStudents ?? [];
  const studentIds = students.map((s) => s._id);

  const [lessonCounts, submissionCounts] = await Promise.all([
    LessonProgress.aggregate([
      { $match: { student: { $in: studentIds } } },
      { $group: { _id: "$student", completed: { $sum: 1 } } },
    ]),
    Submission.aggregate([
      { $match: { student: { $in: studentIds } } },
      { $group: { _id: "$student", total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } } } },
    ]),
  ]);

  const lessonMap = new Map(lessonCounts.map((row) => [String(row._id), row.completed]));
  const submissionMap = new Map(submissionCounts.map((row) => [String(row._id), row]));

  const learners = students.map((student) => {
    const sid = String(student._id);
    const subs = submissionMap.get(sid);
    return {
      id: student._id,
      fullName: student.fullName,
      email: student.email,
      level: student.level,
      xp: student.xp,
      gradeLevel: student.gradeLevel,
      lessonsCompleted: lessonMap.get(sid) ?? 0,
      submissions: subs?.total ?? 0,
      approvedProjects: subs?.approved ?? 0,
      enrolledTrackCount: student.enrolledTracks?.length ?? 0,
    };
  });

  sendResponse(res, 200, "Parent dashboard fetched", {
    parent: { id: parent._id, fullName: parent.fullName, email: parent.email },
    learners,
    hasLinkedStudents: learners.length > 0,
  });
});

import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Notification from "../models/Notification.js";

export const createAssignment = async (data) => {
  return Assignment.create(data);
};

export const getAssignments = async (filters = {}, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const query = Assignment.find(filters)
    .populate("track", "title")
    .populate("module", "title")
    .populate("mentor", "fullName avatar")
    .sort({ dueDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const [assignments, total] = await Promise.all([
    query.lean(),
    Assignment.countDocuments(filters),
  ]);

  return { assignments, total, page, limit };
};

export const getAssignmentById = async (assignmentId) => {
  return Assignment.findById(assignmentId)
    .populate("track", "title")
    .populate("module", "title")
    .populate("lesson", "title")
    .populate("mentor", "fullName avatar")
    .lean();
};

export const updateAssignment = async (assignmentId, updates) => {
  return Assignment.findByIdAndUpdate(assignmentId, updates, { new: true })
    .populate("track", "title")
    .populate("mentor", "fullName avatar");
};

export const getStudentAssignments = async (studentId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const assignments = await Assignment.find({
    status: "published",
    $or: [
      { assignToAll: true },
      { assignedTo: studentId },
    ],
  })
    .populate("track", "title")
    .populate("module", "title")
    .populate("mentor", "fullName avatar")
    .sort({ dueDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const submissionIds = assignments.map(a => a._id);
  const submissions = await Submission.find({
    student: studentId,
    assignment: { $in: submissionIds },
  }).lean();

  const submissionMap = new Map(submissions.map(s => [String(s.assignment), s]));

  const enriched = assignments.map(a => {
    const sub = submissionMap.get(String(a._id));
    const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
    return {
      ...a,
      submission: sub || null,
      submissionStatus: sub?.status || "not-submitted",
      isOverdue: isOverdue && !sub,
    };
  });

  return { assignments: enriched, total: enriched.length, page, limit };
};

export const submitAssignment = async ({ assignmentId, studentId, githubLink, deployedUrl, files, text }) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error("Assignment not found");
  if (assignment.status !== "published") throw new Error("Assignment is not open for submission");

  if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
    if (!assignment.allowLateSubmission) {
      throw new Error("Submission deadline has passed");
    }
  }

  const existing = await Submission.findOne({ assignment: assignmentId, student: studentId });
  if (existing) {
    existing.githubLink = githubLink || existing.githubLink;
    existing.deployedUrl = deployedUrl || existing.deployedUrl;
    existing.files = files || existing.files;
    existing.text = text || existing.text;
    existing.status = "pending";
    await existing.save();
    return existing;
  }

  const submission = await Submission.create({
    student: studentId,
    assignment: assignmentId,
    project: assignment.track,
    githubLink,
    deployedUrl,
    files,
    text,
    status: "pending",
  });

  if (assignment.mentor) {
    await Notification.create({
      recipient: assignment.mentor,
      type: "project",
      message: `New submission for "${assignment.title}"`,
      link: `/mentor/reviews`,
    });
  }

  return submission;
};

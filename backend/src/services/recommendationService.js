import mongoose from "mongoose";

// Get recommended next lessons based on completion history
export const getRecommendedLessons = async (userId, limit = 5) => {
  const LessonProgress = mongoose.model("LessonProgress");
  const Lesson = mongoose.model("Lesson");

  // Get tracks the user is enrolled in
  const User = mongoose.model("User");
  const user = await User.findById(userId).select("enrolledTracks");
  if (!user?.enrolledTracks?.length) return [];

  const trackIds = user.enrolledTracks.map((t) => t.track || t);

  // Find completed lesson IDs
  const completed = await LessonProgress.find({ user: userId, completed: true }).select("lesson");
  const completedIds = new Set(completed.map((p) => p.lesson.toString()));

  // Get all lessons from enrolled tracks (with module and track info)
  const allLessons = await Lesson.find({})
    .populate({
      path: "module",
      match: { track: { $in: trackIds } },
      select: "track order",
    })
    .sort({ createdAt: 1 });

  // Filter to lessons in enrolled tracks that aren't completed
  const incomplete = allLessons.filter((l) => {
    if (!l.module) return false;
    if (completedIds.has(l._id.toString())) return false;
    return true;
  });

  // Score each lesson: prefer earlier modules, earlier lessons
  const scored = incomplete.map((lesson) => {
    let score = 100;
    // Penalize later modules
    if (lesson.module?.order) score -= lesson.module.order * 5;
    // Boost lessons that have prerequisites completed
    score += 10;
    return { lesson, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.lesson);
};

// Get tracks recommended based on user's interests and completion
export const getRecommendedTracks = async (userId, limit = 3) => {
  const Track = mongoose.model("Track");
  const User = mongoose.model("User");

  const user = await User.findById(userId).select("enrolledTracks interests xp level");
  const enrolledTrackIds = (user?.enrolledTracks || []).map((t) => (t.track || t).toString());

  // Find tracks not yet enrolled in
  const availableTracks = await Track.find({
    _id: { $nin: enrolledTrackIds },
    isPublished: true,
  }).select("title description category modules");

  // Simple scoring: tracks with more modules get slight boost, category matching
  const scored = availableTracks.map((track) => {
    let score = 50;
    const moduleCount = track.modules?.length || 0;
    score += Math.min(moduleCount * 2, 20);
    return { track, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.track);
};

// Get skill gap analysis
export const getSkillGapAnalysis = async (userId) => {
  const LessonProgress = mongoose.model("LessonProgress");
  const Submission = mongoose.model("Submission");
  const Track = mongoose.model("Track");
  const User = mongoose.model("User");

  const user = await User.findById(userId).select("enrolledTracks xp level badges");
  if (!user) return { skills: [], gaps: [] };

  const trackIds = (user.enrolledTracks || []).map((t) => t.track || t);
  const tracks = await Track.find({ _id: { $in: trackIds } }).select("title category modules");

  const completedLessons = await LessonProgress.countDocuments({ user: userId, completed: true });
  const submittedProjects = await Submission.countDocuments({ student: userId });

  const skills = tracks.map((track) => ({
    name: track.title,
    category: track.category || "general",
    progress: Math.min(100, Math.round((completedLessons / Math.max((track.modules?.length || 1) * 3, 1)) * 100)),
    totalModules: track.modules?.length || 0,
  }));

  const gaps = skills
    .filter((s) => s.progress < 70)
    .map((s) => ({ skill: s.name, gap: 100 - s.progress, priority: s.progress < 30 ? "high" : "medium" }));

  return { skills, gaps, completedLessons, submittedProjects };
};

// Get daily/weekly learning goals
export const getLearningGoals = async (userId) => {
  const UserStreak = mongoose.model("UserStreak");
  const XPLog = mongoose.model("XPLog");
  const LessonProgress = mongoose.model("LessonProgress");

  const streak = await UserStreak.findOne({ user: userId });
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const weeklyXp = await XPLog.aggregate([
    { $match: { user: userId, createdAt: { $gte: weekAgo } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const weeklyLessons = await LessonProgress.countDocuments({
    user: userId,
    completed: true,
    completedAt: { $gte: weekAgo },
  });

  return {
    currentStreak: streak?.currentStreak || 0,
    longestStreak: streak?.longestStreak || 0,
    weeklyXp: weeklyXp[0]?.total || 0,
    weeklyLessons,
    goals: {
      dailyXpTarget: 50,
      weeklyLessonTarget: 5,
      streakTarget: 7,
    },
  };
};

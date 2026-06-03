import UserStreak from "../models/UserStreak.js";
import DailyChallenge from "../models/DailyChallenge.js";
import DailyChallengeCompletion from "../models/DailyChallengeCompletion.js";
import Badge from "../models/Badge.js";
import User from "../models/User.js";
import { notifyBadgeEarned } from "./notificationService.js";

const todayKey = () => new Date().toISOString().slice(0, 10);

const STREAK_MILESTONES = [
  { days: 7,  xp: 50,  label: "7-day streak" },
  { days: 14, xp: 120, label: "14-day streak" },
  { days: 30, xp: 300, label: "30-day streak" },
  { days: 60, xp: 750, label: "60-day streak" },
];

export const recordDailyActivity = async (userId) => {
  const key = todayKey();
  let streak = await UserStreak.findOne({ user: userId });
  if (!streak) {
    streak = await UserStreak.create({
      user: userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: key,
    });
    return { streak, milestoneReward: null };
  }
  if (streak.lastActiveDate === key) return { streak, milestoneReward: null };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (streak.lastActiveDate === yesterdayKey) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastActiveDate = key;
  await streak.save();

  // G1: Check for streak milestone rewards
  const milestone = STREAK_MILESTONES.find((m) => m.days === streak.currentStreak);
  let milestoneReward = null;
  if (milestone) {
    try {
      // Lazy import to avoid circular dependency
      const { grantXPWithOptions } = await import("./xpService.js");
      const result = await grantXPWithOptions({
        userId,
        amount: milestone.xp,
        reason: `Streak milestone: ${milestone.label}`,
        sourceType: "badge",
        sourceId: streak._id,
        enforceUniqueSource: false,
      });
      milestoneReward = { ...milestone, xpAwarded: result.log?.amount ?? milestone.xp };
    } catch {
      // XP grant failed silently — streak is still recorded
    }
  }

  return { streak, milestoneReward };
};

export const getTodayChallenge = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return DailyChallenge.findOne({ activeDate: { $gte: start, $lt: end }, isActive: true });
};

export const awardEligibleBadges = async (userId) => {
  const user = await User.findById(userId).populate("badges");
  if (!user) return [];

  const owned = new Set((user.badges ?? []).map((b) => String(b._id)));
  const eligible = await Badge.find({
    _id: { $nin: [...owned] },
    xpRequired: { $lte: user.xp },
  });

  if (!eligible.length) return [];

  user.badges.push(...eligible.map((b) => b._id));
  await user.save();

  await Promise.all(
    eligible.map((badge) =>
      notifyBadgeEarned({ userId, badgeName: badge.name }).catch(() => undefined)
    )
  );

  return eligible;
};

export const getChallengeCompletionForUser = async (userId, challengeId) => {
  if (!challengeId) return null;
  return DailyChallengeCompletion.findOne({ user: userId, challenge: challengeId });
};


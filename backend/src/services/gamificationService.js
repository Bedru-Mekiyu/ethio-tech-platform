import UserStreak from "../models/UserStreak.js";
import DailyChallenge from "../models/DailyChallenge.js";
import Badge from "../models/Badge.js";
import User from "../models/User.js";

const todayKey = () => new Date().toISOString().slice(0, 10);

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
    return streak;
  }
  if (streak.lastActiveDate === key) return streak;

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
  return streak;
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
  return eligible;
};

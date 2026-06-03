import mongoose from "mongoose";
import User from "../models/User.js";
import XPLog from "../models/XPLog.js";
import LevelConfig from "../models/LevelConfig.js";
import ApiError from "../utils/ApiError.js";
import { awardEligibleBadges, recordDailyActivity } from "./gamificationService.js";
import { notifyXpEarned } from "./notificationService.js";

export const calculateLevelForXp = async (xp) => {
  const levels = await LevelConfig.find({ xpRequired: { $lte: xp } }).sort({ level: -1 }).limit(1);
  if (!levels.length) {
    return 1;
  }
  return levels[0].level;
};

export const grantXP = async ({ userId, amount, reason, sourceType, sourceId }) => {
  return grantXPWithOptions({
    userId,
    amount,
    reason,
    sourceType,
    sourceId,
  });
};

export const grantXPWithOptions = async ({
  userId,
  amount,
  reason,
  sourceType,
  sourceId,
  enforceUniqueSource = false,
  allowExisting = false,
}) => {
  if (amount <= 0) {
    throw new ApiError(400, "XP amount must be positive");
  }

  if (enforceUniqueSource && (!sourceType || !sourceId)) {
    throw new ApiError(400, "sourceType and sourceId are required when enforceUniqueSource is true");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (enforceUniqueSource) {
      const existingLog = await XPLog.findOne({ user: userId, sourceType, sourceId }).session(session);
      if (existingLog) {
        if (allowExisting) {
          const existingUser = await User.findById(userId).session(session);
          await session.commitTransaction();
          return { user: existingUser, log: existingLog, skipped: true };
        }
        throw new ApiError(409, "XP for this source already granted");
      }
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.xp += amount;
    user.level = await calculateLevelForXp(user.xp);

    await user.save({ session });

    const [log] = await XPLog.create(
      [
        {
          user: user._id,
          amount,
          reason,
          sourceType,
          sourceId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    await recordDailyActivity(userId).catch(() => undefined);
    await awardEligibleBadges(userId).catch(() => undefined);
    await notifyXpEarned({
      userId,
      amount,
      reason: reason ?? "Activity completed",
    }).catch(() => undefined);
    return { user, log };
  } catch (error) {
    await session.abortTransaction();
    if (error?.code === 11000 && enforceUniqueSource && allowExisting) {
      const [existingUser, existingLog] = await Promise.all([
        User.findById(userId),
        XPLog.findOne({ user: userId, sourceType, sourceId }),
      ]);
      return { user: existingUser, log: existingLog, skipped: true };
    }
    throw error;
  } finally {
    session.endSession();
  }
};

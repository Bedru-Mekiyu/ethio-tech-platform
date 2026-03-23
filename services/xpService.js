import mongoose from "mongoose";
import User from "../models/User.js";
import XPLog from "../models/XPLog.js";
import LevelConfig from "../models/LevelConfig.js";
import ApiError from "../utils/ApiError.js";

export const calculateLevelForXp = async (xp) => {
  const levels = await LevelConfig.find({ xpRequired: { $lte: xp } }).sort({ level: -1 }).limit(1);
  if (!levels.length) {
    return 1;
  }
  return levels[0].level;
};

export const grantXP = async ({ userId, amount, reason, sourceType, sourceId }) => {
  if (amount <= 0) {
    throw new ApiError(400, "XP amount must be positive");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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
    return { user, log };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

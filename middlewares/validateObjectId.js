import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

export const validateObjectIdParam = (paramName) => (req, res, next) => {
  const value = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return next(new ApiError(400, `Invalid id for param: ${paramName}`));
  }
  next();
};

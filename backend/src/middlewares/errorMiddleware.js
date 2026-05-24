import ApiError from "../utils/ApiError.js";
import { logger } from "../lib/logger.js";

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error("Request failed", {
    statusCode,
    method: req.method,
    path: req.originalUrl,
    message,
    details: err.details || null,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || null,
  });
};

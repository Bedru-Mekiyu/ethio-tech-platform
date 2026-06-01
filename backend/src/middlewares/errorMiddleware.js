import ApiError from "../utils/ApiError.js";
import { logger } from "../lib/logger.js";
import multer from "multer";

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Avatar must be 4 MB or smaller" : "Invalid avatar upload";
    logger.warn("Multipart upload rejected", {
      method: req.method,
      path: req.originalUrl,
      code: err.code,
      message,
    });
    res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
      success: false,
      message,
      details: null,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const isProduction = req.app.get("env") === "production";

  logger.error("Request failed", {
    statusCode,
    method: req.method,
    path: req.originalUrl,
    message,
    details: err.details || null,
    stack: isProduction ? "(hidden)" : err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || null,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

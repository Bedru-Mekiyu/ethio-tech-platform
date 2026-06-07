import { fileTypeFromBuffer } from "file-type";
import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

const MAGIC_BYTES: Record<string, Uint8Array> = {
  "image/jpeg": new Uint8Array([0xff, 0xd8, 0xff]),
  "image/png": new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/webp": new Uint8Array([0x52, 0x49, 0x46, 0x46]),
};

function checkMagicBytes(buffer: Buffer, expectedMime: string): boolean {
  const magic = MAGIC_BYTES[expectedMime];
  if (!magic) return false;

  if (buffer.length < magic.length) return false;

  for (let i = 0; i < magic.length; i++) {
    if (buffer[i] !== magic[i]) return false;
  }
  return true;
}

interface MulterRequest extends Request {
  file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  };
  user?: { _id: { toString(): string } };
}

export const validateAvatarFile = async (req: MulterRequest, _res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new ApiError(400, "No file uploaded"));
  }

  const { buffer, mimetype, originalname } = req.file;

  if (!ALLOWED_MIME_TYPES.includes(mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
    return next(new ApiError(400, "Only JPG, PNG, and WEBP avatar uploads are supported"));
  }

  if (!checkMagicBytes(buffer, mimetype)) {
    const detected = await fileTypeFromBuffer(buffer);
    if (detected && !ALLOWED_MIME_TYPES.includes(detected.mime as (typeof ALLOWED_MIME_TYPES)[number])) {
      return next(new ApiError(400, "File type does not match content. Please upload a valid image."));
    }
    return next(new ApiError(400, "Invalid file format. File content does not match expected image type."));
  }

  const ext = originalname?.split(".").pop()?.toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return next(new ApiError(400, "File extension not allowed. Use .jpg, .jpeg, .png, or .webp"));
  }

  next();
};

export const avatarUploadRateLimit = (() => {
  const userUploads = new Map<string, number[]>();
  const WINDOW_MS = 60_000;
  const MAX_UPLOADS = 5;

  return (req: MulterRequest, _res: Response, next: NextFunction) => {
    const userId = req.user?._id?.toString();
    if (!userId) return next();

    const now = Date.now();
    const uploads = userUploads.get(userId) || [];
    const recentUploads = uploads.filter((t) => now - t < WINDOW_MS);

    if (recentUploads.length >= MAX_UPLOADS) {
      const oldest = recentUploads[0];
      const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000);
      return next(new ApiError(429, `Too many avatar uploads. Please wait ${retryAfter} seconds.`));
    }

    recentUploads.push(now);
    userUploads.set(userId, recentUploads);

    setTimeout(() => {
      const current = userUploads.get(userId) || [];
      const filtered = current.filter((t) => Date.now() - t < WINDOW_MS);
      if (filtered.length === 0) {
        userUploads.delete(userId);
      } else {
        userUploads.set(userId, filtered);
      }
    }, WINDOW_MS);

    next();
  };
})();

import { Router } from "express";
import {
  enrollTrack,
  getAvatarLibrary,
  getMe,
  getUserById,
  getUsers,
  removeMyAvatar,
  selectSystemAvatar,
  updateMyProfile,
  uploadMyAvatar,
  getAvatarUploadSignature,
} from "../controllers/userController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { avatarSchemas, userSchemas } from "../validators/schemas.js";
import ApiError from "../utils/ApiError.js";
import multer from "multer";
import { validateAvatarFile, avatarUploadRateLimit } from "../middlewares/avatarValidation.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(new ApiError(400, "Only JPG, PNG, and WEBP avatar uploads are supported"));
      return;
    }
    cb(null, true);
  },
});

router.use(protect);
router.get("/", authorize("admin"), getUsers);
router.get("/me", getMe);
router.get("/me/avatars", getAvatarLibrary);
router.get("/me/avatar/sign", getAvatarUploadSignature);
router.patch("/me", validateRequest({ body: userSchemas.updateProfile }), updateMyProfile);
router.post("/me/avatar", avatarUploadRateLimit, upload.single("avatar"), validateAvatarFile, uploadMyAvatar);
router.patch(
  "/me/avatar/default/:avatarId",
  validateRequest({ params: avatarSchemas.avatarIdParam }),
  selectSystemAvatar,
);
router.delete("/me/avatar", removeMyAvatar);
router.post("/me/enroll/:trackId", authorize("student"), enrollTrack);
router.get("/:id", authorize("admin", "mentor"), getUserById);

export default router;

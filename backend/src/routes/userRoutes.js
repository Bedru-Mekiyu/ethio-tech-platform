import { Router } from "express";
import {
  enrollTrack,
  getMe,
  getUserById,
  getUsers,
  updateMyProfile,
  updateAvatar,
  getAvatarUploadSignature,
} from "../controllers/userController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { userSchemas } from "../validators/schemas.js";
import multer from "multer";

const router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.use(protect);
router.get("/", authorize("admin"), getUsers);
router.get("/me", getMe);
router.get("/me/avatar/sign", getAvatarUploadSignature);
router.patch("/me", validateRequest({ body: userSchemas.updateProfile }), updateMyProfile);
router.post("/me/avatar", upload.single("avatar"), updateAvatar);
router.post("/me/enroll/:trackId", authorize("student"), enrollTrack);
router.get("/:id", authorize("admin", "mentor"), getUserById);

export default router;

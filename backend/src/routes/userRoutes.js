import { Router } from "express";
import { enrollTrack, getUserById, getUsers, updateMyProfile } from "../controllers/userController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", authorize("admin"), getUsers);
router.get("/:id", authorize("admin", "mentor"), getUserById);
router.patch("/me", updateMyProfile);
// Avatar upload via multipart/form-data
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
router.post("/me/avatar", upload.single("avatar"), updateAvatar);
router.post("/me/enroll/:trackId", authorize("student"), enrollTrack);

export default router;

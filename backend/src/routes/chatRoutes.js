import { Router } from "express";
import { getRoomMessages } from "../controllers/chatController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/rooms/:roomId/messages", protect, getRoomMessages);

export default router;

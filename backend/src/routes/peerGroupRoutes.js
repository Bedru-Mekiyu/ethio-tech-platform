import { Router } from "express";
import {
  createPeerGroup,
  getPeerGroupById,
  getPeerGroups,
  joinPeerGroup,
  leavePeerGroup,
  promoteLeader,
} from "../controllers/peerGroupController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, getPeerGroups);
router.get("/:id", protect, getPeerGroupById);
router.post("/", protect, authorize("student", "mentor", "admin"), createPeerGroup);
router.post("/:id/join", protect, authorize("student", "mentor", "admin"), joinPeerGroup);
router.post("/:id/leave", protect, authorize("student", "mentor", "admin"), leavePeerGroup);
router.post("/:id/promote", protect, authorize("student", "mentor", "admin"), promoteLeader);

export default router;

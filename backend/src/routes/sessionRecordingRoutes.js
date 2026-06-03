import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionRole } from "../middlewares/sessionAuth.js";
import * as recordingCtrl from "../controllers/sessionRecordingController.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", requireSessionRole("host", "cohost"), recordingCtrl.createRecording);
router.get("/", recordingCtrl.getRecordings);
router.get("/stats", requireSessionRole("host", "cohost"), recordingCtrl.getRecordingStats);
router.put("/:recordingId", requireSessionRole("host", "cohost"), recordingCtrl.updateRecording);
router.post("/:recordingId/publish", requireSessionRole("host", "cohost"), recordingCtrl.publishRecording);
router.delete("/:recordingId", requireSessionRole("host", "cohost"), recordingCtrl.deleteRecording);
router.post("/:recordingId/progress", recordingCtrl.recordProgress);

export default router;

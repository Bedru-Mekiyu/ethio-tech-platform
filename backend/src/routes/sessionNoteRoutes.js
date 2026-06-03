import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionRole } from "../middlewares/sessionAuth.js";
import * as noteCtrl from "../controllers/sessionNoteController.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.get("/", requireSessionRole("host", "cohost"), noteCtrl.getOrCreateNotes);
router.put("/", requireSessionRole("host", "cohost"), noteCtrl.updateNotes);
router.post("/publish", requireSessionRole("host", "cohost"), noteCtrl.publishNotes);
router.post("/unpublish", requireSessionRole("host", "cohost"), noteCtrl.unpublishNotes);
router.get("/version/:version", requireSessionRole("host", "cohost"), noteCtrl.getNotesVersion);
router.post("/resources", requireSessionRole("host", "cohost"), noteCtrl.addResource);
router.delete("/resources/:index", requireSessionRole("host", "cohost"), noteCtrl.removeResource);
router.get("/published", noteCtrl.getPublishedNotes);
router.get("/my-notes", noteCtrl.getMyStudentNotes);
router.put("/my-notes", noteCtrl.updateMyStudentNotes);

export default router;

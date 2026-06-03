import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionRole } from "../middlewares/sessionAuth.js";
import * as resourceCtrl from "../controllers/sessionResourceController.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", requireSessionRole("host", "cohost"), resourceCtrl.createResource);
router.get("/", resourceCtrl.getResources);
router.get("/stats", requireSessionRole("host", "cohost"), resourceCtrl.getResourceStats);
router.put("/:resourceId", requireSessionRole("host", "cohost"), resourceCtrl.updateResource);
router.delete("/:resourceId", requireSessionRole("host", "cohost"), resourceCtrl.deleteResource);
router.post("/:resourceId/view", resourceCtrl.recordView);
router.post("/:resourceId/download", resourceCtrl.recordDownload);

export default router;

import { Router } from "express";
import { assignBadge, createBadge, getBadges } from "../controllers/badgeController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { badgeSchemas } from "../validators/schemas.js";

const router = Router();

router.get("/", protect, getBadges);
router.post("/", protect, authorize("admin"), validateRequest({ body: badgeSchemas.create }), createBadge);
router.post("/assign", protect, authorize("mentor", "admin"), validateRequest({ body: badgeSchemas.assign }), assignBadge);

export default router;

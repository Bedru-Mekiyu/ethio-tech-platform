import { Router } from "express";
import { getCertificates, issueCertificate } from "../controllers/certificateController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { certificateSchemas } from "../validators/schemas.js";

const router = Router();

router.use(protect);
router.get("/", authorize("mentor", "admin", "student"), getCertificates);
router.post("/", authorize("mentor", "admin"), validateRequest({ body: certificateSchemas.issue }), issueCertificate);

export default router;

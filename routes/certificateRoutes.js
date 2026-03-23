import { Router } from "express";
import { getCertificates, issueCertificate } from "../controllers/certificateController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", authorize("mentor", "admin", "student"), getCertificates);
router.post("/", authorize("mentor", "admin"), issueCertificate);

export default router;

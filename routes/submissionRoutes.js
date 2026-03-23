import { Router } from "express";
import {
  createSubmission,
  getMySubmissions,
  getSubmissions,
  reviewSubmission,
} from "../controllers/submissionController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.post("/", authorize("student"), createSubmission);
router.get("/mine", authorize("student"), getMySubmissions);
router.get("/", authorize("mentor", "admin"), getSubmissions);
router.patch("/:id/review", authorize("mentor", "admin"), reviewSubmission);

export default router;

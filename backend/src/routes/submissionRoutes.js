import { Router } from "express";
import {
  createSubmission,
  getMySubmissions,
  getSubmissions,
  reviewSubmission,
} from "../controllers/submissionController.js";
import { authorize, protect, requireVerifiedMentor } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, submissionSchemas } from "../validators/schemas.js";

const router = Router();

router.use(protect);
router.post("/", authorize("student"), validateRequest({ body: submissionSchemas.create }), createSubmission);
router.get("/mine", authorize("student"), getMySubmissions);
router.get("/", authorize("mentor", "admin", "super_admin", "reviewer", "moderator"), getSubmissions);
router.patch("/:id/review", authorize("mentor", "admin", "super_admin", "reviewer", "moderator"), requireVerifiedMentor, validateRequest({ params: commonSchemas.idParam, body: submissionSchemas.review }), reviewSubmission);

export default router;

import { Router } from "express";
import {
  createSubmission,
  getMySubmissions,
  getSubmissions,
  reviewSubmission,
} from "../controllers/submissionController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, submissionSchemas } from "../validators/schemas.js";

const router = Router();

router.use(protect);
router.post("/", authorize("student"), validateRequest({ body: submissionSchemas.create }), createSubmission);
router.get("/mine", authorize("student"), getMySubmissions);
router.get("/", authorize("mentor", "admin"), getSubmissions);
router.patch("/:id/review", authorize("mentor", "admin"), validateRequest({ params: commonSchemas.idParam, body: submissionSchemas.review }), reviewSubmission);

export default router;

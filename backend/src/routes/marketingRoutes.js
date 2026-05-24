import { Router } from "express";
import { getMarketingAbout, getMarketingHome, getMarketingMentors } from "../controllers/marketingController.js";

const router = Router();

router.get("/home", getMarketingHome);
router.get("/about", getMarketingAbout);
router.get("/mentors", getMarketingMentors);

export default router;

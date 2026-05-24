import { Router } from "express";
import {
  getMarketingAbout,
  getMarketingHome,
  getMarketingHubs,
  getMarketingMentors,
} from "../controllers/marketingController.js";

const router = Router();

router.get("/home", getMarketingHome);
router.get("/about", getMarketingAbout);
router.get("/mentors", getMarketingMentors);
router.get("/hubs", getMarketingHubs);

export default router;

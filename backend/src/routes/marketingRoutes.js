import { Router } from "express";
import { getMarketingAbout, getMarketingHome } from "../controllers/marketingController.js";

const router = Router();

router.get("/home", getMarketingHome);
router.get("/about", getMarketingAbout);

export default router;

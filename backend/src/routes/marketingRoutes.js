import { Router } from "express";
import { getMarketingHome } from "../controllers/marketingController.js";

const router = Router();

router.get("/home", getMarketingHome);

export default router;

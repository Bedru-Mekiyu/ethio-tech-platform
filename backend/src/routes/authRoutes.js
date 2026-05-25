import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
  updatePassword,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { authSchemas } from "../validators/schemas.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication requests" },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts" },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many registration attempts" },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many password reset requests" },
});

router.post("/register", registerLimiter, validateRequest({ body: authSchemas.register }), register);
router.post("/login", loginLimiter, validateRequest({ body: authSchemas.login }), login);
router.post("/refresh", authLimiter, refresh);
router.post("/forgot-password", forgotLimiter, validateRequest({ body: authSchemas.forgotPassword }), forgotPassword);
router.post("/reset-password", forgotLimiter, validateRequest({ body: authSchemas.resetPassword }), resetPassword);
router.post("/logout", protect, logout);
router.patch("/password", protect, validateRequest({ body: authSchemas.changePassword }), updatePassword);
router.get("/me", protect, me);

export default router;

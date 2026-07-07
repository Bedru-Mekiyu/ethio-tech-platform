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
  activate,
  firstLoginPassword,
  acceptTermsHandler,
  onboardingStatus,
  completeOnboardingHandler,
  updateOnboardingStepHandler,
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
router.post("/activate", forgotLimiter, validateRequest({ body: authSchemas.activate }), activate);
router.post("/logout", protect, logout);
router.patch("/password", protect, validateRequest({ body: authSchemas.changePassword }), updatePassword);
router.post(
  "/first-login/change-password",
  protect,
  validateRequest({ body: authSchemas.firstLoginChangePassword }),
  firstLoginPassword
);
router.post("/accept-terms", protect, acceptTermsHandler);
router.get("/onboarding-status", protect, onboardingStatus);
router.post("/onboarding/complete", protect, completeOnboardingHandler);
router.post(
  "/onboarding/step",
  protect,
  validateRequest({ body: authSchemas.onboardingStep }),
  updateOnboardingStepHandler
);
router.get("/me", protect, me);

export default router;

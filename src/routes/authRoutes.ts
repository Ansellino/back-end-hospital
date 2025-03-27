import { Router } from "express";
import * as authController from "../controllers/authController";
import { authenticate } from "../middlewares/authMiddleware"; // Updated import path

const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authenticate, authController.getCurrentUser);
router.post("/logout", authController.logout);
router.post("/password-reset-request", authController.requestPasswordReset);
router.post("/password-reset", authController.resetPassword);
router.get("/test-secret", authController.testSecret);

export default router;

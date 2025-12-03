import express from "express";
import {
  checkLoginStatus,
  forceLogout,
  loginUser,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  verifyUser,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/staff/login", loginUser);
router.post("/logout", logoutUser);
router.post("/getOTP", requestPasswordReset);
router.post("/verify-email", verifyEmail);
router.patch("/reset-password", resetPassword);
router.post("/verify", authenticateToken, verifyUser);
router.post("/staff/force-logout", forceLogout); // ✅ NEW: For clearing cookies
router.get("/staff/check-login", checkLoginStatus); // ✅ NEW: Check if logged in

export default router;

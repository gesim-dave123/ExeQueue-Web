import { Role } from "@prisma/client";
import express from "express";
import { cleanupDuplicateSessions } from "../controllers/cleanup.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";
const router = express.Router();

// Cleanup endpoint (only for admin/personnel)
router.post(
  "/cleanup-sessions",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  cleanupDuplicateSessions
);

export default router;

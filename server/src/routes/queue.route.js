import { Role } from "@prisma/client";
import express from "express";
import {
  createQueueSession,
  determineNextQueue,
  getQueueList,
  getQueueListByStatus, // Add this import
  markQueueStatus,
  restoreSkippedQueue,
  viewQueues,
} from "../controllers/queue.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/view",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  viewQueues
);

router.get(
  "/next-queue",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  determineNextQueue
);

router.post(
  "/add-session",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  createQueueSession
);

router.get("/queues", getQueueList);

// Add the new route for getting queues by status
router.get(
  "/list",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  getQueueListByStatus
);

router.put(
  "/status",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  markQueueStatus
);

router.put(
  "/restore-skipped",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  restoreSkippedQueue
);

export default router;

import { Role } from "@prisma/client";
import express from "express";
import {
  callNextQueue,
  createQueueSession,
  currentServedQueue,
  determineNextQueue,
  getQueueList,
  getQueueListByStatus, // Add this import
  markQueueStatus,
  restoreSkippedQueue,
  setDeferredRequestStatus,
  setRequestStatus,
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
  "/call/:windowId",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  callNextQueue
);

router.put(
  "/set/status/:queueId/:requestId/:requestStatus/:windowId",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  setRequestStatus
);
router.put(
  "/set/status/deferred/:queueId/:requestId/:windowId/:requestStatus",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  setDeferredRequestStatus
);

router.put(
  "/:queueId/:windowId/mark-status",
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

router.get(
  "/current/:windowId",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  currentServedQueue
);

export default router;

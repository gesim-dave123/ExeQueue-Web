import { Role } from "@prisma/client";
import express from "express";
import {
  getTransactionStats,
  getTransactionsWithStalledLogic,
  updateTransactionStatus,
} from "../controllers/transaction.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/transactions",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  getTransactionsWithStalledLogic
);

router.get(
  "/stats",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  getTransactionStats
);

router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  updateTransactionStatus
);

router.get(
  "/stats",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  getTransactionStats
);

export default router;

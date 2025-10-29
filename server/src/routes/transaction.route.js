import { Role } from "@prisma/client";
import express from "express";
import {
  getTransactions,
  getTransactionStats,
} from "../controllers/transaction.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";
import { updateTransactionStatus } from "../controllers/transaction.controller.js";

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  getTransactions
);

router.get(
  "/stats",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  getTransactionStats
);

router.patch( //237
  "/:id/status",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  updateTransactionStatus
);

export default router;
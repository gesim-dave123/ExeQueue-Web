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

export default router;
import { Role } from '@prisma/client';
import express from 'express';
import { getDashboardStatistics,getAnalyticsData } from '../controllers/statistics.controller.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/dashboard',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  getDashboardStatistics
);
router.get("/analytics", authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  getAnalyticsData);




export default router;

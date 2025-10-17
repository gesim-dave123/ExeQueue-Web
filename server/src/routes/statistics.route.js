import { Role } from '@prisma/client';
import express from 'express';
import {
  getDashboardStatistics,
  getAnalyticsData,
  getTodayAnalytics,
} from '../controllers/statistics.controller.js';
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
//this week analytics
router.get(
  '/week',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  getAnalyticsData
);
//today analytics
router.get(
  '/today',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  getTodayAnalytics
);
export default router;

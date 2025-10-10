import { Role } from '@prisma/client';
import express from 'express';
import { getDashboardStatistics } from '../controllers/statistics.controller';
import {
  authenticateToken,
  authorizeRoles,
} from '../middlewares/auth.middleware';

const router = express.Router();

router.get(
  '/dashboard',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  getDashboardStatistics
);

export default router;

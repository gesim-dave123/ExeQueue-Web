import express from 'express';
import { cleanupDuplicateSessions } from '../controllers/cleanup.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = express.Router();

// Cleanup endpoint (only for admin/personnel)
router.post(
  '/cleanup-sessions',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  cleanupDuplicateSessions
);

export default router;

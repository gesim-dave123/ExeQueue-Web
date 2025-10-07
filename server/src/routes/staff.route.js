import { Role } from '@prisma/client';
import express from 'express';
import {
  assignServiceWindow,
  createQueueSession,
  determineNextQueue,
  getQueueList,
  viewQueues,
  markQueueStatus,
  restoreSkippedQueue,
  getWorkingScholars,
  softDeleteWorkingScholar,
  updateWorkingScholar,
  createWorkingScholar,
} from '../controllers/staff.controller.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/queue/view',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  viewQueues
);

router.get(
  '/queue/next-queue',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  determineNextQueue
);
router.post(
  '/queue/add-session',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  createQueueSession
);
router.get('/queue/queues', getQueueList);

router.put(
  '/window/assign',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  assignServiceWindow
);

router.put(
  '/queue/status',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  markQueueStatus
);

router.put(
  '/queue/restore-skipped',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  restoreSkippedQueue
);

/* --Manage Accounts - (Personnel only)--*/
router.get(
  '/accounts/working-scholars',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  getWorkingScholars
);

router.post(
  '/accounts/working-scholars',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  createWorkingScholar
);

router.put(
  '/accounts/working-scholars/:sasStaffId',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  updateWorkingScholar
);
//soft-delete
router.delete(
  '/accounts/working-scholars/:sasStaffId',
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  softDeleteWorkingScholar
);
export default router;

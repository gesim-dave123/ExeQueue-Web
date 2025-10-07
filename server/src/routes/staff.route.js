import { Role } from '@prisma/client';
import express from 'express';
import {
  assignServiceWindow,
  createQueueSession,
  determineNextQueue,
  getQueueList,
  viewQueues
} from '../controllers/staff.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router()

router.get('/queue/view' ,authenticateToken ,authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),viewQueues)

router.get('/queue/next-queue', authenticateToken, authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),determineNextQueue)
router.post('/queue/add-session',authenticateToken,authorizeRoles(Role.PERSONNEL),createQueueSession )
router.get ('/queue/queues', getQueueList)
router.put('/window/assign', authenticateToken, authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR), assignServiceWindow)
export default router;
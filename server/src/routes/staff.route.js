import { Role } from '@prisma/client';
import express from 'express';
import { viewQueues } from '../controllers/staff.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router()

router.get('/queue/view' ,authenticateToken ,authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),viewQueues)


export default router;
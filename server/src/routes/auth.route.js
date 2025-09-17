import { Role } from '@prisma/client';
import express from 'express';
import { createUser, loginUser, logoutUser } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
const router = express.Router();

router.post('/login', loginUser)
router.post('/create-account', authenticateToken, authorizeRoles(Role.PERSONNEL),createUser)
router.post('/logout', logoutUser)

export default router;
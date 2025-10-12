import { Role } from '@prisma/client';
import express from 'express';
import { createUser, loginUser, logoutUser,requestPasswordReset,verifyEmail,resetPassword } from '../controllers/auth.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
// import { authorizeRoles } from '../middlewares/role.middleware.js';
const router = express.Router();

router.post('/staff/login', loginUser)
router.post('/create-account', authenticateToken, authorizeRoles(Role.PERSONNEL),createUser)
router.post('/logout', logoutUser)
router.post('/getOTP',requestPasswordReset)
router.post('/verify-email',verifyEmail)
router.patch('/reset-password',resetPassword)

export default router;
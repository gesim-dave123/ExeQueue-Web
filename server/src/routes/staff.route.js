import { Role } from "@prisma/client";
import express from "express";
import {
  assignServiceWindow,
  getWorkingScholars,
  softDeleteWorkingScholar,
  updateWorkingScholar,
  createWorkingScholar,
  checkAvailableWindow,
  getMyWindowAssignment,
  getServiceWindowDetails,
  releaseServiceWindow,
} from '../controllers/staff.controller.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
  "/window/:windowId/assign",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  assignServiceWindow
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
router.post(
  "/window/check",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  checkAvailableWindow
);

router.put(
  "/window/release",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  releaseServiceWindow
);

router.get(
  "/window/get/own",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  getMyWindowAssignment
);

router.get(
  "/window/get",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  getServiceWindowDetails
);

export default router;

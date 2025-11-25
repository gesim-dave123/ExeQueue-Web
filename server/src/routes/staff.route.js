import { Role } from "@prisma/client";
import express from "express";
import {
  assignServiceWindow,
  checkAvailableWindow,
  createWorkingScholar,
  getMyWindowAssignment,
  getServiceWindowDetails,
  getWorkingScholars,
  manualResetQueueNumber,
  manualResetSession,
  manualWindowRelease,
  releaseServiceWindow,
  softDeleteWorkingScholar,
  updateAdminProfile,
  updateWindowHeartbeat,
  updateWorkingScholar,
} from "../controllers/staff.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/window/:windowId/assign",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  assignServiceWindow
);

router.put(
  "/window/update/heartbeat",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL, Role.WORKING_SCHOLAR),
  updateWindowHeartbeat
);

/* --Manage Accounts - (Personnel only)--*/
router.get(
  "/accounts/working-scholars",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  getWorkingScholars
);

router.post(
  "/accounts/working-scholars",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  createWorkingScholar
);

router.put(
  "/accounts/working-scholars/:sasStaffId",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  updateWorkingScholar
);
//soft-delete
router.delete(
  "/accounts/working-scholars/:sasStaffId",
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

router.put(
  "/queue/reset/:queueType",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  manualResetQueueNumber
);

router.put(
  "/session/reset",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  manualResetSession
);

router.put(
  "/window/release/:windowNum",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  manualWindowRelease
);

router.put(
  "/personnel/profile-setting",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  updateAdminProfile
);

export default router;

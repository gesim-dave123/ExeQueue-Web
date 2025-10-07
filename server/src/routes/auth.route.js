import { Role } from "@prisma/client";
import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
  verifyUser,
} from "../controllers/auth.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";
// import { authorizeRoles } from '../middlewares/role.middleware.js';
const router = express.Router();

router.post("/staff/login", loginUser);
router.post(
  "/create-account",
  authenticateToken,
  authorizeRoles(Role.PERSONNEL),
  createUser
);
router.post("/verify", authenticateToken, verifyUser);
router.post("/logout", logoutUser);

export default router;

import jwt from "jsonwebtoken";
import prisma from "../../prisma/prisma.js";
// import { PrismaClient } from '../generated/prisma/index.js'
// const prisma = new PrismaClient();

export const authenticateToken = async (req, res, next) => {
  // Try cookie first
  let token = req.cookies.access_token;

  // Fallback to Authorization header for mobile
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.sasStaff.findUnique({
      where: {
        sasStaffId: decoded.id,
      },
      select: {
        sasStaffId: true,
        username: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
      },
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Account not found!" });
    if (!user.isActive && user.deletedAt === null) {
      return res
        .status(401)
        .json({ success: false, message: "Account not found!" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in authenticateToken:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });
    }

    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error." });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Unathorized Access" });
    }
    next();
  };
};

import jwt from "jsonwebtoken";
import prisma from "../../prisma/prisma.js";

export const authenticateToken = async (req, res, next) => {
  let token = req.cookies?.access_token;
  // console.log("Cookie: ", token);

  if (!token) {
    const authHeader = req.headers?.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      // console.log("Session Storage Token: ", token);
    }
  }
  if (!token) {
    token = req.query?.token;
    // console.log("Query Token: ", token);
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
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

    if (!user) {
      await releaseWindowForUser(decoded.id);
      res.clearCookie("access_token");
      return res.status(404).json({
        success: false,
        message: "Account not found!",
      });
    }

    // Check if user is active and not deleted
    if (!user.isActive || user.deletedAt !== null) {
      await releaseWindowForUser(decoded.id);
      // Clear the cookie since account is inactive/deleted
      res.clearCookie("access_token");
      return res.status(401).json({
        success: false,
        message: "Account not found!",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in authenticateToken:", error);
    res.clearCookie("access_token");
    if (error.name === "TokenExpiredError") {
      try {
        const decodedExpired = jwt.decode(token);

        if (decodedExpired && decodedExpired.id) {
          console.log(
            `Token expired for user ${decodedExpired.id}. Releasing window...`
          );
          await releaseWindowForUser(decodedExpired.id);
        }
      } catch (cleanupError) {
        console.error(
          "Failed to cleanup expired session window:",
          cleanupError
        );
      }
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient permissions",
      });
    }

    next();
  };
};

async function releaseWindowForUser(userId) {
  try {
    await prisma.windowAssignment.findFirst({
      where: { assignmentId: userId },
      data: { releasedAt: new Date() },
    });
  } catch (e) {
    console.error("Error releasing window:", e);
  }
}
export const authenticateSSE = async (req, res, next) => {
  let token = null;
  token = req.cookies.access_token;
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found!",
      });
    }

    if (!user.isActive || user.deletedAt !== null) {
      return res.status(401).json({
        success: false,
        message: "Account not found!",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in authenticateSSE:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

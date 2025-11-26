import cookie from "cookie";
import jwt from "jsonwebtoken";

export const socketAuthentication = (io) => {
  io.use((socket, next) => {
    try {
      let token = null;
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      token = cookies.access_token;
      if (!token) {
        const authHeader =
          socket.handshake.headers.authorization ||
          socket.handshake.auth?.token;
        if (authHeader) {
          console.log("Auth Header", authHeader);
          if (authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
          }
        }
      }
      if (!token) {
        console.warn("No Token Provided, Socket disconnecting...");
        return next(new Error("No token provided!"));
      }
      console.log("Token", token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!["PERSONNEL", "WORKING_SCHOLAR"].includes(decoded.role.toString())) {
        console.warn("Unauthorized role:", decoded.role);
        return next(new Error("Unauthorized role"));
      }
      socket.user = decoded;
      next();
    } catch (error) {
      console.error("Socket auth failed:", error.message);
      next(new Error("Unauthorized"));
    }
  });
};

// Role checking utility
export const checkRole = (user, allowedRoles) => {
  if (!user?.role) return false;

  const userRole = user.role.toUpperCase();
  console.log(userRole);
  const allowed = allowedRoles.map((r) => r.toUpperCase());
  console.log(allowed);
  console.log("🧩 Role check:", { userRole, allowed });

  return allowed.includes(userRole);
};

// Wrapper for socket events that need role checking
export const requireSocketRole = (allowedRoles, handler) => {
  return async (socket, ...args) => {
    if (!socket.user) {
      return socket.emit("error", {
        message: "Authentication required",
      });
    }

    if (!checkRole(socket.user, allowedRoles)) {
      console.warn(
        `User ${socket.user.id} with role ${socket.user.role} attempted unauthorized action`
      );
      console.log(
        `User ${socket.user.id} with role ${socket.user.role} attempted unauthorized action`
      );
      return socket.emit("error", {
        message: "Insufficient permissions",
        requiredRoles: allowedRoles,
      });
    }

    try {
      await handler(socket, ...args);
    } catch (error) {
      console.error("Socket handler error:", error);
      socket.emit("error", {
        message: error.message || "An error occurred",
      });
    }
  };
};

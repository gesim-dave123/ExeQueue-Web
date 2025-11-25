import { Role, Status } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
import { getShiftTag } from "../../utils/shiftTag.js";
import { QueueActions, WindowEvents } from "../services/enums/SocketEvents.js";
// import { sendDashboardUpdate } from "./sse.controllers.js";
import { scheduleAssignmentTimer } from "../services/Window/windowAssignment.service.js";
import {
  sendDashboardUpdate,
  sendLiveDisplayUpdate,
} from "./statistics.controller.js";
const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
  new Date(),
  "Asia/Manila"
);
const isIntegerParam = (val) => /^\d+$/.test(val);

export const assignServiceWindow = async (req, res) => {
  const { sasStaffId } = req.user;
  const { windowId: windowIdStr } = req.params;
  const io = req.app.get("io");
  const shift = getShiftTag();

  try {
    // Validate integer params
    if (!isIntegerParam(windowIdStr)) {
      return res.status(400).json({
        success: false,
        message: "Invalid param. windowID must be an integer.",
      });
    }

    const windowId = Number(windowIdStr);

    if (isNaN(windowIdStr)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Type. windowID must be a Number.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Check again within transaction
      const existing = await tx.windowAssignment.findFirst({
        where: { windowId, shiftTag: shift, releasedAt: null },
        include: {
          staff: {
            select: { sasStaffId: true, firstName: true, lastName: true },
          },
        },
      });

      if (existing && existing.sasStaffId !== sasStaffId) {
        throw new Error(
          `Window ${windowId} already assigned to ${existing.staff.firstName} ${existing.staff.lastName}`
        );
      }

      const assignment = await tx.windowAssignment.create({
        data: {
          sasStaffId,
          windowId,
          shiftTag: shift,
          lastHeartbeat: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
        },
        include: {
          staff: {
            select: { sasStaffId: true, firstName: true, lastName: true },
          },
          serviceWindow: true,
        },
      });

      return assignment;
    });
    scheduleAssignmentTimer(
      result.assignmentId,
      DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
      io
    );
    // io.emit(WindowEvents.ASSIGN_WINDOW, {
    //   windowId,
    //   staff: result.staff,
    //   message: `Window ${windowId} assigned to ${result.staff.firstName}`,
    // });

    return res.status(201).json({
      success: true,
      message: `Successfully assigned to ${result.serviceWindow.windowName}`,
      assignment: result,
    });
  } catch (error) {
    console.error("Error assigning staff:", error);

    // Handle unique constraint (window already taken)
    if (error.code === "P2002" && error.meta?.target?.includes("windowId")) {
      return res.status(409).json({
        success: false,
        message: "This window is already assigned to another staff.",
      });
    }

    // 🧩 Handle custom logic errors (like already assigned)
    if (error.message.includes("already assigned")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
      error: error.message,
    });
  }
};

export const releaseServiceWindow = async (req, res) => {
  try {
    const { sasStaffId } = req.user;
    const shift = getShiftTag();
    const io = req.app.get("io");

    const result = await prisma.$transaction(async (tx) => {
      const activeAssignment = await tx.windowAssignment.findFirst({
        where: { sasStaffId, shiftTag: shift, releasedAt: null },
        include: {
          serviceWindow: {
            select: {
              windowName: true,
            },
          },
        },
      });

      if (!activeAssignment) {
        return res.status(203).json({
          success: false,
          messsage: "There is no active staff assigned to this window",
          wasWindowAssigned: false,
        });
      }

      const currentQueue = await tx.queue.findFirst({
        where: {
          windowId: activeAssignment.windowId,
          queueStatus: Status.IN_SERVICE,
          // servedAt: null, // Not yet completed
        },
        select: {
          queueId: true,
          queueNumber: true,
        },
      });

      if (currentQueue) {
        const updatedQueue = await tx.queue.update({
          where: { queueId: currentQueue.queueId },
          data: {
            queueStatus: Status.WAITING,
            windowId: null,
            servedByStaff: null,
            calledAt: null,
          },
          select: {
            queueId: true,
            referenceNumber: true,
            windowId: true,
          },
        });
        io.emit(QueueActions.QUEUE_RESET, {
          queueId: updatedQueue.queueId,
          windowId: updatedQueue.windowId,
          referenceNumber: updatedQueue.referenceNumber,
          previousWindowId: activeAssignment.windowId,
        });
      }

      const released = await tx.windowAssignment.updateMany({
        where: { sasStaffId, shiftTag: shift, releasedAt: null },
        data: { releasedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila") },
      });

      return {
        releasedCount: released.count,
        windowId: activeAssignment.windowId,
        windowName: activeAssignment.serviceWindow.windowName,
        resetQueue: currentQueue,
      };
    });
    io.to(`window:${result.windowId}`).emit(WindowEvents.RELEASE_WINDOW, {
      windowId: result.windowId,
      previousWindowId: result.windowId,
      sasStaffId,
      shift,
      resetQueue: result.resetQueue
        ? {
            queueId: result.resetQueue.queueId,
            queueNo: result.resetQueue.queueNumber,
          }
        : null,
      message: `${result.windowName} was released.`,
    });
    sendDashboardUpdate({
      windowId: result.windowId,
      previousWindowId: result.windowId,
      sasStaffId,
      shift,
      resetQueue: result.resetQueue
        ? {
            queueId: result.resetQueue.queueId,
            queueNo: result.resetQueue.queueNumber,
          }
        : null,
      message: `${result.windowName} was released.`,
    });

    sendLiveDisplayUpdate({
      windowId: result.windowId,
      previousWindowId: result.windowId,
      sasStaffId,
      shift,
      resetQueue: result.resetQueue
        ? {
            queueId: result.resetQueue.queueId,
            queueNo: result.resetQueue.queueNumber,
          }
        : null,
      message: `${result.windowName} was released.`,
    });

    return res.status(200).json({
      success: true,
      message: result.resetQueue
        ? `Window released and queue ${result.resetQueue.queueNumber} reset to waiting`
        : "Window released successfully",
      resetQueue: result.resetQueue,
      wasWindowAssigned: true,
    });
  } catch (error) {
    console.error("❌ Error releasing window:", error);

    if (error.message === "No active window assignment found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};
export const getMyWindowAssignment = async (req, res) => {
  try {
    const { sasStaffId } = req.user;
    const shift = getShiftTag();

    const assignment = await prisma.windowAssignment.findFirst({
      where: {
        sasStaffId: sasStaffId,
        shiftTag: shift,
        releasedAt: null,
      },
      include: {
        serviceWindow: true,
        staff: {
          select: {
            sasStaffId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!assignment) {
      return res.status(200).json({
        success: true,
        message: "No active assignment",
        assignment: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active assignment found",
      assignment: assignment,
    });
  } catch (error) {
    console.error("❌ Error getting assignment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

export const checkAvailableWindow = async (req, res) => {
  try {
    const { windowIds } = req.body;

    if (!Array.isArray(windowIds)) {
      return res.status(400).json({
        error: "windowIds must be an array",
        example: { windowIds: [1, 2, 3] },
      });
    }

    if (!windowIds || windowIds.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Window Id array is empty",
      });
    }

    const shift = getShiftTag(); // returns "MORNING", "AFTERNOON", "EVENING"
    const assignedWindows = await prisma.windowAssignment.findMany({
      where: {
        windowId: { in: windowIds },
        releasedAt: null,
        // // assignedAt: todayUTC,
        shiftTag: shift.toString(),
      },
      select: {
        windowId: true,
      },
    });

    const assignedIds = assignedWindows.map((a) => a.windowId);
    const availableWindows = windowIds.filter(
      (id) => !assignedIds.includes(id)
    );

    return res.status(200).json({
      success: true,
      availableWindows,
      assignedIds,
    });
  } catch (error) {
    console.error("Error occurred checking window availability: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

export const updateWindowHeartbeat = async (req, res) => {
  try {
    const { sasStaffId } = req.user;
    const { windowId } = req.body;
    const io = req.app.get("io");
    const shift = getShiftTag();
    const HEARTBEAT_INTERVAL = 2 * 60 * 1000;

    // Validate windowId
    if (!windowId) {
      return res.status(400).json({
        success: false,
        message: "windowId is required",
      });
    }

    const assignment = await prisma.windowAssignment.findFirst({
      where: {
        sasStaffId,
        windowId,
        shiftTag: shift,
        releasedAt: null,
      },
      select: {
        assignmentId: true,
        lastHeartbeat: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "No active assignment found",
      });
    }

    const now = DateAndTimeFormatter.nowInTimeZone("Asia/Manila");

    // Check if heartbeat needs updating
    if (assignment.lastHeartbeat) {
      const timeSinceLastHeartbeat =
        now.getTime() - new Date(assignment.lastHeartbeat).getTime();

      // Only update if heartbeat is older than interval
      if (timeSinceLastHeartbeat < HEARTBEAT_INTERVAL) {
        return res.status(200).json({
          success: true,
          message: "Heartbeat still fresh, skipped update",
          skipped: true,
          lastHeartbeat: assignment.lastHeartbeat,
        });
      }
    }

    // Update heartbeat using the specific assignmentId
    const updatedAssignment = await prisma.windowAssignment.update({
      where: {
        assignmentId: assignment.assignmentId,
      },
      data: {
        lastHeartbeat: now,
      },
      select: {
        assignmentId: true,
      },
    });
    scheduleAssignmentTimer(
      updatedAssignment.assignmentId,
      DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
      io
    );
    // Emit socket event for monitoring/debugging (optional)
    if (io) {
      io.emit(WindowEvents.HEARTBEAT_UPDATE, {
        windowId,
        sasStaffId,
        timestamp: now,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Heartbeat updated",
      updated: true,
      lastHeartbeat: now,
    });
  } catch (error) {
    console.error("Error updating heartbeat:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};
export const checkAndReleaseStaleAssignments = async (req, res) => {
  try {
    const io = req.app.get("io");
    const HEARTBEAT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - HEARTBEAT_TIMEOUT);

    const staleAssignments = await prisma.windowAssignment.findMany({
      where: {
        releasedAt: null,
        lastHeartbeat: {
          lt: timeoutThreshold,
        },
      },
      include: {
        staff: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (staleAssignments.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No stale assignments found",
        count: 0,
      });
    }

    const released = await prisma.windowAssignment.updateMany({
      where: {
        releasedAt: null,
        lastHeartbeat: {
          lt: timeoutThreshold,
        },
      },
      data: {
        releasedAt: now,
      },
    });

    staleAssignments.forEach((assignment) => {
      io.emit(WindowEvents.AUTO_RELEASE_WINDOW, {
        windowId: assignment.windowId,
        sasStaffId: assignment.sasStaffId,
        staffName: `${assignment.staff.firstName} ${assignment.staff.lastName}`,
        reason: "No activity detected (5 minute timeout)",
      });
    });

    return res.status(200).json({
      success: true,
      message: `Released ${released.count} stale assignments`,
      count: released.count,
    });
  } catch (error) {
    console.error("❌ Error checking stale assignments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

export const getServiceWindowDetails = async (req, res) => {
  try {
    const serviceWindows = await prisma.serviceWindow.findMany({
      where: {
        isActive: true,
      },
    });
    if (serviceWindows === null) {
      return res.status(200).json({
        success: false,
        message: "Error occured, returned null",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Service Windows:",
      windows: serviceWindows,
    });
  } catch (error) {}
};

export const getWorkingScholars = async (req, res) => {
  try {
    const workingScholars = await prisma.sasStaff.findMany({
      where: {
        role: Role.WORKING_SCHOLAR,
        isActive: true,
      },
      select: {
        sasStaffId: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    const formattedScholars = workingScholars.map((scholar) => ({
      sasStaffId: scholar.sasStaffId,
      username: scholar.username,
      firstName: scholar.firstName,
      lastName: scholar.lastName,
      name: `${scholar.firstName} ${scholar.lastName}`,
      role: scholar.role,
      email: scholar.email,
    }));

    return res.status(200).json({
      success: true,
      message: "Working Scholar accounts retrieved successfully.",
      data: formattedScholars,
    });
  } catch (error) {
    console.error("Error retrieving working scholars:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve Working Scholar accounts.",
    });
  }
};

export const createWorkingScholar = async (req, res) => {
  try {
    const creatorId = req.user?.sasStaffId;

    const {
      username,
      firstName,
      lastName,
      middleName,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (
      !username?.trim() ||
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Password cannot be empty",
        field: "password",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
        field: "password",
      });
    }
    const existingUsername = await prisma.sasStaff.findFirst({
      where: {
        username,
        deletedAt: null,
        isActive: true,
      },
      select: { sasStaffId: true, username: true, email: true },
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
        field: "username",
      });
    }

    // ✅ Check email separately
    const existingEmail = await prisma.sasStaff.findFirst({
      where: {
        email,
        deletedAt: null,
        isActive: true,
      },
      select: { sasStaffId: true, username: true, email: true },
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
        field: "email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAccount = await prisma.sasStaff.create({
      data: {
        username,
        hashedPassword,
        firstName,
        lastName,
        middleName: middleName ?? null,
        email,
        role: Role.WORKING_SCHOLAR,
        isActive: true,
        createdBy: creatorId ?? null,
      },
      select: {
        sasStaffId: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Working Scholar account created successfully.",
      data: {
        sasStaffId: newAccount.sasStaffId,
        username: newAccount.username,
        name: `${newAccount.firstName} ${newAccount.lastName}`,
        email: newAccount.email,
        role: newAccount.role,
      },
    });
  } catch (error) {
    console.error("Error creating working scholar account:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const updateWorkingScholar = async (req, res) => {
  try {
    const updaterId = req.user?.sasStaffId;
    const { sasStaffId } = req.params;
    const {
      username,
      firstName,
      lastName,
      middleName,
      email,
      newPassword,
      confirmPassword,
    } = req.body;

    const account = await prisma.sasStaff.findUnique({
      where: { sasStaffId },
      select: {
        sasStaffId: true,
        username: true,
        email: true,
        isActive: true,
        role: true,
        deletedAt: true,
        createdBy: true,
      },
    });

    // Check if account exists and is not soft deleted
    if (!account || !account.isActive || account.deletedAt !== null) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found or inactive." });
    }

    if (account.role !== Role.WORKING_SCHOLAR) {
      return res.status(403).json({
        success: false,
        message: "Can only update Working Scholar accounts.",
      });
    }

    let hashedPassword = undefined;
    if (
      (newPassword && !confirmPassword) ||
      (!newPassword && confirmPassword)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Both newPassword and confirmPassword are required to change password.",
      });
    }
    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match.",
          field: "password",
        });
      }
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    // Check if username is being changed and if it's available
    if (username && username !== account.username) {
      const existingUsername = await prisma.sasStaff.findFirst({
        where: {
          username,
          deletedAt: null, // ✅ Only check active accounts
          sasStaffId: { not: sasStaffId }, // ✅ Exclude current account
        },
        select: { sasStaffId: true },
      });
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: "Username already in use.",
          field: "username",
        });
      }
    }

    // Check if email is being changed and if it's available
    if (email && email !== account.email) {
      const existingEmail = await prisma.sasStaff.findFirst({
        where: {
          email,
          deletedAt: null, // ✅ Only check active accounts
          sasStaffId: { not: sasStaffId }, // ✅ Exclude current account
        },
        select: { sasStaffId: true },
      });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already in use.",
          field: "email",
        });
      }
    }

    // Build update payload
    const updateData = {
      ...(username ? { username } : {}),
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(typeof middleName !== "undefined"
        ? { middleName: middleName ?? null }
        : {}),
      ...(email ? { email } : {}),
      ...(typeof hashedPassword !== "undefined" ? { hashedPassword } : {}),
      updatedAt: new Date(),
    };

    const updated = await prisma.sasStaff.update({
      where: { sasStaffId },
      data: updateData,
      select: {
        sasStaffId: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Account updated successfully.",
      data: {
        sasStaffId: updated.sasStaffId,
        username: updated.username,
        name: `${updated.firstName} ${updated.lastName}`,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (error) {
    console.error("Error updating working scholar account:", error);

    // ✅ Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];

      if (field === "email") {
        return res.status(409).json({
          success: false,
          message: "Email already in use.",
          field: "email",
        });
      }

      if (field === "username") {
        return res.status(409).json({
          success: false,
          message: "Username already in use.",
          field: "username",
        });
      }
    }

    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const softDeleteWorkingScholar = async (req, res) => {
  try {
    const { sasStaffId } = req.params;

    const account = await prisma.sasStaff.findUnique({
      where: { sasStaffId },
      select: { sasStaffId: true, role: true, isActive: true },
    });

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found." });
    }

    if (account.role !== Role.WORKING_SCHOLAR) {
      return res.status(403).json({
        success: false,
        message: "Can only delete Working Scholar accounts.",
      });
    }

    if (!account.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "Account already deleted." });
    }

    const deleted = await prisma.sasStaff.update({
      where: { sasStaffId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
      select: {
        sasStaffId: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        deletedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
      data: {
        sasStaffId: deleted.sasStaffId,
        username: deleted.username,
        name: `${deleted.firstName} ${deleted.lastName}`,
        email: deleted.email,
        isActive: deleted.isActive,
        deletedAt: deleted.deletedAt,
      },
    });
  } catch (error) {
    console.error("Error soft-deleting account:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const manualWindowRelease = async (req, res) => {
  try {
    const { sasStaffId, role } = req.user;
    const { windowNum: windowNoStr } = req.params;
    const io = req.app.get("io");
    const shift = getShiftTag();

    if (!sasStaffId || !role) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! No Id and Role provided!",
      });
    }

    if (role !== Role.PERSONNEL) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! Role is not of PERSONNEL!",
      });
    }

    const sasStaff = await prisma.sasStaff.findUnique({
      where: { sasStaffId },
      select: { role: true },
    });

    if (sasStaff.role !== role) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! Database Role is not of PERSONNEL!",
      });
    }
    if (!isIntegerParam(windowNoStr)) {
      return res.status(400).json({
        success: false,
        message: "Invalid window number, must be anumerical type!",
      });
    }
    const windowNum = parseInt(windowNoStr);

    if (isNaN(windowNum)) {
      return res.status(400).json({
        success: false,
        message: "An error occurred while parsing window number!",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const window = await tx.serviceWindow.findFirst({
        where: {
          windowNo: windowNum,
        },
        select: {
          windowId: true,
        },
      });

      const activeAssignment = await tx.windowAssignment.findFirst({
        where: {
          windowId: window.windowId,
          shiftTag: shift,
          releasedAt: null,
        },
        select: {
          serviceWindow: {
            select: {
              windowName: true,
            },
          },
          assignmentId: true,
          windowId: true,
        },
      });

      if (!activeAssignment) {
        return res.status(200).json({
          success: false,
          message: "There is no active staff assigned to this window",
          wasWindowAssigned: false,
        });
      }

      const currentQueue = await tx.queue.findFirst({
        where: {
          windowId: activeAssignment.windowId,
          queueStatus: Status.IN_SERVICE,
          // servedAt: null, // Not yet completed
        },
        select: {
          queueId: true,
          queueNumber: true,
        },
      });

      if (currentQueue) {
        const updatedQueue = await tx.queue.update({
          where: { queueId: currentQueue.queueId },
          data: {
            queueStatus: Status.WAITING,
            windowId: null,
            servedByStaff: null,
            calledAt: null,
          },
          select: {
            queueId: true,
            windowId: true,
            referenceNumber: true,
          },
        });

        io.emit(QueueActions.QUEUE_RESET, {
          queueId: updatedQueue.queueId,
          windowId: updatedQueue.windowId,
          referenceNumber: updatedQueue.referenceNumber,
          previousWindowId: activeAssignment.windowId,
        });
      }
      const released = await tx.windowAssignment.update({
        where: {
          assignmentId: activeAssignment.assignmentId,
        },
        data: {
          releasedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
        },
        select: {
          staff: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          windowId: true,
          shiftTag: true,
          assignedAt: true,
          releasedAt: true,
        },
      });

      return {
        releasedCount: released.count,
        windowId: activeAssignment.windowId,
        windowName: activeAssignment.serviceWindow.windowName,
        resetQueue: currentQueue,
      };
    });

    io.to(`window:${result.windowId}`).emit(WindowEvents.RELEASE_WINDOW, {
      windowId: result.windowId,
      previousWindowId: result.windowId,
      sasStaffId,
      releasedByAdmin: true,
      shift,
      resetQueue: result.resetQueue
        ? {
            queueId: result.resetQueue.queueId,
            queueNo: result.resetQueue.queueNumber,
          }
        : null,
      message: `${result.windowName} was released.`,
    });
    sendDashboardUpdate({
      windowId: result.windowId,
      previousWindowId: result.windowId,
      releasedByAdmin: true,

      sasStaffId,
      shift,
      resetQueue: result.resetQueue
        ? {
            queueId: result.resetQueue.queueId,
            queueNo: result.resetQueue.queueNumber,
          }
        : null,
      message: `${result.windowName} was released.`,
    });

    sendLiveDisplayUpdate({
      windowId: result.windowId,
      previousWindowId: result.windowId,
      releasedByAdmin: true,

      sasStaffId,
      shift,
      resetQueue: result.resetQueue
        ? {
            queueId: result.resetQueue.queueId,
            queueNo: result.resetQueue.queueNumber,
          }
        : null,
      message: `${result.windowName} was released.`,
    });

    return res.status(200).json({
      success: true,
      message: result.resetQueue
        ? `Window released and queue ${result.resetQueue.queueNumber} reset to waiting`
        : "Window released successfully",
      resetQueue: result.resetQueue,
      wasWindowAssigned: true,
      releasedByAdmin: true,
    });
  } catch (error) {
    console.error("Manual window release error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!" || error.message,
    });
  }
};

export const manualResetQueueNumber = async (req, res) => {
  try {
    const { queueType } = req.params;
    const { sasStaffId, role } = req.user;
    const io = req.app.get("io");

    if (!sasStaffId || !role) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! No Id and Role provided!",
      });
    }

    if (role !== Role.PERSONNEL) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! Role is not of PERSONNEL!",
      });
    }

    const sasStaff = await prisma.sasStaff.findUnique({
      where: { sasStaffId },
      select: { role: true },
    });

    if (sasStaff.role !== role) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! Database Role is not of PERSONNEL!",
      });
    }

    const normalizedType = queueType?.toUpperCase();
    if (!["REGULAR", "PRIORITY"].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid queue type. Must be REGULAR or PRIORITY.",
      });
    }

    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );

    return await prisma.$transaction(async (tx) => {
      const session = await tx.queueSession.findFirst({
        where: {
          sessionDate: todayUTC,
          isActive: true,
          isServing: true,
          isAcceptingNew: true,
        },
        orderBy: { sessionNumber: "desc" },
      });

      if (!session) {
        return res.status(203).json({
          success: false,
          messsage: "There is no active session found!",
          activeSessionFound: false,
          noActiveQueue: true,
        });
      }

      const lastQueue = await tx.queue.findFirst({
        where: {
          sessionId: session.sessionId,
          queueType: normalizedType,
          isActive: true,
        },
        orderBy: { sequenceNumber: "desc" },
      });

      if (!lastQueue) {
        return res.status(203).json({
          success: false,
          message: `No ${normalizedType} queues found to reset.`,
          noActiveQueue: true,
        });
        // throw new Error(`No ${normalizedType} queues found to reset.`);
      }

      // ===========================================================
      // 🧠 Store the SEQUENCE NUMBER where reset happened
      // ===========================================================
      let resetInfo = req.app.get("manualResetTriggered") || {};

      if (!resetInfo[normalizedType]) {
        resetInfo[normalizedType] = {
          resetAtSequence: null, // NEW: track where reset happened
          iteration: 0,
          timestamp: null,
        };
      }

      const newIteration = resetInfo[normalizedType].iteration + 1;

      // Get current count from session
      const counterField =
        normalizedType === "REGULAR" ? "regularCount" : "priorityCount";
      const currentSequence =
        normalizedType === "REGULAR"
          ? session.regularCount
          : session.priorityCount;

      resetInfo = {
        ...resetInfo,
        [normalizedType]: {
          resetAtSequence: currentSequence, // Remember THIS sequence number
          iteration: newIteration,
          timestamp: Date.now(),
        },
      };

      req.app.set("manualResetTriggered", resetInfo);

      // ===========================================================
      // 🔔 Notify all clients via Socket.IO
      // ===========================================================
      io.emit("QUEUE_RESET", {
        queueType: normalizedType,
        sessionId: session.sessionId,
        iteration: newIteration,
        triggeredBy: sasStaffId,
        resetAtSequence: currentSequence,
        message: `${normalizedType} queue manually reset (iteration ${newIteration}).`,
      });

      return res.status(200).json({
        success: true,
        message: `${normalizedType} queue manually reset successfully.`,
        resetInfo: {
          queueType: normalizedType,
          newIteration,
          nextDisplayNumber: 1,
          autoWrapLimit: 500,
          resetAtSequence: currentSequence,
          triggeredAt: new Date().toISOString(),
        },
        activeSessionFound: true,
        noActiveQueue: false,
      });
    });
  } catch (error) {
    console.error("❌ Manual reset error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset queue.",
    });
  }
};

export const manualResetSession = async (req, res) => {
  try {
    const { sasStaffId, role } = req.user;
    const io = req.app.get("io");

    if (!sasStaffId || !role) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! No Id and Role provided!",
      });
    }

    if (role !== Role.PERSONNEL) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! Role is not of PERSONNEL!",
      });
    }

    const sasStaff = await prisma.sasStaff.findUnique({
      where: { sasStaffId },
      select: { role: true },
    });

    if (sasStaff.role !== role) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! Database Role is not of PERSONNEL!",
      });
    }
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );

    return await prisma.$transaction(async (tx) => {
      const session = await tx.queueSession.findFirst({
        where: {
          sessionDate: todayUTC,
          isActive: true,
          isServing: true,
          isAcceptingNew: true,
        },
        orderBy: { sessionNumber: "desc" },
        select: {
          sessionId: true,
          sessionNumber: true,
        },
      });

      if (!session) {
        return res.status(203).json({
          success: false,
          messsage: "There is no active session found!",
          activeSessionFound: false,
        });
      }
      const nextSessionNo = session.sessionNumber + 1;
      await tx.queueSession.update({
        where: {
          sessionId: session.sessionId,
        },
        data: {
          isAcceptingNew: false,
        },
      });

      const newSession = await tx.queueSession.create({
        data: {
          sessionDate: todayUTC,
          sessionNumber: nextSessionNo || 1,
          maxQueueNo: 500,
          currentQueueCount: 0,
          regularCount: 0,
          priorityCount: 0,
          isAcceptingNew: true,
          isServing: true,
          isActive: true,
        },
      });

      let dataClause;

      if (newSession) {
        dataClause = {
          message: "Queue Session resetted successfully!",
          session: {
            sessionId: newSession.sessionId,
            sessionNumber: newSession.sessionNumber,
            maxQueueNo: newSession.maxQueueNo,
            currentQueueCount: newSession.currentQueueCount,
            regularCount: newSession.regularCount,
            priorityCount: newSession.priorityCount,
            isAcceptingNew: newSession.isAcceptingNew,
            isServing: newSession.isServing,
            isActive: newSession.isActive,
          },
          activeSessionFound: true,
        };
      } else {
        dataClause = {
          message: "An error occurred while resetting queue session!",
        };
      }

      return res.status(200).json({
        success: true,
        data: dataClause,
      });
    });
  } catch (error) {
    console.error("Manual reset error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!" || error.message,
    });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { sasStaffId, role } = req.user;
    const accountData = req.body.accountData || req.body;
    const { username, firstName, lastName, middleName, email, newPassword } =
      accountData;

    if (!sasStaffId || !role) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! No Id and Role provided!",
      });
    }

    if (role !== Role.PERSONNEL) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! Role is not of PERSONNEL!",
      });
    }

    const sasStaff = await prisma.sasStaff.findUnique({
      where: { sasStaffId },
      select: { role: true },
    });

    if (sasStaff.role !== role) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized Operation! Database Role is not of PERSONNEL!",
      });
    }

    const account = await prisma.sasStaff.findUnique({
      where: { sasStaffId },
      select: {
        sasStaffId: true,
        username: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        isActive: true,
        role: true,
      },
    });

    if (!account || !account.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found or inactive." });
    }

    // Only hash password if it's provided
    let hashedPassword = undefined;
    if (newPassword && newPassword.trim() !== "") {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    // Check for duplicate username
    if (username && username !== account.username) {
      const existingUsername = await prisma.sasStaff.findFirst({
        where: {
          username,
          sasStaffId: { not: sasStaffId },
        },
        select: { sasStaffId: true },
      });
      if (existingUsername) {
        return res
          .status(409)
          .json({ success: false, message: "Username already in use." });
      }
    }

    // Check for duplicate email
    if (email && email !== account.email) {
      const existingEmail = await prisma.sasStaff.findFirst({
        where: {
          email,
          sasStaffId: { not: sasStaffId },
        },
        select: { sasStaffId: true },
      });
      if (existingEmail) {
        return res
          .status(409)
          .json({ success: false, message: "Email already in use." });
      }
    }
    // Build update object with only changed fields
    const updateData = {};

    if (username && username !== account.username) {
      updateData.username = username;
      console.log("Username changed:", account.username, "→", username);
    }

    if (firstName && firstName !== account.firstName) {
      updateData.firstName = firstName;
      console.log("FirstName changed:", account.firstName, "→", firstName);
    }

    if (lastName && lastName !== account.lastName) {
      updateData.lastName = lastName;
      console.log("LastName changed:", account.lastName, "→", lastName);
    }

    // Fixed middleName handling
    if (typeof middleName !== "undefined") {
      const newMiddleName = middleName || null;
      const currentMiddleName = account.middleName || null;

      console.log("🔍 MiddleName comparison:", {
        received: middleName,
        normalized: newMiddleName,
        current: currentMiddleName,
        areEqual: newMiddleName === currentMiddleName,
      });

      if (newMiddleName !== currentMiddleName) {
        updateData.middleName = newMiddleName;
        console.log(
          "MiddleName changed:",
          currentMiddleName,
          "→",
          newMiddleName
        );
      }
    }

    if (email && email !== account.email) {
      updateData.email = email;
      console.log("Email changed:", account.email, "→", email);
    }

    if (hashedPassword) {
      updateData.hashedPassword = hashedPassword;
      console.log("Password changed");
    }

    console.log("📦 Update data object:", updateData);

    if (Object.keys(updateData).length === 0) {
      console.log("No changes detected - all values match database");
      return res.status(203).json({
        success: true,
        hasChanges: false,
        message: "No changes",
      });
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    const updated = await prisma.sasStaff.update({
      where: { sasStaffId },
      data: updateData,
      select: {
        sasStaffId: true,
        username: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    console.log("✅ Update successful:", updated);

    return res.status(200).json({
      success: true,
      message: "Account updated successfully.",
      data: {
        updated: updated,
      },
    });
  } catch (error) {
    console.error("Error updating personnel profile:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

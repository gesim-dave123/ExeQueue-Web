import { Role, Status } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
import { getShiftTag } from "../../utils/shiftTag.js";
import {
  QueueActions,
  QueueEvents,
  WindowEvents,
} from "../services/enums/SocketEvents.js";
// import { sendDashboardUpdate } from "./sse.controllers.js";
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

    io.emit(WindowEvents.WINDOW_ASSIGNED, {
      windowId,
      staff: result.staff,
      message: `Window ${windowId} assigned to ${result.staff.firstName}`,
    });

    return res.status(201).json({
      success: true,
      message: `Successfully assigned to ${result.serviceWindow.windowName}`,
      assignment: result,
    });
  } catch (error) {
    console.error("❌ Error assigning staff:", error);

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
      // Find the active assignment first
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
        throw new Error("No active window assignment found");
      }

      // 🆕 Check if there's a current queue being served by this window
      const currentQueue = await tx.queue.findFirst({
        where: {
          windowId: activeAssignment.windowId,
          queueStatus: Status.IN_SERVICE,
          // servedAt: null, // Not yet completed
        },
      });

      // 🆕 If there's a current queue, reset it back to WAITING
      if (currentQueue) {
        await tx.queue.update({
          where: { queueId: currentQueue.queueId },
          data: {
            queueStatus: Status.WAITING,
            windowId: null,
            servedByStaff: null,
            calledAt: null,
          },
        });

        // ✅ Get complete queue data with requests for perfect sync
        const queueWithRequests = await tx.queue.findUnique({
          where: { queueId: currentQueue.queueId },
          include: {
            requests: {
              where: { isActive: true },
              include: {
                requestType: {
                  select: {
                    requestTypeId: true,
                    requestName: true,
                  },
                },
              },
            },
          },
        });

        io.to(QueueEvents.REFETCH).emit(QueueActions.QUEUE_RESET, {
          // ✅ Core queue identification & formatting
          queueId: queueWithRequests.queueId,
          queueType: queueWithRequests.queueType, // PRIORITY or REGULAR
          queueNumber: queueWithRequests.queueNumber, // For queueNo formatting
          queueStatus: Status.WAITING,
          windowId: null,
          studentFullName: queueWithRequests.studentFullName,
          studentId: queueWithRequests.studentId,
          courseCode: queueWithRequests.courseCode,
          yearLevel: queueWithRequests.yearLevel,
          createdAt: queueWithRequests.createdAt,
          referenceNumber: queueWithRequests.referenceNumber,
          previousWindowId: activeAssignment.windowId,
          reason: "Window released",
          requests: queueWithRequests.requests.map((req) => ({
            requestId: req.requestId,
            queueId: queueWithRequests.queueId,
            requestTypeId: req.requestTypeId,
            requestStatus: req.requestStatus,
            isActive: req.isActive,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt,
            requestType: {
              requestTypeId: req.requestType.requestTypeId,
              requestName: req.requestType.requestName,
            },
          })),

          timestamp: Date.now(),
        });
      }

      // Release the window assignment
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
    // io.to(`window:${result.windowId}`).emit(WindowEvents.RELEASE_WINDOW, data);
    io.to(`window:${result.windowId}`).emit(WindowEvents.RELEASE_WINDOW, {
      windowId: result.windowId,
      previousWindowId: result.windowId,
      sasStaffId,
      shift,
      resetQueue: result.resetQueue
        ? {
            queueId: result.resetQueue.queueId,
            queueNo: result.resetQueue.queueNo,
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
            queueNo: result.resetQueue.queueNo,
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
            queueNo: result.resetQueue.queueNo,
          }
        : null,
      message: `${result.windowName} was released.`,
    });

    return res.status(200).json({
      success: true,
      message: result.resetQueue
        ? `Window released and queue ${result.resetQueue.queueNo} reset to waiting`
        : "Window released successfully",
      resetQueue: result.resetQueue,
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
    console.log(shift);
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
    console.log(assignedIds);
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
    const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

    const assignment = await prisma.windowAssignment.findFirst({
      where: {
        sasStaffId,
        windowId,
        shiftTag: shift,
        releasedAt: null,
      },
      select: { lastHeartbeat: true },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "No active assignment found",
      });
    }

    const now = DateAndTimeFormatter.nowInTimeZone("Asia/Manila");
    const timeSinceLastHeartbeat =
      now.getTime() - new Date(assignment.lastHeartbeat).getTime();

    // Only update if heartbeat is older than interval
    if (timeSinceLastHeartbeat < HEARTBEAT_INTERVAL) {
      return res.status(200).json({
        success: true,
        message: "Heartbeat still fresh, skipped update",
        skipped: true,
      });
    }

    // Update only if needed
    await prisma.windowAssignment.updateMany({
      where: {
        sasStaffId,
        windowId,
        shiftTag: shift,
        releasedAt: null,
      },
      data: {
        lastHeartbeat: now,
      },
    });

    // Only emit socket event when actually updating
    io.emit(WindowEvents.HEARTBEAT_UPDATE, {
      windowId,
      sasStaffId,
      timestamp: now,
    });

    return res.status(200).json({
      success: true,
      message: "Heartbeat updated",
      updated: true,
    });
  } catch (error) {
    console.error("❌ Error updating heartbeat:", error);
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
      !email?.trim() ||
      !password
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirmation do not match.",
      });
    }

    // Check uniqueness for username and email (regardless of isActive)
    const existing = await prisma.sasStaff.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      select: { sasStaffId: true, username: true, email: true },
    });

    if (existing) {
      if (existing.username === username) {
        return res
          .status(409)
          .json({ success: false, message: "Username already exists." });
      }
      return res
        .status(409)
        .json({ success: false, message: "Email already exists." });
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
      },
    });

    if (!account || !account.isActive) {
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
        return res
          .status(400)
          .json({ success: false, message: "Password does not match." });
      }
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    if (username && username !== account.username) {
      const existingUsername = await prisma.sasStaff.findFirst({
        where: { username },
        select: { sasStaffId: true },
      });
      if (existingUsername) {
        return res
          .status(409)
          .json({ success: false, message: "Username already in use." });
      }
    }
    if (email && email !== account.email) {
      const existingEmail = await prisma.sasStaff.findFirst({
        where: { email },
        select: { sasStaffId: true },
      });
      if (existingEmail) {
        return res
          .status(409)
          .json({ success: false, message: "Email already in use." });
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
      createdBy: account.createdBy ?? updaterId ?? null, // keep createdBy if any; optional
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

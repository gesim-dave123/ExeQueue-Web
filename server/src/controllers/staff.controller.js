import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
import { getShiftTag } from "../../utils/shiftTag.js";
import { WindowEvents } from "../services/enums/SocketEvents.js";

const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
  new Date(),
  "Asia/Manila"
);

export const assignServiceWindow = async (req, res) => {
  const { sasStaffId } = req.user;
  const { windowId } = req.body;
  const io = req.app.get("io");
  const shift = getShiftTag();

  try {
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

      // Step 2: Release any previous active assignment by this staff
      // await tx.windowAssignment.updateMany({
      //   where: { sasStaffId, shiftTag: shift, releasedAt: null },
      //   data: { releasedAt: new Date() },
      // });

      // Step 3: Assign new window
      const assignment = await tx.windowAssignment.create({
        data: { sasStaffId, windowId, shiftTag: shift },
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

    const released = await prisma.windowAssignment.updateMany({
      where: { sasStaffId, shiftTag: shift, releasedAt: null },
      data: { releasedAt: new Date() },
    });

    if (released.count === 0) {
      return res.status(404).json({
        success: false,
        message: "No active window assignment found",
      });
    }

    // ✅ Notify others in real time
    io.emit(WindowEvents.RELEASE_WINDOW, { sasStaffId, shift });

    return res.status(200).json({
      success: true,
      message: "Window released successfully",
    });
  } catch (error) {
    console.error("❌ Error releasing window:", error);
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

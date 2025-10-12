import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
import { getShiftTag } from "../../utils/shiftTag.js";

const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
  new Date(),
  "Asia/Manila"
);

export const assignServiceWindow = async (req, res) => {
  try {
    const { sasStaffId } = req.user;
    const { windowId } = req.body;

    if (!sasStaffId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized! No Staff Id provided!",
      });
    }

    if (!windowId || windowId === 0) {
      return res.status(400).json({
        success: false,
        message: "Window ID is required",
      });
    }

    const shift = getShiftTag();

    // ✅ CHECK: Is window already assigned in this shift?
    const existingAssignment = await prisma.windowAssignment.findFirst({
      where: {
        windowId: windowId,
        shiftTag: shift,
        releasedAt: null,
      },
      include: {
        staff: {
          select: {
            sasStaffId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // If someone else has it, reject
    if (existingAssignment && existingAssignment.sasStaffId !== sasStaffId) {
      return res.status(409).json({
        success: false,
        message: `Window ${windowId} is currently assigned to ${existingAssignment.staff.firstName} ${existingAssignment.staff.lastName}`,
        occupiedBy: existingAssignment.staff,
      });
    }

    // If this staff already has it, return existing assignment
    if (existingAssignment && existingAssignment.sasStaffId === sasStaffId) {
      return res.status(200).json({
        success: true,
        message: "You are already assigned to this window",
        assignment: existingAssignment,
        isExisting: true,
      });
    }

    // Release any previous window this staff had
    await prisma.windowAssignment.updateMany({
      where: {
        sasStaffId: sasStaffId,
        shiftTag: shift,
        releasedAt: null,
      },
      data: {
        releasedAt: new Date(),
      },
    });

    // Create new assignment
    const assignment = await prisma.windowAssignment.create({
      data: {
        sasStaffId: sasStaffId,
        windowId: windowId,
        shiftTag: shift,
      },
      include: {
        staff: {
          select: {
            sasStaffId: true,
            firstName: true,
            lastName: true,
          },
        },
        window: true,
      },
    });

    if (!assignment) {
      return res.status(500).json({
        success: false,
        message: "Error occurred when assigning staff",
      });
    }

    return res.status(201).json({
      success: true,
      message: `Successfully assigned to ${assignment.window.windowName}`,
      assignment: assignment,
    });
  } catch (error) {
    console.error("❌ Error assigning staff:", error);
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

    const updated = await prisma.windowAssignment.updateMany({
      where: {
        sasStaffId: sasStaffId,
        shiftTag: shift,
        releasedAt: null,
      },
      data: {
        releasedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
      },
    });

    if (updated.count === 0) {
      return res.status(404).json({
        success: false,
        message: "No active window assignment found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Window released successfully",
      releasedCount: updated.count,
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
        window: true,
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
        // releasedAt: null,
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

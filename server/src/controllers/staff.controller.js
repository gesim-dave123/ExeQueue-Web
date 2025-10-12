import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
import { getShiftTag } from "../../utils/shiftTag.js";

const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
  new Date(),
  "Asia/Manila"
);

export const assignServiceWindow = async (req, res) => {
  try {
    const { sasStaffId, role } = req.user;
    const { windowId } = req.body;

    if (!sasStaffId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized!, No Staff Id provided!",
      });
    }

    if (!windowId || windowId === 0) {
      return res.status(200).json({
        success: false,
        message: "Service Window is null",
      });
    }

    const shift = getShiftTag();
    const assign = await prisma.windowAssignment.create({
      data: {
        sasStaffId: sasStaffId,
        windowId: windowId,
        shiftTag: shift,
      },
      select: {
        assignmentId: true,
        staff: true,
      },
    });
    if (!assign) {
      return res.status(403).json({
        success: false,
        message: "Error occured when assigning Staff",
      });
    }
    return res.status(201).json({
      success: true,
      message: "Staff Successfully assigned!",
      assignment: assign,
    });
  } catch (error) {
    console.error("Error assigning staff:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};
export const checkAvailableWindow = async (req, res) => {
  try {
    const { windowIds } = req.body;

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
      select:{
        windowId: true
      }
    });

    const assignedIds = assignedWindows.map((a) => a.windowId);
    console.log(assignedIds)
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

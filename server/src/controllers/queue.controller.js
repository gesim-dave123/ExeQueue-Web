import { Queue_Type, Role, Status } from "@prisma/client";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
import { QueueActions } from "../services/enums/SocketEvents.js";

const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
  new Date(),
  "Asia/Manila"
);

export const viewQueues = async (req, res) => {
  try {
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );
    const {
      query: { filter, value },
    } = req;

    // Build where clause dynamically
    let whereClause = {
      queueDate: todayUTC,
      isActive: true,
      queueStatus: Status.WAITING,
    };

    // Add filter conditions to the database query if provided
    if (filter && value) {
      if (filter === "studentId") {
        whereClause.schoolId = { equals: value, mode: "insensitive" };
      } else if (filter === "fullName") {
        whereClause.studentFullName = { contains: value, mode: "insensitive" };
      } else if (filter === "referenceNumber") {
        whereClause.referenceNumber = { equals: value, mode: "insensitive" };
      } else if (filter === "queueType") {
        if (
          [Queue_Type.PRIORITY, Queue_Type.REGULAR].toString().includes(value)
        ) {
          whereClause.queueType =
            value.toUpperCase() === "REGULAR"
              ? Queue_Type.REGULAR
              : Queue_Type.PRIORITY;
        }
      }
    }

    const queues = await prisma.queue.findMany({
      where: whereClause,
      orderBy: [{ queueSessionId: "desc" }, { queueNumber: "desc" }],
      select: {
        queueId: true,
        studentFullName: true,
        schoolId: true,
        course: {
          select: {
            courseCode: true,
          },
        },
        yearLevel: true,
        queueSessionId: true,
        queueStatus: true,
        queueDate: true,
        referenceNumber: true,
        queueType: true,
        queueNumber: true,
        createdAt: true,
        isActive: true,
        requests: {
          select: {
            requestId: true,
            requestStatus: true,
            requestType: {
              select: {
                requestName: true,
                description: true,
              },
            },
          },
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!queues || queues.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No queues found for today",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Queues fetched successfully!",
      queue: queues,
    });
  } catch (error) {
    console.error("Error fetching queue:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch queue",
    });
  }
};

export const determineNextQueue = async (req, res) => {
  try {
    const { sasStaffId, role, serviceWindowId } = req.user;
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );
    if (!serviceWindowId || serviceWindowId === null) {
      return res.status(403).json({
        success: false,
        message:
          "No window assigned detected! Please assign which window you are using first.",
      });
    }
    // Get window rules
    const windowRule = await prisma.serviceWindow.findUnique({
      where: { windowId: serviceWindowId, isActive: true },
      select: { canServePriority: true, canServeRegular: true },
    });

    if (!windowRule) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: No valid window rule found!",
      });
    }

    let allowedTypes = [];
    if (windowRule.canServePriority) allowedTypes.push(Queue_Type.PRIORITY);
    if (windowRule.canServeRegular) allowedTypes.push(Queue_Type.REGULAR);

    if (allowedTypes.length === 0) {
      return res.status(403).json({
        success: false,
        message: "This window is not allowed to serve any queue types.",
      });
    }
    console.log("Allowed Queue Types for this window:", allowedTypes);
    // Use transaction with retry logic for concurrency
    const result = await prisma.$transaction(
      async (tx) => {
        // Find and immediately update in one atomic operation
        const nextQueue = await tx.queue.findFirst({
          where: {
            queueDate: todayUTC,
            queueType: { in: allowedTypes },
            queueStatus: Status.WAITING,
            windowId: null, // Only unassigned queues
          },
          // include:{
          //   requests: {
          //     select: {
          //       requestId: true,
          //       requestStatus: true,
          //       requestType: {
          //         select: {
          //           requestName: true,
          //           description: true
          //         }
          //       }
          //     },
          //     where: {
          //       isActive: true
          //     }
          //   },
          // },
          orderBy: [
            { queueType: "desc" }, // PRIORITY first
            { queueNumber: "asc" },
          ],
        });

        if (!nextQueue) {
          return res.status(404).json({
            success: false,
            message: "No waiting queue available for this window.",
          });
        }

        // Atomic update with additional safety check
        const updatedQueue = await tx.queue.updateMany({
          where: {
            queueId: nextQueue.queueId,
            windowId: null, // Extra safety: only update if still unassigned
            queueStatus: Status.WAITING, // Extra safety: only update if still waiting
          },
          data: {
            windowId: serviceWindowId,
            queueStatus: Status.IN_SERVICE, // Update status too!
          },
        });

        // Check if update actually happened
        if (updatedQueue.count === 0) {
          throw new Error("QUEUE_ALREADY_ASSIGNED");
        }

        // Get the updated queue with full details
        const finalQueue = await tx.queue.findUnique({
          where: { queueId: nextQueue.queueId },
          include: {
            requests: {
              include: { requestType: { select: { requestName: true } } },
            },
          },
        });

        // Log the action
        // await tx.transactionHistory.create({
        //   data: {
        //     queueId: nextQueue.queueId,
        //     performedById: sasStaffId,
        //     performedByRole: role,
        //     transactionStatus: Status.IN_SERVICE
        //   }
        // });

        return finalQueue;
      },
      {
        // Transaction options for better concurrency handling
        maxWait: 5000, // Maximum time to wait for a transaction slot
        timeout: 10000, // Maximum time for the transaction to complete
      }
    );

    return res.status(200).json({
      success: true,
      message: "Next queue assigned to this window.",
      nextQueue: result,
    });
  } catch (error) {
    console.error("Error in Getting Next Queue Number:", error);

    // Handle specific concurrency errors
    if (error.message === "NO_QUEUE_AVAILABLE") {
      return res.status(404).json({
        success: false,
        message: "No waiting queue available for this window.",
      });
    }

    if (error.message === "QUEUE_ALREADY_ASSIGNED") {
      return res.status(409).json({
        success: false,
        message: "Queue was assigned to another window. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

export const getQueueList = async (req, res) => {
  try {
    // const {sasStaffId, role, serviceWindowId} = req.user;
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );

    const regularQueue = await prisma.queue.findMany({
      where: {
        queueDate: todayUTC,
        queueStatus: { in: [Status.WAITING, Status.IN_SERVICE] },
        queueType: Queue_Type.REGULAR,
        isActive: true,
      },
      orderBy: [{ queueType: "desc" }, { queueNumber: "asc" }],
    });
    const priorityQueue = await prisma.queue.findMany({
      where: {
        queueDate: todayUTC,
        queueStatus: { in: [Status.WAITING, Status.IN_SERVICE] },
        queueType: Queue_Type.PRIORITY,
        isActive: true,
      },
      orderBy: [{ queueType: "desc" }, { queueNumber: "asc" }],
    });

    const queues = [
      {
        regularQueue,
        priorityQueue,
      },
    ];
    if (!queues) {
      return res.status(400).json({
        success: false,
        message: "Bad Request, Error in queue list",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        queues.length === 0
          ? "There are no queues currently in the system, please wait a moment"
          : "Queues successfully retrieved!",
      queues: queues,
    });
  } catch (error) {
    console.error("Error in getting queue list: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

export const getQueueListByStatus = async (req, res) => {
  try {
    const { sasStaffId, role } = req.user;
    const { status } = req.query;

    if (!sasStaffId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access, no Staff ID Provided!",
      });
    }
    if (![Role.PERSONNEL, Role.WORKING_SCHOLAR].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access, Invalid Role!",
      });
    }

    if (
      ![
        Status.WAITING,
        Status.CANCELLED,
        Status.COMPLETED,
        Status.DEFERRED,
        Status.IN_SERVICE,
      ]
        .toString()
        .includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Bad Request, Invalid Queue Status!",
      });
    }
    const queueList = await prisma.queue.findMany({
      where: {
        isActive: true,
        session: {
          sessionDate: todayUTC,
          isServing: true,
          isActive: true,
        },
        queueStatus: status,
      },
      include: {
        requests: {
          include: {
            requestType: true,
          },
        },
      },
      orderBy: [
        {
          session: {
            sessionNumber: "asc",
          },
        },
        { sequenceNumber: "asc" },
      ],
    });

    // Response handling
    if (queueList.length === 0) {
      return res.status(200).json({
        // 200 for successful empty result
        success: true,
        message: `There are no current ${status} queues active today!`,
        queueList: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: `Current Queue List that are ${status}`,
      queueList: queueList,
    });
  } catch (error) {
    console.error("An error occured in get queue list contoller!", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

export const getRequest = async (req, res) => {
  try {
    const { sasStaffId, role } = req.user;
    const { queueType } = req.body;
    if (!serviceWindowId || serviceWindowId === null) {
      return res.status(403).json({
        success: false,
        message:
          "No window assigned detected! Please assign which window you are using first.",
      });
    }
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );
  } catch (error) {}
};

export const setRequestStatus = async (req, res) => {
  try {
    const { sasStaffId, role } = req.user;
    const { requestId, requestStatus, status } = req.body;
    if (!serviceWindowId || serviceWindowId === null) {
      return res.status(403).json({
        success: false,
        message:
          "No window assigned detected! Please assign which window you are using first.",
      });
    }

    if (
      ![
        Status.STALLED,
        Status.COMPLETED,
        Status.CANCELLED,
        Status.SKIPPED,
      ].includes(status)
    ) {
      return res.status(400).json(
        {
          success: false,
          message: "Invalid status update. Please provide a valid status.",
        }``
      );
    }

    const requestTransaction = await prisma.$transaction(async (tx) => {
      const request = await tx.request.update({
        where: {
          requestId: requestId,
          requestStatus: { not: Status.COMPLETED },
          isActive: true,
        },
        data: {},
      });
    });
  } catch (error) {}
};
export const createQueueSession = async (req, res) => {
  // const { sessionName } = req.body;

  try {
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );

    const result = await prisma.$transaction(async (tx) => {
      await tx.queueSession.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      const lastSession = await tx.queueSession.findFirst({
        where: { sessionDate: todayUTC },
        orderBy: { sessionNo: "desc" },
      });

      const nextSessionNo = lastSession ? lastSession.sessionNo + 1 : 1;
      const newSession = await tx.queueSession.create({
        data: {
          sessionNo: nextSessionNo,
          sessionDate: todayUTC,
          isActive: true,
        },
      });

      await tx.$executeRawUnsafe(
        `ALTER SEQUENCE queue_regular_seq RESTART WITH 1`
      );
      await tx.$executeRawUnsafe(
        `ALTER SEQUENCE queue_priority_seq RESTART WITH 1`
      );

      return newSession;
    });
    console.log("✅ New queue session created:", result);
    return res.status(201).json({
      success: true,
      message:
        "New queue session created, previous session deactivated, and sequences reset",
      session: result,
    });
  } catch (error) {
    console.error("❌ Error creating queue session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create queue session",
      error: error.message,
    });
  }
};

export const markQueueStatus = async (req, res) => {
  try {
    const { sasStaffId, role } = req.user;
    const { queueId, newStatus } = req.body;

    if (!queueId || !newStatus) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required parameters." });
    }

    if (
      ![
        Status.COMPLETED,
        Status.CANCELLED,
        Status.STALLED,
        Status.SKIPPED,
      ].includes(newStatus)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status provided." });
    }

    const existingQueue = await prisma.queue.findUnique({
      where: { queueId },
      include: { requests: true },
    });

    if (!existingQueue) {
      return res
        .status(404)
        .json({ success: false, message: "Queue not found." });
    }

    let updatedQueue;

    await prisma.$transaction(async (tx) => {
      if (newStatus === Status.SKIPPED) {
        updatedQueue = await tx.queue.update({
          where: { queueId },
          data: {
            queueStatus: Status.SKIPPED,
            calledAt: new Date(),
            updatedAt: new Date(),
          },
        });

        await tx.transactionHistory.create({
          data: {
            queueId,
            performedById: sasStaffId,
            performedByRole: role,
            transactionStatus: Status.SKIPPED,
          },
        });

        return;
      }

      // For STALLED → COMPLETED recovery
      if (
        existingQueue.queueStatus === Status.STALLED &&
        newStatus === Status.COMPLETED
      ) {
        updatedQueue = await tx.queue.update({
          where: { queueId },
          data: {
            queueStatus: Status.COMPLETED,
            completedAt: new Date(),
          },
        });
      } else {
        updatedQueue = await tx.queue.update({
          where: { queueId },
          data: {
            queueStatus: newStatus,
            completedAt: newStatus === Status.COMPLETED ? new Date() : null,
          },
        });
      }
      await tx.request.updateMany({
        where: { queueId },
        data: {
          requestStatus: newStatus,
          processedBy: sasStaffId,
          processedAt: new Date(),
        },
      });

      await tx.transactionHistory.create({
        data: {
          queueId,
          performedById: sasStaffId,
          performedByRole: role,
          transactionStatus: newStatus,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: `Queue marked as ${newStatus}.`,
      queue: updatedQueue,
    });
  } catch (error) {
    console.error("Error updating queue status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//Check if a skipped queue returned within 1 hour.
export const restoreSkippedQueue = async (req, res) => {
  try {
    const { queueId } = req.body;
    const queue = await prisma.queue.findUnique({ where: { queueId } });

    if (!queue) {
      return res
        .status(404)
        .json({ success: false, message: "Queue not found." });
    }

    if (queue.queueStatus !== Status.SKIPPED) {
      return res
        .status(400)
        .json({ success: false, message: "Queue is not marked as skipped." });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (queue.calledAt < oneHourAgo) {
      return res.status(400).json({
        success: false,
        message: "Cannot restore skipped queue. More than 1 hour has passed.",
      });
    }

    const restored = await prisma.queue.update({
      where: { queueId },
      data: {
        queueStatus: Status.IN_SERVICE,
        updatedAt: new Date(),
      },
    });

    await prisma.transactionHistory.create({
      data: {
        queueId,
        transactionStatus: Status.IN_SERVICE,
        performedById: null,
        performedByRole: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Skipped queue restored to IN_SERVICE.",
      queue: restored,
    });
  } catch (error) {
    console.error("Error restoring skipped queue:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

export const callNextQueue = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { sasStaffId, role } = req.user;
    const windowId = parseInt(req.params.windowId, 10);

    if (isNaN(windowId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid windowId parameter",
      });
    }

    const todayUTC = DateAndTimeFormatter.nowInTimeZone("Asia/Manila");

    const result = await prisma.$transaction(async (tx) => {
      // Get the next available queue

      const nextQueue = await tx.queue.findFirst({
        where: {
          queueStatus: Status.WAITING,
          session: {
            isActive: true,
            isServing: true,
          },
        },
        orderBy: [
          {
            session: {
              sessionNumber: "asc",
            },
          },
          { sequenceNumber: "asc" },
        ],
      });

      if (!nextQueue) return null;

      // Attempt to update it — only if it’s still WAITING
      const updated = await tx.queue.updateMany({
        where: {
          queueId: nextQueue.queueId,
          queueStatus: Status.WAITING, // 👈 prevents double claim
        },
        data: {
          queueStatus: Status.IN_SERVICE,
          windowId,
          servedByStaff: sasStaffId,
          calledAt: new Date(),
        },
      });

      // If updateMany returned 0, someone else already took it
      if (updated.count === 0) return "TAKEN";

      // Return the fully updated queue record
      return await tx.queue.findUnique({
        where: { queueId: nextQueue.queueId },
        include: { requests: { include: { requestType: true } } },
      });
    });

    if (result === null)
      return res
        .status(404)
        .json({ success: false, message: "No queues left." });

    if (result === "TAKEN")
      return res.status(409).json({
        success: false,
        message: "Queue already taken by another window.",
      });

    // Broadcast: remove this queue globally
    io.emit(QueueActions.QUEUE_TAKEN, { queueId: result.queueId });
    io.to(`window:${result.windowId}`).emit(QueueActions.TAKE_QUEUE, result);

    console.log(
      `📣 Window ${windowId} called next queue ${result.referenceNumber}`
    );

    res.status(200).json({
      success: true,
      message: `Now serving ${result.referenceNumber}`,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error in callNextQueue:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

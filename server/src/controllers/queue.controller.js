import { Queue_Type, Role, Status } from "@prisma/client";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
import { QueueActions } from "../services/enums/SocketEvents.js";
import cron from 'node-cron';

const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
  new Date(),
  "Asia/Manila"
);
const isIntegerParam = (val) => /^\d+$/.test(val);

export function startSkippedRequestMonitor() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
  console.log('Running SKIPPED request monitor...');
    
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Find all SKIPPED requests older than 1 hour
      const skippedRequests = await prisma.request.findMany({
        where: {
          requestStatus: Status.SKIPPED,
          updatedAt: {
            lte: oneHourAgo
          },
          isActive: true
        },
        include: {
          queue: true
        }
      });

      console.log(` Found ${skippedRequests.length} SKIPPED requests to cancel`);

      for (const request of skippedRequests) {
        await prisma.$transaction(async (tx) => {
          // Update request to CANCELLED
          await tx.request.update({
            where: { requestId: request.requestId },
            data: {
              requestStatus: Status.CANCELLED,
              processedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
              updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
            }
          });

          //Update transaction history to CANCELLED (finalizes it)
          await tx.transactionHistory.updateMany({
            where: {
              queueId: request.queueId,
              requestId: request.requestId,
              transactionStatus: Status.SKIPPED
            },
            data: {
              transactionStatus: Status.CANCELLED,
              createdAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
            }
          });

         // console.log(`Auto-cancelled SKIPPED request ${request.requestId} (> 1 hour)`);
        });
      }
    } catch (error) {
      console.error('Error in SKIPPED request monitor:', error);
    }
  });

 // console.log('SKIPPED request monitor started (runs every 15 minutes)');
}

export const manuallyFinalizeStalledRequests = async (req, res) => {
  try {
    const todayStart = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );
    
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const stalledRequests = await prisma.request.findMany({
      where: {
        requestStatus: Status.STALLED,
        updatedAt: {
          gte: todayStart,
          lte: todayEnd
        },
        isActive: true
      },
      include: {
        queue: true
      }
    });

    let finalized = 0;

    for (const request of stalledRequests) {
      const existingTransaction = await prisma.transactionHistory.findFirst({
        where: {
          queueId: request.queueId,
          requestId: request.requestId,
          transactionStatus: Status.STALLED
        }
      });

      if (!existingTransaction) {
        await prisma.transactionHistory.create({
          data: {
            queueId: request.queueId,
            requestId: request.requestId,
            performedById: request.processedBy,
            performedByRole: 'SYSTEM',
            transactionStatus: Status.STALLED,
            createdAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
          }
        });
        finalized++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Finalized ${finalized} STALLED requests`,
      totalFound: stalledRequests.length,
      finalized
    });

  } catch (error) {
    console.error('Error in manual STALLED finalization:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const manuallyCancelSkippedRequests = async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const skippedRequests = await prisma.request.findMany({
      where: {
        requestStatus: Status.SKIPPED,
        updatedAt: {
          lte: oneHourAgo
        },
        isActive: true
      },
      include: {
        queue: true
      }
    });

    let cancelled = 0;

    for (const request of skippedRequests) {
      await prisma.$transaction(async (tx) => {
        await tx.request.update({
          where: { requestId: request.requestId },
          data: {
            requestStatus: Status.CANCELLED,
            processedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
            updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
          }
        });

        await tx.transactionHistory.updateMany({
          where: {
            queueId: request.queueId,
            requestId: request.requestId,
            transactionStatus: Status.SKIPPED
          },
          data: {
            transactionStatus: Status.CANCELLED,
            createdAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
          }
        });

        cancelled++;
      });
    }

    return res.status(200).json({
      success: true,
      message: `Cancelled ${cancelled} SKIPPED requests (> 1 hour)`,
      totalFound: skippedRequests.length,
      cancelled
    });

  } catch (error) {
    console.error('Error in manual SKIPPED cancellation:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export function startStalledRequestFinalizer() {
  // Run daily at 11:59 PM Manila time
  cron.schedule('59 23 * * *', async () => {
    console.log('Running end-of-day STALLED request finalizer...');
    
    try {
      const todayStart = DateAndTimeFormatter.startOfDayInTimeZone(
        new Date(),
        "Asia/Manila"
      );
      
      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);

      // Find all STALLED requests that weren't updated today
      const stalledRequests = await prisma.request.findMany({
        where: {
          requestStatus: Status.STALLED,
          updatedAt: {
            gte: todayStart,
            lte: todayEnd
          },
          isActive: true
        },
        include: {
          queue: true
        }
      });

      console.log(`Found ${stalledRequests.length} STALLED requests to finalize`);

      for (const request of stalledRequests) {
        // Check if transaction history already exists
        const existingTransaction = await prisma.transactionHistory.findFirst({
          where: {
            queueId: request.queueId,
            requestId: request.requestId,
            transactionStatus: Status.STALLED
          }
        });

        // Only create transaction if it doesn't exist yet
        if (!existingTransaction) {
          await prisma.transactionHistory.create({
            data: {
              queueId: request.queueId,
              requestId: request.requestId,
              performedById: request.processedBy,
              performedByRole: 'SYSTEM', // Automated by system
              transactionStatus: Status.STALLED,
              createdAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
            }
          });

          console.log(`Finalized STALLED request ${request.requestId} (end of day)`);
        }
      }
    } catch (error) {
      console.error('Error in STALLED request finalizer:', error);
    }
  });

  console.log('STALLED request finalizer started (runs daily at 11:59 PM)');
}


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
    const { status, windowId: windowIdStr, requestStatus } = req.query;

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
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Bad Request, Invalid Queue Status!",
      });
    }
    const whereClause = {
      isActive: true,
      session: {
        sessionDate: todayUTC,
        isServing: true,
        isActive: true,
      },
      queueStatus: status,
    };

    if (windowIdStr) {
      if (!isIntegerParam(windowIdStr)) {
        return res.status(400).json({
          success: false,
          message: "Invalid param. 'windowId' must be integers.",
        });
      }

      const windowId = Number(windowIdStr);
      if (isNaN(windowId)) {
        return res.status(400).json({
          success: false,
          message:
            "An error occurred. Expecting a number but received a string. (windowId)",
        });
      }
      whereClause.windowId = windowId;
    }
    const includeClause = {
      requests: {
        where: requestStatus
          ? {
              requestStatus: {
                in: requestStatus.split(","), // Support multiple: "STALLED,SKIPPED"
              },
            }
          : undefined, // If no requestStatus, include all
        include: {
          requestType: true,
        },
      },
    };
    const queueList = await prisma.queue.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: [
        {
          session: {
            sessionNumber: "asc",
          },
        },
        { sequenceNumber: "asc" },
      ],
    });

    let filteredQueueList = queueList;

    if (requestStatus) {
      const allowedStatuses = requestStatus.split(","); // ["STALLED", "SKIPPED"]

      filteredQueueList = queueList
        .map((queue) => ({
          ...queue,
          requests: queue.requests.filter((req) =>
            allowedStatuses.includes(req.requestStatus)
          ),
        }))
        .filter((queue) => queue.requests.length > 0); //Only include queues with matching requests
    }

    // Response handling
    if (filteredQueueList.length === 0) {
      return res.status(200).json({
        success: true,
        message: windowIdStr
          ? `No ${status} queues for window ${windowIdStr}`
          : `There are no current ${status} queues active today!`,
        queueList: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: windowIdStr
        ? `${status} queues for window ${windowIdStr}`
        : `Current Queue List that are ${status}`,
      queueList: filteredQueueList,
    });
  } catch (error) {
    console.error("An error occurred in get queue list controller!", error);
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
    const io = req.app.get("io");
    const { sasStaffId, role } = req.user;
    const {
      queueId: queueIdStr,
      requestId: requestIdStr,
      windowId: windowIdStr,
      requestStatus,
    } = req.params;
    
    console.log("Request Params:", req.params);
    
    if (
      !isIntegerParam(queueIdStr) ||
      !isIntegerParam(requestIdStr) ||
      !isIntegerParam(windowIdStr)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid param(s). queueId, requestId, and windowId must be integers.",
      });
    }

    const queueId = Number(queueIdStr);
    const requestId = Number(requestIdStr);
    const windowId = Number(windowIdStr);

    if (![Role.PERSONNEL, Role.WORKING_SCHOLAR].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access – invalid role.",
      });
    }

    if (!requestStatus) {
      return res.status(400).json({
        success: false,
        message: "Missing required field. (requestStatus)",
      });
    }

    if (isNaN(queueId) || isNaN(requestId) || isNaN(windowId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Type, should receive a number but received a string (queueId, requestId, windowId).",
      });
    }

    if (
      ![
        Status.STALLED,
        Status.COMPLETED,
        Status.CANCELLED,
        Status.SKIPPED,
      ].includes(requestStatus.toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status update. Please provide a valid status.",
      });
    }

    const queueCheck = await prisma.queue.findUnique({
      where: { queueId },
      select: { windowId: true, queueStatus: true },
    });

    if (!queueCheck) {
      return res.status(404).json({
        success: false,
        message: "Queue not found.",
      });
    }

    if (Number(queueCheck.windowId) !== Number(windowId)) {
      return res.status(403).json({
        success: false,
        message:
          "This queue is being served by another window. Cannot update request status.",
      });
    }

    if (
      queueCheck.queueStatus === Status.WAITING ||
      queueCheck.queueStatus === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Queue must not be WAITING to update request status.",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const newStatus = mapToStatus(requestStatus);

      const requestUpdate = await tx.request.update({
        where: { requestId },
        data: {
          requestStatus: newStatus,
          processedBy: sasStaffId,
          processedAt:
            newStatus === Status.COMPLETED
              ? DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
              : null,
          updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
        },
        include: {
          requestType: true,
        },
      });

      //UPSERT transaction history (update if exists, create if doesn't)
      await createTransactionHistorySafe(tx, {
        queueId: queueId,
        requestId: requestId,
        performedById: sasStaffId,
        performedByRole: role,
        transactionStatus: newStatus,
        createdAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
      });

      return { requestUpdate };
    });

    io.emit(QueueActions.REQUEST_DEFERRED_UPDATED, {
      queueId: queueId,
      requestId: updated.requestUpdate.requestId,
      requestStatus: updated.requestUpdate.requestStatus,
      updatedRequest: updated.requestUpdate,
      updatedBy: sasStaffId,
    });

    return res.status(200).json({
      success: true,
      status: updated.requestUpdate.requestStatus,
      message: `Request ${requestId} updated successfully.`,
      data: updated.requestUpdate,
    });
  } catch (error) {
    console.error("Error setting request status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

async function createTransactionHistorySafe(tx, data) {
  // Find existing transaction for this specific queueId + requestId combination
  const existingTransaction = await tx.transactionHistory.findFirst({
    where: {
      queueId: data.queueId,
      requestId: data.requestId || null,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (existingTransaction) {
    //UPDATE existing transaction
    console.log('Updating existing transaction:', {
      id: existingTransaction.transactionHistoryId,
      queueId: data.queueId,
      requestId: data.requestId,
      oldStatus: existingTransaction.transactionStatus,
      newStatus: data.transactionStatus
    });

    const updated = await tx.transactionHistory.update({
      where: { 
        transactionHistoryId: existingTransaction.transactionHistoryId 
      },
      data: {
        transactionStatus: data.transactionStatus,
        performedById: data.performedById,
        performedByRole: data.performedByRole,
        createdAt: data.createdAt
      }
    });

    return updated;
  }

  // CREATE new transaction
  console.log('Creating new transaction:', {
    queueId: data.queueId,
    requestId: data.requestId,
    status: data.transactionStatus
  });

  const created = await tx.transactionHistory.create({ data });
  
  return created;
}

export const setDeferredRequestStatus = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { sasStaffId, role } = req.user;

    const {
      queueId: queueIdStr,
      requestId: requestIdStr,
      windowId: windowIdStr,
      requestStatus,
    } = req.params;

    if (
      !isIntegerParam(queueIdStr) ||
      !isIntegerParam(requestIdStr) ||
      !isIntegerParam(windowIdStr)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid param(s). queueId, requestId, and windowId must be integers.",
      });
    }

    const queueId = Number(queueIdStr);
    const requestId = Number(requestIdStr);
    const windowId = Number(windowIdStr);

    if (![Role.PERSONNEL, Role.WORKING_SCHOLAR].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access – invalid role.",
      });
    }

    if (!requestStatus) {
      return res.status(400).json({
        success: false,
        message: "Missing required field. (requestStatus)",
      });
    }

    if (
      ![
        Status.STALLED,
        Status.COMPLETED,
        Status.CANCELLED,
        Status.SKIPPED,
      ].includes(requestStatus.toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status update. Please provide a valid status.",
      });
    }

    const queueCheck = await prisma.queue.findUnique({
      where: { queueId },
      select: { windowId: true, queueStatus: true },
    });

    if (!queueCheck) {
      return res.status(404).json({
        success: false,
        message: "Queue not found.",
      });
    }

    if (Number(queueCheck.windowId) !== windowId) {
      return res.status(403).json({
        success: false,
        message:
          "This queue is being served by another window. Cannot update request status.",
      });
    }

    if (
      queueCheck.queueStatus === Status.WAITING ||
      queueCheck.queueStatus === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Queue must not be WAITING to update deferred request status.",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const newStatus = mapToStatus(requestStatus);

      const requestUpdate = await tx.request.update({
        where: { requestId },
        data: {
          requestStatus: newStatus,
          processedBy: sasStaffId,
          processedAt:
            newStatus === Status.COMPLETED
              ? DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
              : null,
          updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
        },
        include: {
          requestType: true,
        },
      });

      //UPSERT transaction history
      await createTransactionHistorySafe(tx, {
        queueId: queueId,
        requestId: requestId,
        performedById: sasStaffId,
        performedByRole: role,
        transactionStatus: newStatus,
        createdAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
      });

      return { requestUpdate };
    });

    io.emit(QueueActions.REQUEST_DEFERRED_UPDATED, {
      queueId: queueId,
      requestId: updated.requestUpdate.requestId,
      requestStatus: updated.requestUpdate.requestStatus,
      updatedRequest: updated.requestUpdate,
      updatedBy: sasStaffId,
    });

    return res.status(200).json({
      success: true,
      status: updated.requestUpdate.requestStatus,
      message: `Deferred request ${requestId} updated successfully.`,
      data: updated.requestUpdate,
    });
  } catch (error) {
    console.error("Error setting deferred request status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
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
    console.log("New queue session created:", result);
    return res.status(201).json({
      success: true,
      message:
        "New queue session created, previous session deactivated, and sequences reset",
      session: result,
    });
  } catch (error) {
    console.error("Error creating queue session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create queue session",
      error: error.message,
    });
  }
};

export const markQueueStatus = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { sasStaffId, role } = req.user;
    const { queueId: queueIdStr, windowId: windowIdStr } = req.params;

    if (!isIntegerParam(queueIdStr) || !isIntegerParam(windowIdStr)) {
      return res.status(400).json({
        success: false,
        message: "Invalid param. 'queueId' and 'windowId' must be integers.",
      });
    }

    const queueId = Number(queueIdStr);
    const windowId = Number(windowIdStr);

    if (isNaN(windowId) || isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        message:
          "An error occurred. Expecting a number but received a string. (queueId, windowId)",
      });
    }

    if (![Role.PERSONNEL, Role.WORKING_SCHOLAR].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role.",
      });
    }

    const existingQueue = await prisma.queue.findUnique({
      where: { queueId },
      include: {
        requests: true,
      },
    });

    if (!existingQueue) {
      return res.status(404).json({
        success: false,
        message: "Queue not found.",
      });
    }

    if (existingQueue.windowId !== windowId) {
      return res.status(403).json({
        success: false,
        message: "This queue is being served by another window.",
      });
    }

    const requests = existingQueue.requests || [];

    if (requests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot mark queue with no requests.",
      });
    }

    const allCompleted = requests.every(
      (r) => r.requestStatus === Status.COMPLETED
    );
    const allCancelled = requests.every(
      (r) => r.requestStatus === Status.CANCELLED
    );
    const anyStalled = requests.some((r) => r.requestStatus === Status.STALLED);
    const anySkipped = requests.some((r) => r.requestStatus === Status.SKIPPED);
    const hasCompleted = requests.some(
      (r) => r.requestStatus === Status.COMPLETED
    );
    const hasCancelled = requests.some(
      (r) => r.requestStatus === Status.CANCELLED
    );
    
    let finalStatus = Status.IN_SERVICE;

    if (allCompleted) finalStatus = Status.COMPLETED;
    else if (allCancelled) finalStatus = Status.CANCELLED;
    else if (anyStalled || anySkipped) finalStatus = Status.DEFERRED;
    else if (hasCompleted && hasCancelled)
      finalStatus = Status.PARTIALLY_COMPLETE;

    const updatedQueue = await prisma.$transaction(async (tx) => {
      const queueUpdate = await tx.queue.update({
        where: { queueId },
        data: {
          queueStatus: finalStatus,
          completedAt:
            finalStatus === Status.COMPLETED || finalStatus === Status.CANCELLED
              ? DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
              : null,
          updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
        },
        include: {
          requests: {
            include: {
              requestType: true,
            },
          },
        },
      });

      // CRITICAL FIX: Create transaction history for each request individually
      // This prevents duplicates and ensures correct request tracking
      if (finalStatus !== Status.DEFERRED) {
        console.log('[---IMPORTANT---]Creating transaction history for all requests...');
        
        for (const request of queueUpdate.requests) {
          // Only create transaction for requests that don't have one yet
          const existingTransaction = await tx.transactionHistory.findFirst({
            where: {
              queueId,
              requestId: request.requestId,
              transactionStatus: request.requestStatus
            }
          });

          if (!existingTransaction) {
            await tx.transactionHistory.create({
              data: {
                queueId,
                requestId: request.requestId,
                performedById: sasStaffId,
                performedByRole: role,
                transactionStatus: request.requestStatus,
                createdAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
              }
            });
            console.log(`Created transaction for request ${request.requestId} with status ${request.requestStatus}`);
          } else {
            console.log(`Skipped duplicate transaction for request ${request.requestId}`);
          }
        }
      }
      
      // Only create queue-level transaction for PARTIALLY_COMPLETE (if doesn't exist)
      const shouldCreateQueueTransaction = 
        existingQueue.queueStatus !== finalStatus &&
        finalStatus === Status.PARTIALLY_COMPLETE;

      if (shouldCreateQueueTransaction) {
        const existingQueueTransaction = await tx.transactionHistory.findFirst({
          where: {
            queueId,
            requestId: null,
            transactionStatus: Status.PARTIALLY_COMPLETE
          }
        });

        if (!existingQueueTransaction) {
          console.log('Creating queue-level transaction for PARTIALLY_COMPLETE');
          await tx.transactionHistory.create({
            data: {
              queueId,
              requestId: null,
              performedById: sasStaffId,
              performedByRole: role,
              transactionStatus: finalStatus,
              createdAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
            }
          });
        }
      }
      
      return queueUpdate;
    });

    const actionMap = {
      [Status.DEFERRED]: QueueActions.QUEUE_DEFERRED,
      [Status.COMPLETED]: QueueActions.QUEUE_COMPLETED,
      [Status.CANCELLED]: QueueActions.QUEUE_CANCELLED,
      [Status.PARTIALLY_COMPLETE]: QueueActions.QUEUE_PARTIALLY_COMPLETE,
    };
    const event = actionMap[finalStatus] || QueueActions.QUEUE_STATUS_UPDATED;

    console.log("Updated Queue: ", updatedQueue);

    const newQueueData = {
      queueId: updatedQueue.queueId,
      sessionId: updatedQueue.sessionId,
      studentId: updatedQueue.studentId,
      studentFullName: updatedQueue.studentFullName,
      courseCode: updatedQueue.courseCode,
      courseName: updatedQueue.courseName,
      yearLevel: updatedQueue.yearLevel,
      queueNumber: updatedQueue.queueNumber,
      sequenceNumber: updatedQueue.currentCount,
      resetIteration: updatedQueue.resetIteration,
      queueType: updatedQueue.queueType,
      queueStatus: updatedQueue.queueStatus,
      referenceNumber: updatedQueue.referenceNumber,
      isActive: updatedQueue.isActive,
      windowId: updatedQueue.windowId,
      servedByStaff: updatedQueue.servedByStaff,
      calledAt: updatedQueue.calledAt,
      completedAt: updatedQueue.completedAt,
      deletedAt: updatedQueue.deletedAt,
      createdAt: updatedQueue.createdAt,
      updatedAt: updatedQueue.updatedAt,
      requests: updatedQueue.requests
        .filter(
          (req) =>
            req.requestStatus === Status.STALLED ||
            req.requestStatus === Status.SKIPPED
        )
        .map((req) => ({
          requestId: req.requestId,
          queueId: updatedQueue.queueId,
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
    };
    
    io.emit(event, newQueueData);

    console.log(
      `📣 Emitted ${event} for queue ${updatedQueue.referenceNumber} → window:${windowId}`
    );

    return res.status(200).json({
      success: true,
      message: `Queue automatically marked as ${updatedQueue.queueStatus}.`,
      queue: updatedQueue,
    });
  } catch (error) {
    console.error("Error in markQueueStatus:", error);
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
      const lastServed = await tx.queue.findFirst({
        where: {
          servedByStaff: sasStaffId,
          queueStatus: {
            in: [Status.COMPLETED, Status.CANCELLED, Status.DEFERRED],
          },
          session: { isActive: true, isServing: true },
          windowId: windowId,
        },
        orderBy: { calledAt: "desc" },
      });

      // Determine next type to serve
      let nextType = Queue_Type.PRIORITY;
      if (lastServed?.queueType === Queue_Type.PRIORITY.toString())
        nextType = Queue_Type.REGULAR;

      // Try to find next queue of the desired type
      let nextQueue = await tx.queue.findFirst({
        where: {
          queueStatus: Status.WAITING,
          queueType: nextType,
          session: { isActive: true, isServing: true },
        },
        orderBy: [
          {
            session: { sessionNumber: "asc" },
          },
          { sequenceNumber: "asc" },
        ],
      });

      if (!nextQueue) {
        nextQueue = await tx.queue.findFirst({
          where: {
            queueStatus: Status.WAITING,
            session: { isActive: true, isServing: true },
          },
          orderBy: [
            { queueType: "desc" }, // PRIORITY first if possible
            {
              session: { sessionNumber: "asc" },
            },
            { sequenceNumber: "asc" },
          ],
        });
      }

      if (!nextQueue) return null;

      const updated = await tx.queue.updateMany({
        where: {
          queueId: nextQueue.queueId,
          queueStatus: Status.WAITING, // Only update if still waiting
        },
        data: {
          queueStatus: Status.IN_SERVICE,
          windowId,
          servedByStaff: sasStaffId,
          calledAt: new Date(),
        },
      });

      if (updated.count === 0) return "TAKEN";

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
    //  io.emit(QueueActions.TAKE_QUEUE, result);

    console.log(
      `📣 Window ${windowId} called next queue ${result.referenceNumber}`
    );

    res.status(200).json({
      success: true,
      message: `Now serving ${result.referenceNumber}`,
      data: result,
    });
  } catch (error) {
    console.error("Error in callNextQueue:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const currentServedQueue = async (req, res) => {
  try {
    const { sasStaffId, role } = req.user;
    const { windowId: windowIdStr } = req.params;

    if (!isIntegerParam(windowIdStr)) {
      return res.status(400).json({
        success: false,
        message: "Invalid param. 'windowId' must be integers.",
      });
    }

    const windowId = Number(windowIdStr);
    if (isNaN(windowId)) {
      return res.status(400).json({
        // Fixed typo: sttaus → status
        success: false,
        message:
          "An error occurred. Expecting a number but received a string. (windowId)",
      });
    }

    if (![Role.PERSONNEL, Role.WORKING_SCHOLAR].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role.",
      });
    }

    if (!sasStaffId) {
      return res.status(404).json({
        success: false,
        message: "Invalid Operation. SaS Staff ID not found!",
      });
    }
    const currentQueue = await prisma.queue.findFirst({
      where: {
        windowId: windowId,
        // servedByStaff: sasStaffId
        queueStatus: Status.IN_SERVICE,
        session: {
          sessionDate: todayUTC,
          isServing: true,
          isActive: true,
        },
        isActive: true,
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

    if (!currentQueue) {
      return res.status(200).json({
        success: true,
        message: "No active queue for this window",
        queue: null,
      });
    }

    const isDifferentStaff = currentQueue.servedByStaff !== sasStaffId;

    if (isDifferentStaff) {
      console.log(
        `Transferring queue ${currentQueue.queueNo} from staff ${currentQueue.servedByStaff} to ${sasStaffId}`
      );

      // Update the queue to be owned by the new staff
      const updatedQueue = await prisma.queue.update({
        where: { queueId: currentQueue.queueId },
        data: {
          servedByStaff: sasStaffId,
          updatedAt: new Date(),
        },
        include: {
          requests: {
            include: {
              requestType: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: "Queue inherited from previous staff",
        queue: updatedQueue,
        isInherited: true,
        previousStaff: currentQueue.servedByStaff,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Current queue retrieved successfully",
      queue: currentQueue,
      isInherited: false,
    });
  } catch (error) {
    console.error("Error fetching current served queue:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch current queue",
      error: error.message,
    });
  }
};


function mapToStatus(statusString) {
  const statusMap = {
    completed: Status.COMPLETED,
    stalled: Status.STALLED,
    skipped: Status.SKIPPED,
    cancelled: Status.CANCELLED,
  };
  return statusMap[statusString.toLowerCase()];
}

import { Status } from "@prisma/client";
import cron from "node-cron";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";

/**
 * OPTIMIZED OFFSET PAGINATION
 * - Uses indexed columns for filtering
 * - Caches total count
 * - Batches queries efficiently
 * - Works with page buttons (better UX for your use case)
 */
const isIntegerParam = (val) => /^\d+$/.test(val);
export const getTransactionsWithStalledLogic = async (req, res) => {
  try {
    console.log("Transaction request received:", {
      query: req.query,
      user: req.user ? `${req.user.firstName} ${req.user.lastName}` : "No user",
    });

    const {
      page = 1,
      limit = 50,
      course: courseStr,
      request: requestTypeStr,
      status,
      date,
      search,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number",
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit value (must be 1-100)",
      });
    }

    const courseId = parseInt(courseStr);
    const requestTypeId = parseInt(requestTypeStr);

    // Validate that they are integers (if provided)
    if (
      (courseStr && isNaN(courseId)) ||
      (requestTypeStr && isNaN(requestTypeId))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid query received, expected a numerical value for course or request",
      });
    }

    // Get today's date boundaries (Manila time)
    const todayStart = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );

    let whereClause = {};

    // STALLED LOGIC: Only show STALLED from previous days (finalized)
    if (status === Status.STALLED) {
      whereClause = {
        transactionStatus: Status.STALLED,
        requestId: { not: null },
        createdAt: {
          lt: todayStart,
        },
      };
    } else if (status === Status.SKIPPED) {
      // Block SKIPPED from being shown
      return res.status(200).json({
        success: true,
        message: "SKIPPED status is not available in transactions",
        data: {
          transactions: [],
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limitNum,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });
    } else if (status) {
      whereClause = {
        transactionStatus: status,
        requestId: { not: null },
      };
    } else {
      // DEFAULT: Show finalized transactions only
      whereClause.OR = [
        {
          transactionStatus: Status.COMPLETED,
          requestId: { not: null },
        },
        {
          transactionStatus: Status.CANCELLED,
          requestId: { not: null },
        },
        {
          transactionStatus: Status.STALLED,
          requestId: { not: null },
          createdAt: {
            lt: todayStart,
          },
        },
        {
          transactionStatus: Status.PARTIALLY_COMPLETE,
          requestId: { not: null },
        },
      ];
    }

    // Date filter
    if (date) {
      try {
        const startDate = new Date(date + "T00:00:00.000+08:00");
        const endDate = new Date(date + "T23:59:59.999+08:00");

        if (whereClause.createdAt) {
          whereClause.createdAt = {
            ...whereClause.createdAt,
            gte: startDate,
            lte: endDate,
          };
        } else if (whereClause.OR) {
          whereClause.OR = whereClause.OR.map((condition) => ({
            ...condition,
            createdAt: condition.createdAt
              ? { ...condition.createdAt, gte: startDate, lte: endDate }
              : { gte: startDate, lte: endDate },
          }));
        } else {
          whereClause.createdAt = {
            gte: startDate,
            lte: endDate,
          };
        }
      } catch (error) {
        console.error("Date parsing error:", error);
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }
    }

    // Course filter
    if (!isNaN(courseId)) {
      whereClause.queue = {
        ...whereClause.queue,
        courseCode: {
          in: await prisma.course
            .findMany({
              where: { courseId: courseId },
              select: { courseCode: true },
            })
            .then((r) => r.map((c) => c.courseCode)),
        },
      };
    }

    // Request filter - exact match
    if (!isNaN(requestTypeId)) {
      whereClause.request = {
        ...whereClause.request,
        requestTypeId: requestTypeId,
      };
    }
    // Search filter
    if (search) {
      whereClause.queue = {
        ...whereClause.queue,
        OR: [
          { studentId: { contains: search, mode: "insensitive" } },
          { studentFullName: { contains: search, mode: "insensitive" } },
          { referenceNumber: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    console.log("Final whereClause:", JSON.stringify(whereClause, null, 2));
    // Use lean queries - only fetch what we need
    const selectFields = {
      transactionHistoryId: true,
      transactionStatus: true,
      createdAt: true,
      requestId: true,
      performedById: true,
      performedByRole: true,
      queue: {
        select: {
          studentId: true,
          studentFullName: true,
          courseCode: true,
          queueNumber: true,
          queueType: true,
          referenceNumber: true,
        },
      },
      request: {
        select: {
          requestType: {
            select: {
              requestName: true,
            },
          },
        },
      },
      performer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    };

    // Run queries in parallel
    const [transactions, totalCount] = await Promise.all([
      prisma.transactionHistory.findMany({
        where: whereClause,
        select: selectFields,
        orderBy: [
          { createdAt: "desc" },
          { transactionHistoryId: "desc" }, // Secondary sort for consistency
        ],
        skip,
        take: limitNum,
      }),
      //Only count on first page or when filters change
      // For subsequent pages, we can estimate or skip this
      prisma.transactionHistory.count({
        where: whereClause,
      }),
    ]);

    console.log("Query results:", {
      totalCount,
      fetchedCount: transactions.length,
      page: pageNum,
    });

    // Format transactions (minimal processing)
    const formattedTransactions = transactions.map((transaction) => {
      let requestName = "Queue Status Change";

      if (transaction.requestId && transaction.request?.requestType) {
        requestName = transaction.request.requestType.requestName;
      }

      return {
        id: transaction.transactionHistoryId,
        studentId: transaction.queue.studentId,
        name: transaction.queue.studentFullName,
        course: transaction.queue.courseCode,
        request: requestName,
        status: transaction.transactionStatus,
        date: DateAndTimeFormatter.formatInTimeZone(
          transaction.createdAt,
          "MMM. dd, yyyy",
          "Asia/Manila"
        ),
        time: DateAndTimeFormatter.formatInTimeZone(
          transaction.createdAt,
          "HH:mm:ss",
          "Asia/Manila"
        ),
        performedBy: transaction.performer
          ? `${transaction.performer.firstName} ${transaction.performer.lastName}`
          : "System",
        performerRole: transaction.performedByRole,
        queueNumber: transaction.queue.queueNumber,
        queueType: transaction.queue.queueType,
        referenceNumber: transaction.queue.referenceNumber,
      };
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      data: {
        transactions: formattedTransactions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// even better performance with caching
let countCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

async function getCachedCount(whereClause) {
  const cacheKey = JSON.stringify(whereClause);
  const cached = countCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("Using cached count:", cached.count);
    return cached.count;
  }

  const count = await prisma.transactionHistory.count({ where: whereClause });
  countCache.set(cacheKey, { count, timestamp: Date.now() });

  // Clean old cache entries (prevent memory leak)
  if (countCache.size > 100) {
    const oldestKey = countCache.keys().next().value;
    countCache.delete(oldestKey);
  }

  return count;
}

// ... rest of your existing functions (scheduleDeferredFinalization, etc.)
export const scheduleDeferredFinalization = () => {
  cron.schedule(
    "0 22 * * *",
    async () => {
      console.log("[10 PM] Running deferred queue finalization...");

      try {
        const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
          new Date(),
          "Asia/Manila"
        );

        const deferredQueues = await prisma.queue.findMany({
          where: {
            queueStatus: Status.DEFERRED,
            session: {
              sessionDate: todayUTC,
              isActive: true,
            },
          },
          include: {
            requests: {
              where: { isActive: true },
            },
          },
        });

        console.log(
          `Found ${deferredQueues.length} deferred queues to finalize`
        );

        for (const queue of deferredQueues) {
          const requests = queue.requests;

          const allCompleted = requests.every(
            (r) => r.requestStatus === Status.COMPLETED
          );
          const allCancelled = requests.every(
            (r) => r.requestStatus === Status.CANCELLED
          );
          const hasStalled = requests.some(
            (r) => r.requestStatus === Status.STALLED
          );
          const hasSkipped = requests.some(
            (r) => r.requestStatus === Status.SKIPPED
          );
          const hasCompleted = requests.some(
            (r) => r.requestStatus === Status.COMPLETED
          );
          const hasCancelled = requests.some(
            (r) => r.requestStatus === Status.CANCELLED
          );

          let finalStatus = Status.DEFERRED;

          if (allCompleted) {
            finalStatus = Status.COMPLETED;
          } else if (allCancelled) {
            finalStatus = Status.CANCELLED;
          } else if (hasStalled || hasSkipped) {
            finalStatus = Status.DEFERRED;
          } else if (hasCompleted && hasCancelled) {
            finalStatus = Status.PARTIALLY_COMPLETE;
          }

          await prisma.queue.update({
            where: { queueId: queue.queueId },
            data: {
              queueStatus: finalStatus,
              completedAt:
                finalStatus === Status.COMPLETED ||
                finalStatus === Status.CANCELLED
                  ? DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
                  : null,
              updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
            },
          });

          await prisma.transactionHistory.create({
            data: {
              queueId: queue.queueId,
              performedById: queue.servedByStaff || "system",
              performedByRole: "PERSONNEL",
              transactionStatus: finalStatus,
            },
          });

          console.log(
            `Finalized queue ${queue.referenceNumber} → ${finalStatus}`
          );
        }

        console.log("Deferred finalization completed");
      } catch (error) {
        console.error("Error in deferred finalization:", error);
      }
    },
    {
      timezone: "Asia/Manila",
    }
  );
};

export const scheduleSkippedToCancelled = () => {
  cron.schedule("*/5 * * * *", async () => {
    console.log("Checking for expired skipped requests...");

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const expiredRequests = await prisma.request.findMany({
        where: {
          requestStatus: Status.SKIPPED,
          updatedAt: {
            lt: oneHourAgo,
          },
          isActive: true,
        },
        include: {
          queue: true,
        },
      });

      console.log(`Found ${expiredRequests.length} expired skipped requests`);

      for (const request of expiredRequests) {
        await prisma.request.update({
          where: { requestId: request.requestId },
          data: {
            requestStatus: Status.CANCELLED,
            updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
          },
        });

        await prisma.transactionHistory.create({
          data: {
            queueId: request.queueId,
            requestId: request.requestId,
            performedById: request.processedBy || "system",
            performedByRole: "PERSONNEL",
            transactionStatus: Status.CANCELLED,
          },
        });

        console.log(
          `Auto-cancelled skipped request ${request.requestId} after 1 hour`
        );
      }

      console.log("Skipped request check completed");
    } catch (error) {
      console.error("Error in skipped-to-cancelled check:", error);
    }
  });
};

export const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "WAITING",
      "IN_SERVICE",
      "DEFERRED",
      "STALLED",
      "CANCELLED",
      "COMPLETED",
      "SKIPPED",
      "PARTIALLY_COMPLETE",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value.",
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: Number(id) },
      data: { status },
    });

    return res.json({
      success: true,
      message: `Transaction marked as ${status}.`,
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update transaction status.",
      error: error.message,
    });
  }
};

export const getTransactionStats = async (req, res) => {
  try {
    const todayStart = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );

    const formatStatus = (status) => {
      const statusMap = {
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
        STALLED: "Stalled",
        PARTIALLY_COMPLETE: "Partially Complete",
        IN_SERVICE: "In Service",
        WAITING: "Waiting",
        DEFERRED: "Deferred",
      };
      return statusMap[status] || status;
    };

    const [courses, requests] = await Promise.all([
      // 🧩 1. COURSES (two-step fetch)
      (async () => {
        // Step 1: Get distinct courseCodes from queues
        // const queueCourses = await prisma.queue.findMany({
        //   where: {
        //     transactionHistories: {
        //       some: {
        //         transactionStatus: {
        //           in: [
        //             Status.COMPLETED,
        //             Status.CANCELLED,
        //             Status.STALLED,
        //             Status.PARTIALLY_COMPLETE,
        //           ],
        //         },
        //         requestId: { not: null },
        //       },
        //     },
        //   },
        //   select: {
        //     courseCode: true,
        //   },
        //   distinct: ["courseCode"],
        // });

        // // Step 2: Extract valid courseCodes
        // const courseCodes = queueCourses
        //   .map((q) => q.courseCode)
        //   .filter((code) => code !== null && code !== undefined);

        // if (courseCodes.length === 0) return [];

        // Step 3: Fetch matching courses by courseCode
        const courses = await prisma.course.findMany({
          select: {
            courseId: true,
            courseCode: true,
            courseName: true,
          },
          orderBy: { courseId: "asc" },
        });
        return courses;
      })(),
      (async () => {
        const requestTypes = await prisma.requestType.findMany({
          select: {
            requestTypeId: true,
            requestName: true,
          },
          orderBy: { requestTypeId: "asc" },
        });
        return requestTypes;
      })(),
      // prisma.transactionHistory
      //   .findMany({
      //     where: {
      //       request: { isNot: null },
      //       requestId: { not: null },
      //       transactionStatus: {
      //         in: [
      //           Status.COMPLETED,
      //           Status.CANCELLED,
      //           Status.STALLED,
      //           // Status.PARTIALLY_COMPLETE,
      //         ],
      //       },
      //     },
      //     distinct: ["requestId"],
      //     select: {
      //       request: {
      //         select: {
      //           requestType: {
      //             select: {
      //               requestTypeId: true,
      //               requestName: true,
      //             },
      //           },
      //         },
      //       },
      //     },
      //   })
      //   .then((results) => {
      //     const uniqueRequestTypesMap = new Map();
      //     results.forEach((t) => {
      //       const rt = t.request?.requestType;
      //       if (rt && !uniqueRequestTypesMap.has(rt.requestTypeId)) {
      //         uniqueRequestTypesMap.set(rt.requestTypeId, rt);
      //       }
      //     });
      //     const uniqueRequestTypes = Array.from(
      //       uniqueRequestTypesMap.values()
      //     ).sort((a, b) => a.requestName.localeCompare(b.requestName));

      //     return uniqueRequestTypes;
      //   }),
      // prisma.transactionHistory
      //   .groupBy({
      //     by: ["transactionStatus"],
      //     where: {
      //       requestId: { not: null },
      //       OR: [
      //         {
      //           transactionStatus: {
      //             in: [
      //               Status.COMPLETED,
      //               Status.CANCELLED,
      //               // Status.PARTIALLY_COMPLETE,
      //             ],
      //           },
      //         },
      //         {
      //           transactionStatus: Status.STALLED,
      //           createdAt: { lt: todayStart },
      //         },
      //       ],
      //     },
      //     _count: { transactionStatus: true },
      //   })
      //   .then((results) => {
      //     return results
      //       .map((r) => r.transactionStatus)
      //       .filter((status) => status !== "SKIPPED")
      //       .sort();
      //   }),
    ]);
    const statuses = [Status.COMPLETED, Status.CANCELLED, Status.STALLED];
    return res.status(200).json({
      success: true,
      message: "Transaction stats fetched successfully",
      data: {
        courses,
        requests,
        statuses,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getTransactionSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );

    let dateFilter = {};
    if (date) {
      const searchDate = DateAndTimeFormatter.startOfDayInTimeZone(
        new Date(date),
        "Asia/Manila"
      );
      dateFilter = {
        queue: {
          session: {
            sessionDate: searchDate,
          },
        },
      };
    }

    const statusCounts = await prisma.transactionHistory.groupBy({
      by: ["transactionStatus"],
      where: dateFilter,
      _count: {
        transactionStatus: true,
      },
    });

    const summary = {
      total: statusCounts.reduce(
        (acc, curr) => acc + curr._count.transactionStatus,
        0
      ),
      byStatus: statusCounts.reduce((acc, curr) => {
        acc[curr.transactionStatus] = curr._count.transactionStatus;
        return acc;
      }, {}),
    };

    return res.status(200).json({
      success: true,
      message: "Transaction summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching transaction summary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const initializeScheduledJobs = () => {
  console.log("Initializing scheduled jobs...");
  scheduleDeferredFinalization();
  scheduleSkippedToCancelled();
  console.log("Scheduled jobs initialized successfully");
};

import { Status } from "@prisma/client";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
import cron from 'node-cron';

/**
 * GET /api/transactions
 * Fetches transactions from transaction_history table with filtering and pagination
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 8)
 * - course: Filter by course code
 * - request: Filter by request type name
 * - status: Filter by transaction status
 * - date: Filter by date (ISO format)
 * - search: Search by student ID, name, or reference number
 * 
 * import { Status } from "@prisma/client";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
import cron from 'node-cron';

/**
 * 🔄 AUTO-FINALIZE DEFERRED QUEUES AT 10 PM
 * Runs daily at 10:00 PM Manila time
 * Finalizes all deferred queues that weren't resolved during the day
 */

export const getTransactionsWithStalledLogic = async (req, res) => {
  try {
    console.log("Transaction request received:", {
      query: req.query,
      user: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'No user'
    });

    const {
      page = 1,
      limit = 1000,
      course,
      request,
      status,
      date,
      search
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number"
      });
    }

    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit value"
      });
    }

    // 📅 Get today's date boundaries (Manila time)
    const todayStart = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1); // Start of tomorrow

    let whereClause = {};

    // 🔒 STALLED LOGIC: Only show STALLED from previous days (finalized)
    if (status === Status.STALLED) {
      // User specifically filtered for STALLED
      whereClause = {
        transactionStatus: Status.STALLED,
        createdAt: {
          lt: todayStart // Only STALLED created before today
        }
      };
    } else if (status) {
      // User filtered for another specific status (COMPLETED, CANCELLED, etc.)
      whereClause.transactionStatus = status;
      
      // If it's CANCELLED or COMPLETED, show all (including today's)
      // No date restriction needed for these
    } else {
      // 🎯 DEFAULT: Show finalized transactions only
      whereClause.OR = [
        {
          // Show COMPLETED from any day (including today)
          transactionStatus: Status.COMPLETED
        },
        {
          // Show CANCELLED from any day (including today)
          transactionStatus: Status.CANCELLED
        },
        {
          // Show STALLED only from previous days (finalized)
          transactionStatus: Status.STALLED,
          createdAt: {
            lt: todayStart
          }
        },
        {
          // Show PARTIALLY_COMPLETE from any day
          transactionStatus: Status.PARTIALLY_COMPLETE
        }
      ];
    }

    // 📅 Date filter (if user selects a specific date)
    if (date) {
      try {
        const startDate = new Date(date + 'T00:00:00.000+08:00');
        const endDate = new Date(date + 'T23:59:59.999+08:00');
        
        // If there's already a createdAt condition, we need to merge it properly
        if (whereClause.createdAt) {
          // Merge with existing date restrictions
          whereClause.createdAt = {
            ...whereClause.createdAt,
            gte: startDate,
            lte: endDate
          };
        } else if (whereClause.OR) {
          // When using OR, apply date filter to each branch
          whereClause.OR = whereClause.OR.map(condition => ({
            ...condition,
            createdAt: condition.createdAt 
              ? { ...condition.createdAt, gte: startDate, lte: endDate }
              : { gte: startDate, lte: endDate }
          }));
        } else {
          // Simple case: just add date filter
          whereClause.createdAt = {
            gte: startDate,
            lte: endDate
          };
        }
      } catch (error) {
        console.error('Date parsing error:', error);
        return res.status(400).json({
          success: false,
          message: "Invalid date format"
        });
      }
    }

    // 🎓 Course filter
    if (course) {
      whereClause.queue = {
        ...whereClause.queue,
        courseCode: course
      };
    }

    // 📋 Request filter
    if (request) {
      const requestFilter = {
        OR: [
          {
            request: {
              requestType: {
                requestName: {
                  equals: request,
                  mode: 'insensitive'
                }
              }
            }
          },
          {
            queue: {
              requests: {
                some: {
                  requestType: {
                    requestName: {
                      equals: request,
                      mode: 'insensitive'
                    }
                  },
                  isActive: true
                }
              }
            }
          }
        ]
      };

      // Merge with existing where clause
      if (whereClause.OR && !whereClause.transactionStatus) {
        // Complex merge for default view
        whereClause = {
          AND: [
            { OR: whereClause.OR },
            requestFilter
          ]
        };
      } else {
        whereClause = {
          ...whereClause,
          ...requestFilter
        };
      }
    }

    // 🔍 Search filter
    if (search) {
      whereClause.queue = {
        ...whereClause.queue,
        OR: [
          { studentId: { contains: search, mode: 'insensitive' } },
          { studentFullName: { contains: search, mode: 'insensitive' } },
          { referenceNumber: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    console.log('🔍 Final whereClause:', JSON.stringify(whereClause, null, 2));

    const [transactions, totalCount] = await Promise.all([
      prisma.transactionHistory.findMany({
        where: whereClause,
        include: {
          queue: {
            include: {
              session: {
                select: {
                  sessionDate: true,
                  sessionNumber: true
                }
              },
              requests: {
                where: { isActive: true },
                include: {
                  requestType: {
                    select: {
                      requestTypeId: true,
                      requestName: true
                    }
                  }
                }
              }
            }
          },
          request: {
            include: {
              requestType: {
                select: {
                  requestTypeId: true,
                  requestName: true
                }
              }
            }
          },
          performer: {
            select: {
              sasStaffId: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum,
      }),
      prisma.transactionHistory.count({
        where: whereClause
      })
    ]);

    console.log("Query results:", {
      totalCount,
      fetchedCount: transactions.length
    });

    const formattedTransactions = transactions.map(transaction => {
      let requestName = "Queue Status Change";
      
      if (transaction.requestId && transaction.request?.requestType) {
        requestName = transaction.request.requestType.requestName;
      } else if (transaction.queue?.requests && transaction.queue.requests.length > 0) {
        requestName = transaction.queue.requests[0].requestType?.requestName || "Unknown Request";
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
          'MMM. dd, yyyy',
          'Asia/Manila'
        ),
        time: DateAndTimeFormatter.formatInTimeZone(
          transaction.createdAt,
          'HH:mm:ss',
          'Asia/Manila'
        ),
        performedBy: transaction.performer 
          ? `${transaction.performer.firstName} ${transaction.performer.lastName}`
          : "System",
        performerRole: transaction.performedByRole,
        queueNumber: transaction.queue.queueNumber,
        queueType: transaction.queue.queueType,
        referenceNumber: transaction.queue.referenceNumber
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
          hasPreviousPage: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 🚀 Initialize all scheduled jobs
 * Call this in your server.js/index.js startup
 */

export const scheduleDeferredFinalization = () => {
  // Schedule: Run at 10:00 PM every day (Manila timezone)
  cron.schedule('0 22 * * *', async () => {
    console.log('🕙 [10 PM] Running deferred queue finalization...');
    
    try {
      const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
        new Date(),
        "Asia/Manila"
      );

      // Find all DEFERRED queues from today
      const deferredQueues = await prisma.queue.findMany({
        where: {
          queueStatus: Status.DEFERRED,
          session: {
            sessionDate: todayUTC,
            isActive: true
          }
        },
        include: {
          requests: {
            where: { isActive: true }
          }
        }
      });

      console.log(`📋 Found ${deferredQueues.length} deferred queues to finalize`);

      for (const queue of deferredQueues) {
        // Determine final status based on request statuses
        const requests = queue.requests;
        
        const allCompleted = requests.every(r => r.requestStatus === Status.COMPLETED);
        const allCancelled = requests.every(r => r.requestStatus === Status.CANCELLED);
        const hasStalled = requests.some(r => r.requestStatus === Status.STALLED);
        const hasSkipped = requests.some(r => r.requestStatus === Status.SKIPPED);
        const hasCompleted = requests.some(r => r.requestStatus === Status.COMPLETED);
        const hasCancelled = requests.some(r => r.requestStatus === Status.CANCELLED);

        let finalStatus = Status.DEFERRED; // Keep as DEFERRED if no clear final state

        // Determine final status priority
        if (allCompleted) {
          finalStatus = Status.COMPLETED;
        } else if (allCancelled) {
          finalStatus = Status.CANCELLED;
        } else if (hasStalled || hasSkipped) {
          // If still has unresolved stalled/skipped, keep as DEFERRED
          finalStatus = Status.DEFERRED;
        } else if (hasCompleted && hasCancelled) {
          finalStatus = Status.PARTIALLY_COMPLETE;
        }

        // Update queue with final status
        await prisma.queue.update({
          where: { queueId: queue.queueId },
          data: {
            queueStatus: finalStatus,
            completedAt: finalStatus === Status.COMPLETED || finalStatus === Status.CANCELLED
              ? DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
              : null,
            updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
          }
        });

        // Create transaction history for finalization
        await prisma.transactionHistory.create({
          data: {
            queueId: queue.queueId,
            performedById: queue.servedByStaff || 'system',
            performedByRole: 'PERSONNEL',
            transactionStatus: finalStatus
          }
        });

        console.log(`✅ Finalized queue ${queue.referenceNumber} → ${finalStatus}`);
      }

      console.log('✨ Deferred finalization completed');
    } catch (error) {
      console.error('❌ Error in deferred finalization:', error);
    }
  }, {
    timezone: 'Asia/Manila'
  });
};

export const scheduleSkippedToCancelled = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔍 Checking for expired skipped requests...');
    
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Find all SKIPPED requests that are older than 1 hour
      const expiredRequests = await prisma.request.findMany({
        where: {
          requestStatus: Status.SKIPPED,
          updatedAt: {
            lt: oneHourAgo
          },
          isActive: true
        },
        include: {
          queue: true
        }
      });

      console.log(`📋 Found ${expiredRequests.length} expired skipped requests`);

      for (const request of expiredRequests) {
        // Update request to CANCELLED
        await prisma.request.update({
          where: { requestId: request.requestId },
          data: {
            requestStatus: Status.CANCELLED,
            updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
          }
        });

        // Create transaction history
        await prisma.transactionHistory.create({
          data: {
            queueId: request.queueId,
            requestId: request.requestId,
            performedById: request.processedBy || 'system',
            performedByRole: 'PERSONNEL',
            transactionStatus: Status.CANCELLED
          }
        });

        console.log(`✅ Auto-cancelled skipped request ${request.requestId} after 1 hour`);
      }

      console.log('✨ Skipped request check completed');
    } catch (error) {
      console.error('❌ Error in skipped-to-cancelled check:', error);
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

export const getTransactions = async (req, res) => {
  try {
    console.log("📊 Transaction request received:", {
      query: req.query,
      user: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'No user'
    });

    const {
      page = 1,
      limit = 8,
      course,
      request,
      status,
      date,
      search,
      cursor
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const batchSize = 100;

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number"
      });
    }

    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit value"
      });
    }

    // Build base where clause
    let whereClause = {
      queue: {} // Initialize queue object for nested filters
    };

    // Date filter
    if (date) {
      try {
        const startDate = new Date(date + 'T00:00:00.000+08:00');
        const endDate = new Date(date + 'T23:59:59.999+08:00');
        
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate
        };
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format"
        });
      }
    }

    // ✅ FIX: Course filter (corrected structure)
    if (course) {
      whereClause.queue.courseCode = course;
      console.log('🎓 Course filter applied:', course);
    }

    // Status filter - only show finalized statuses
    if (status) {
      if (!Object.values(Status).includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value"
        });
      }
      whereClause.transactionStatus = status;
    } else {
      // ✅ Default: Only show COMPLETED, CANCELLED, and STALLED
      whereClause.transactionStatus = {
        in: [
          Status.COMPLETED, 
          Status.CANCELLED, 
          Status.STALLED  // Added STALLED as finalized status
        ]
      };
      console.log('📋 Default filter: showing finalized transactions (COMPLETED, CANCELLED, STALLED)');
    }

    // Request filter
    if (request) {
      whereClause.OR = [
        {
          request: {
            requestType: {
              requestName: {
                equals: request,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          queue: {
            requests: {
              some: {
                requestType: {
                  requestName: {
                    equals: request,
                    mode: 'insensitive'
                  }
                },
                isActive: true
              }
            }
          }
        }
      ];
    }

    // Search filter
    if (search) {
      const searchConditions = [
        { studentId: { contains: search, mode: 'insensitive' } },
        { studentFullName: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } }
      ];

      if (whereClause.queue.courseCode) {
        // If course filter exists, merge with search
        whereClause.queue.OR = searchConditions;
      } else {
        whereClause.queue.OR = searchConditions;
      }
    }

    // Clean up empty queue object if no queue filters applied
    if (Object.keys(whereClause.queue).length === 0) {
      delete whereClause.queue;
    }

    console.log('🔍 Final whereClause:', JSON.stringify(whereClause, null, 2));

    const queryOptions = {
      where: whereClause,
      include: {
        queue: {
          include: {
            session: {
              select: {
                sessionDate: true,
                sessionNumber: true
              }
            },
            requests: {
              where: { isActive: true },
              include: {
                requestType: {
                  select: {
                    requestTypeId: true,
                    requestName: true
                  }
                }
              }
            }
          }
        },
        request: {
          include: {
            requestType: {
              select: {
                requestTypeId: true,
                requestName: true
              }
            }
          }
        },
        performer: {
          select: {
            sasStaffId: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: batchSize
    };

    if (cursor) {
      queryOptions.cursor = {
        transactionHistoryId: parseInt(cursor)
      };
      queryOptions.skip = 1;
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transactionHistory.findMany(queryOptions),
      prisma.transactionHistory.count({ where: whereClause })
    ]);

    console.log("📊 Query results:", {
      totalCount,
      fetchedCount: transactions.length,
      pageRequested: pageNum
    });

    const skip = (pageNum - 1) * limitNum;
    const paginatedTransactions = transactions.slice(skip, skip + limitNum);

    const formattedTransactions = paginatedTransactions.map(transaction => {
      let requestName = "Queue Status Change";
      
      if (transaction.requestId && transaction.request?.requestType) {
        requestName = transaction.request.requestType.requestName;
      } else if (transaction.queue?.requests && transaction.queue.requests.length > 0) {
        requestName = transaction.queue.requests[0].requestType?.requestName || "Unknown Request";
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
          'MMM. dd, yyyy',
          'Asia/Manila'
        ),
        time: DateAndTimeFormatter.formatInTimeZone(
          transaction.createdAt,
          'HH:mm:ss',
          'Asia/Manila'
        ),
        performedBy: transaction.performer 
          ? `${transaction.performer.firstName} ${transaction.performer.lastName}`
          : "System",
        performerRole: transaction.performedByRole,
        queueNumber: transaction.queue.queueNumber,
        queueType: transaction.queue.queueType,
        referenceNumber: transaction.queue.referenceNumber
      };
    });

    const totalPages = Math.ceil(totalCount / limitNum);
    const nextCursor = transactions.length === batchSize 
      ? transactions[transactions.length - 1].transactionHistoryId 
      : null;

    return res.status(200).json({
      success: true,
      message: "✅ Transactions fetched successfully",
      data: {
        transactions: formattedTransactions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
          nextCursor,
          batchSize
        }
      }
    });

  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/transactions/stats
 * Fetches filter options for the transactions page
 * Returns available courses, request types, and statuses
 */

export const getTransactionStats = async (req, res) => {
  try {
    // Get today's boundaries for STALLED logic
    const todayStart = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );

    // Get all unique values for filters
    const [courses, requests, statuses] = await Promise.all([
      // ✅ Get unique courses from queues that have finalized transactions
      prisma.queue.findMany({
        where: {
          transactionHistories: {
            some: {
              transactionStatus: {
                in: [
                  Status.COMPLETED,
                  Status.CANCELLED,
                  Status.STALLED,
                  Status.PARTIALLY_COMPLETE
                ]
                // 🚫 Exclude SKIPPED
              }
            }
          }
        },
        select: {
          courseCode: true
        },
        distinct: ['courseCode']
      }).then(results => {
        return results
          .map(r => r.courseCode)
          .filter(Boolean)
          .sort();
      }),
      
      // ✅ Get request types that have finalized transactions
      prisma.transactionHistory.findMany({
        where: {
          request: {
            isNot: null
          },
          transactionStatus: {
            in: [
              Status.COMPLETED,
              Status.CANCELLED,
              Status.STALLED,
              Status.PARTIALLY_COMPLETE
            ]
            // 🚫 Exclude SKIPPED
          }
        },
        distinct: ['requestId'],
        include: {
          request: {
            include: {
              requestType: true
            }
          }
        }
      }).then(results => {
        const uniqueRequestNames = [...new Set(
          results
            .filter(t => t.request?.requestType?.requestName)
            .map(t => t.request.requestType.requestName)
        )];
        return uniqueRequestNames.sort();
      }),
      
      // ✅ Get unique transaction statuses (exclude SKIPPED and non-finalized STALLED)
      prisma.transactionHistory.groupBy({
        by: ['transactionStatus'],
        where: {
          OR: [
            {
              // COMPLETED, CANCELLED, PARTIALLY_COMPLETE from any day
              transactionStatus: {
                in: [
                  Status.COMPLETED,
                  Status.CANCELLED,
                  Status.PARTIALLY_COMPLETE
                ]
              }
            },
            {
              // STALLED only from previous days (finalized)
              transactionStatus: Status.STALLED,
              createdAt: {
                lt: todayStart
              }
            }
          ]
        },
        _count: {
          transactionStatus: true
        }
      }).then(results => {
        return results
          .map(r => r.transactionStatus)
          .filter(status => status !== Status.SKIPPED) // 🚫 Extra safety filter
          .sort();
      })
    ]);

    return res.status(200).json({
      success: true,
      message: "Transaction stats fetched successfully",
      data: {
        courses,
        requests,
        statuses
      }
    });

  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * GET /api/transactions/summary
 * Optional: Get summary statistics for transactions
 * Useful for dashboard or overview displays
 */

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
            sessionDate: searchDate
          }
        }
      };
    }

    const statusCounts = await prisma.transactionHistory.groupBy({
      by: ['transactionStatus'],
      where: dateFilter,
      _count: {
        transactionStatus: true
      }
    });

    const summary = {
      total: statusCounts.reduce((acc, curr) => acc + curr._count.transactionStatus, 0),
      byStatus: statusCounts.reduce((acc, curr) => {
        acc[curr.transactionStatus] = curr._count.transactionStatus;
        return acc;
      }, {})
    };

    return res.status(200).json({
      success: true,
      message: "Transaction summary fetched successfully",
      data: summary
    });

  } catch (error) {
    console.error("Error fetching transaction summary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

export const initializeScheduledJobs = () => {
  console.log('🕐 Initializing scheduled jobs...');
  scheduleDeferredFinalization();
  scheduleSkippedToCancelled();
  console.log('✅ Scheduled jobs initialized successfully');
};
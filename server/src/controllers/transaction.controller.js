import { Status } from "@prisma/client";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";

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
 */
export const getTransactions = async (req, res) => {
  try {
    // Debug logging
    console.log("UwU - Transaction request received:", {
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

    // Parse pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Validate pagination parameters
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Nyaa! page number"
      });
    }

    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Nyaaa! limit value"
      });
    }

    // Build the where clause for TransactionHistory
    let whereClause = {};

    // Date filter - filter by transaction creation date
    if (date) {
      try {
        console.log('UwU - Date filter input:', date);
        
        // User selects: 2025-10-23
        // We want: All transactions where createdAt date is Oct 23 in Manila time
        
        // Simple approach: Just check the date part, ignore time
        // Create date range for the entire day in Manila timezone
        const startDate = new Date(date + 'T00:00:00.000+08:00');
        const endDate = new Date(date + 'T23:59:59.999+08:00');
        
        console.log('UwU - Filtering transactions between:');
        console.log('UwU - Start:', startDate.toISOString(), '(Manila:', startDate.toLocaleString('en-US', { timeZone: 'Asia/Manila' }), ')');
        console.log('UwU - End:', endDate.toISOString(), '(Manila:', endDate.toLocaleString('en-US', { timeZone: 'Asia/Manila' }), ')');
        
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate
        };
      } catch (error) {
        console.error('UwU - Date parsing error:', error);
        return res.status(400).json({
          success: false,
          message: "WRYYYY!Invalid! date format"
        });
      }
    }

    // Course filter
    if (course) {
      whereClause.queue = {
        ...whereClause.queue,
        courseCode: course
      };
    }

    // Status filter - filter by transaction status
    if (status) {
      // Validate status enum
      if (!Object.values(Status).includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Omygotto - status value"
        });
      }
      whereClause.transactionStatus = status;
      console.log('0-o: Status filter:', status);
    }
    
    //  If no status filter is applied, exclude certain statuses by default
    // Include: COMPLETED, CANCELLED, DEFERRED.
    if (!status) {
      whereClause.transactionStatus = {
        in: [
          Status.COMPLETED, 
          Status.CANCELLED, 
          Status.DEFERRED, 
          Status.PARTIALLY_COMPLETE,
          Status.STALLED  
        ]
      };
      console.log('Default status filter: showing final states + STALLED');
    }

    // Request filter - filter by request type in the related request
    if (request) {
      console.log('Request filter input:', request);
      

      whereClause.OR = [
        // Option 1: Transaction has a direct request link
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
        // Option 2: Transaction's queue has this request type
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

    // Search filter (student ID, name, or reference number)
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

    // Fetch transactions with related data
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
          { createdAt: 'desc' } // Most recent transactions first
        ],
        skip,
        take: limitNum,
      }),
      prisma.transactionHistory.count({
        where: whereClause
      })
    ]);

    // 🔍 Debug logging
    console.log("-W- Query results:", {
      totalCount,
      fetchedCount: transactions.length,
      whereClause: JSON.stringify(whereClause, null, 2)
    });

    // Transform data to match frontend structure
    const formattedTransactions = transactions.map(transaction => {
    let requestName = "Queue Status Change";
      
      // If this transaction has a linked request, show the request type
      if (transaction.requestId && transaction.request?.requestType) {
        requestName = transaction.request.requestType.requestName;
      } 
      // If no request but the queue has requests, show the first request
      else if (transaction.queue?.requests && transaction.queue.requests.length > 0) {
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
      message: "UwU: Transactions fetched successfully",
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
 * GET /api/transactions/stats
 * Fetches filter options for the transactions page
 * Returns available courses, request types, and statuses
 */
export const getTransactionStats = async (req, res) => {
  try {
    // Get all unique values for filters
    const [courses, requests, statuses] = await Promise.all([
      // Get unique courses from transactions
      prisma.transactionHistory.findMany({
        distinct: ['queueId'],
        select: {
          queue: {
            select: {
              courseCode: true
            }
          }
        },
        orderBy: {
          queue: {
            courseCode: 'asc'
          }
        }
      }).then(results => {
        // Extract unique course codes
        const uniqueCourses = [...new Set(results.map(r => r.queue.courseCode))];
        return uniqueCourses.filter(Boolean).sort();
      }),
      
      // Get all active request types
      prisma.requestType.findMany({
        where: { 
          isActive: true,
          requests: {
            some: {
              isActive: true
            }
          }
        },
        select: { 
          requestName: true 
        },
        orderBy: { 
          requestName: 'asc' 
        },
        distinct: ['requestName']
      }).then(results => results.map(r => r.requestName)),
      
      // Get unique transaction statuses that exist in the database
      prisma.transactionHistory.groupBy({
        by: ['transactionStatus'],
        _count: {
          transactionStatus: true
        }
      }).then(results => results.map(r => r.transactionStatus).sort())
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

    // Get counts by status
    const statusCounts = await prisma.transactionHistory.groupBy({
      by: ['transactionStatus'],
      where: dateFilter,
      _count: {
        transactionStatus: true
      }
    });

    // Transform to more readable format
    const summary = {
      total: statusCounts.reduce((acc, curr) => acc + curr._count.transactionStatus, 0),
      byStatus: statusCounts.reduce((acc, curr) => {
        acc[curr.transactionStatus] = curr._count.transactionStatus;
        return acc;
      }, {})
    };

    return res.status(200).json({
      success: true,
      message: "UwU: Transaction summary fetched successfully",
      data: summary
    });

  } catch (error) {
    console.error("0-o: Error fetching transaction summary:", error);
    return res.status(500).json({
      success: false,
      message: "0-o: Internal Server Error"
    });
  }
};
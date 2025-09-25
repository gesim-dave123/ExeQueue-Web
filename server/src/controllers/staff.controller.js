import { Queue_Type, Status } from '@prisma/client';
import prisma from '../../prisma/prisma.js';
import DateAndTimeFormatter from '../../utils/DateAndTimeFormatter.js';

export const viewQueues = async (req, res) => {
  try {
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(new Date(), 'Asia/Manila');
    const { query: { filter, value } } = req;

    // Build where clause dynamically
    let whereClause = {
      queueDate: todayUTC,
      isActive: true,
      queueStatus: Status.WAITING
    };

    // Add filter conditions to the database query if provided
    if (filter && value) {
      if (filter === 'studentId') {
        whereClause.schoolId = { equals: value, mode: 'insensitive' };
      } else if (filter === 'fullName') {
        whereClause.studentFullName = { contains: value, mode: 'insensitive' };
      } else if (filter === 'referenceNumber') {
        whereClause.referenceNumber = { equals: value, mode: 'insensitive' };
      }
      else if( filter === 'queueType'){
        if([Queue_Type.PRIORITY, Queue_Type.REGULAR].toString().includes(value)){
          whereClause.queueType = value.toUpperCase() === 'REGULAR' ? Queue_Type.REGULAR : Queue_Type.PRIORITY;
        }
      }
    }

    const queues = await prisma.queue.findMany({
      where: whereClause,
      orderBy: [
        { queueSessionId: 'desc' },
        { queueNumber: 'desc' }
      ],
      select: {
        queueId: true,
        studentFullName: true,
        schoolId: true,
        course: {
          select: {
            courseCode: true
          }
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
                description: true
              }
            }
          },
          where: {
            isActive: true
          }
        }
      }
    });

    if (!queues || queues.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No queues found for today"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Queues fetched successfully!",
      queue: queues
    });

  } catch (error) {
    console.error('Error fetching queue:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch queue"
    });
  }
};


export const determineNextQueue = async (req, res) => {
  try {
    const { sasStaffId, role, serviceWindowId } = req.user;
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(new Date(), 'Asia/Manila');

    // Get window rules
    const windowRule = await prisma.serviceWindow.findUnique({
      where: { windowId: serviceWindowId, isActive: true },
      select: { canServePriority: true, canServeRegular: true }
    });

    if (!windowRule) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: No valid window rule found!"
      });
    }

    let allowedTypes = [];
    if (windowRule.canServePriority) allowedTypes.push(Queue_Type.PRIORITY);
    if (windowRule.canServeRegular) allowedTypes.push(Queue_Type.REGULAR);

    if (allowedTypes.length === 0) {
      return res.status(403).json({
        success: false,
        message: "This window is not allowed to serve any queue types."
      });
    }
    console.log("Allowed Queue Types for this window:", allowedTypes);
    // Use transaction with retry logic for concurrency
    const result = await prisma.$transaction(async (tx) => {
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
          { queueNumber: "asc" }
        ]
      });

      if (!nextQueue) {
        return res.status(404).json({
          success:false,
          message: "No waiting queue available for this window."
        });
      }

      // Atomic update with additional safety check
      const updatedQueue = await tx.queue.updateMany({
        where: {
          queueId: nextQueue.queueId,
          windowId: null, // Extra safety: only update if still unassigned
          queueStatus: Status.WAITING // Extra safety: only update if still waiting
        },
        data: {
          windowId: serviceWindowId,
          queueStatus: Status.IN_SERVICE // Update status too!
        }
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
            include: { requestType: { select: { requestName: true } } }
          },
        }
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
    }, {
      // Transaction options for better concurrency handling
      maxWait: 5000, // Maximum time to wait for a transaction slot
      timeout: 10000 // Maximum time for the transaction to complete
    });

    return res.status(200).json({
      success: true,
      message: "Next queue assigned to this window.",
      nextQueue: result
    });

  } catch (error) {
    console.error("Error in Getting Next Queue Number:", error);

    // Handle specific concurrency errors
    if (error.message === "NO_QUEUE_AVAILABLE") {
      return res.status(404).json({
        success: false,
        message: "No waiting queue available for this window."
      });
    }

    if (error.message === "QUEUE_ALREADY_ASSIGNED") {
      return res.status(409).json({
        success: false,
        message: "Queue was assigned to another window. Please try again."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!"
    });
  }
};

export const createQueueSession = async (req, res) => {
  // const { sessionName } = req.body;

  try {
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(new Date(), 'Asia/Manila');

    const result = await prisma.$transaction(async (tx) => {
      await tx.queueSession.updateMany({
        where: { isActive: true },
        data:{ isActive:false}
      })

      const lastSession = await tx.queueSession.findFirst({
        where: { sessionDate: todayUTC },
        orderBy: { sessionNo: 'desc' },
      })

      const nextSessionNo = lastSession ? lastSession.sessionNo + 1 :1;
      const newSession = await tx.queueSession.create({
        data:{
          sessionNo: nextSessionNo,
          sessionDate: todayUTC,
          isActive: true
        }
      })

      await tx.$executeRawUnsafe(`ALTER SEQUENCE queue_regular_seq RESTART WITH 1`);
      await tx.$executeRawUnsafe(`ALTER SEQUENCE queue_priority_seq RESTART WITH 1`);

      return newSession
    })
    console.log('✅ New queue session created:', result);
    return res.status(201).json({
      success: true,
      message: 'New queue session created, previous session deactivated, and sequences reset',
      session: result,
    });
  } catch (error) {
    console.error('❌ Error creating queue session:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create queue session',
      error: error.message,
    });
  }
};
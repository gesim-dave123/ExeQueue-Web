import { Queue_Type, Status } from '@prisma/client';
import prisma from '../../prisma/prisma.js';
import DateAndTimeFormatter from '../../utils/DateAndTimeFormatter.js';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
  new Date(),
  'Asia/Manila'
);

export const viewQueues = async (req, res) => {
  try {
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      'Asia/Manila'
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
      if (filter === 'studentId') {
        whereClause.schoolId = { equals: value, mode: 'insensitive' };
      } else if (filter === 'fullName') {
        whereClause.studentFullName = { contains: value, mode: 'insensitive' };
      } else if (filter === 'referenceNumber') {
        whereClause.referenceNumber = { equals: value, mode: 'insensitive' };
      } else if (filter === 'queueType') {
        if (
          [Queue_Type.PRIORITY, Queue_Type.REGULAR].toString().includes(value)
        ) {
          whereClause.queueType =
            value.toUpperCase() === 'REGULAR'
              ? Queue_Type.REGULAR
              : Queue_Type.PRIORITY;
        }
      }
    }

    const queues = await prisma.queue.findMany({
      where: whereClause,
      orderBy: [{ queueSessionId: 'desc' }, { queueNumber: 'desc' }],
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
        message: 'No queues found for today',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Queues fetched successfully!',
      queue: queues,
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch queue',
    });
  }
};

export const determineNextQueue = async (req, res) => {
  try {
    const { sasStaffId, role, serviceWindowId } = req.user;
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      'Asia/Manila'
    );
    if (!serviceWindowId || serviceWindowId === null) {
      return res.status(403).json({
        success: false,
        message:
          'No window assigned detected! Please assign which window you are using first.',
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
        message: 'Bad Request: No valid window rule found!',
      });
    }

    let allowedTypes = [];
    if (windowRule.canServePriority) allowedTypes.push(Queue_Type.PRIORITY);
    if (windowRule.canServeRegular) allowedTypes.push(Queue_Type.REGULAR);

    if (allowedTypes.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'This window is not allowed to serve any queue types.',
      });
    }
    console.log('Allowed Queue Types for this window:', allowedTypes);
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
            { queueType: 'desc' }, // PRIORITY first
            { queueNumber: 'asc' },
          ],
        });

        if (!nextQueue) {
          return res.status(404).json({
            success: false,
            message: 'No waiting queue available for this window.',
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
          throw new Error('QUEUE_ALREADY_ASSIGNED');
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
      message: 'Next queue assigned to this window.',
      nextQueue: result,
    });
  } catch (error) {
    console.error('Error in Getting Next Queue Number:', error);

    // Handle specific concurrency errors
    if (error.message === 'NO_QUEUE_AVAILABLE') {
      return res.status(404).json({
        success: false,
        message: 'No waiting queue available for this window.',
      });
    }

    if (error.message === 'QUEUE_ALREADY_ASSIGNED') {
      return res.status(409).json({
        success: false,
        message: 'Queue was assigned to another window. Please try again.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error!',
    });
  }
};

export const getQueueList = async (req, res) => {
  try {
    // const {sasStaffId, role, serviceWindowId} = req.user;
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      'Asia/Manila'
    );
    // if(!serviceWindowId || serviceWindowId === null){
    //   return res.status(403).json({success: false, message: "No window assigned detected! Please assign which window you are using first."});
    // }

    const activeWindow = await prisma.serviceWindow.findMany({
      where: { isActive: true },
      select: {
        windowNo: true,
        windowName: true,
        isActive: true,
      },
    });

    if (activeWindow.length === 0 || !activeWindow) {
      return res.status(400).json({
        success: false,
        message: 'There are no active windows currently',
      });
    }
    const regularQueue = await prisma.queue.findMany({
      where: {
        queueDate: todayUTC,
        queueStatus: { in: [Status.WAITING, Status.IN_SERVICE] },
        queueType: Queue_Type.REGULAR,
        isActive: true,
      },
      orderBy: [{ queueType: 'desc' }, { queueNumber: 'asc' }],
    });
    const priorityQueue = await prisma.queue.findMany({
      where: {
        queueDate: todayUTC,
        queueStatus: { in: [Status.WAITING, Status.IN_SERVICE] },
        queueType: Queue_Type.PRIORITY,
        isActive: true,
      },
      orderBy: [{ queueType: 'desc' }, { queueNumber: 'asc' }],
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
        message: 'Bad Request, Error in queue list',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        queues.length === 0
          ? 'There are no queues currently in the system, please wait a moment'
          : 'Queues successfully retrieved!',
      queues: queues,
    });
  } catch (error) {
    console.error('Error in getting queue list: ', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error!',
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
          'No window assigned detected! Please assign which window you are using first.',
      });
    }
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      'Asia/Manila'
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
          'No window assigned detected! Please assign which window you are using first.',
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
          message: 'Invalid status update. Please provide a valid status.',
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
      'Asia/Manila'
    );

    const result = await prisma.$transaction(async (tx) => {
      await tx.queueSession.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      const lastSession = await tx.queueSession.findFirst({
        where: { sessionDate: todayUTC },
        orderBy: { sessionNo: 'desc' },
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
    console.log('✅ New queue session created:', result);
    return res.status(201).json({
      success: true,
      message:
        'New queue session created, previous session deactivated, and sequences reset',
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

export const assignServiceWindow = async (req, res) => {
  try {
    const { sasStaffId, role } = req.user;
    const { serviceWindowNumber } = req.body;
    if (!serviceWindowNumber || serviceWindowNumber === null) {
      return res.status(400).json({
        success: false,
        message:
          'No service window selected. Please select a valid service window from the available options.',
      });
    }
    const windowId = await prisma.serviceWindow.findUnique({
      where: { windowNo: serviceWindowNumber, isActive: true },
      select: { windowId: true },
    });
    if (!windowId || windowId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service window selected.',
      });
    }
    console.log('Matched Window ID:', windowId);
    const assignWindow = await prisma.sasStaff.update({
      where: {
        sasStaffId: sasStaffId,
      },
      data: {
        serviceWindowId: windowId.windowId,
      },
    });
    if (!assignWindow) {
      return res.status(400).json({
        success: false,
        message: 'Failed to assign service window.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service window assigned successfully.',
      windowId: assignWindow.serviceWindowId,
    });
  } catch (error) {
    console.error('Error assigning service window:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error!',
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
        .json({ success: false, message: 'Missing required parameters.' });
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
        .json({ success: false, message: 'Invalid status provided.' });
    }

    const existingQueue = await prisma.queue.findUnique({
      where: { queueId },
      include: { requests: true },
    });

    if (!existingQueue) {
      return res
        .status(404)
        .json({ success: false, message: 'Queue not found.' });
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
    console.error('Error updating queue status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
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
        .json({ success: false, message: 'Queue not found.' });
    }

    if (queue.queueStatus !== Status.SKIPPED) {
      return res
        .status(400)
        .json({ success: false, message: 'Queue is not marked as skipped.' });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (queue.calledAt < oneHourAgo) {
      return res.status(400).json({
        success: false,
        message: 'Cannot restore skipped queue. More than 1 hour has passed.',
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
      message: 'Skipped queue restored to IN_SERVICE.',
      queue: restored,
    });
  } catch (error) {
    console.error('Error restoring skipped queue:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error.' });
  }
};

export const getWorkingScholars = async (req, res) => {
  try {
    const workingScholars = await prisma.sasStaff.findMany({
      where: {
        role: Role.WORKING_SCHOLAR,
        isActive: true,
      },
      select: {
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    const formattedScholars = workingScholars.map((scholar) => ({
      username: scholar.username,
      name: `${scholar.firstName} ${scholar.lastName}`,
      role: scholar.role,
      email: scholar.email,
    }));

    return res.status(200).json({
      success: true,
      message: 'Working Scholar accounts retrieved successfully.',
      data: formattedScholars,
    });
  } catch (error) {
    console.error('Error retrieving working scholars:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve Working Scholar accounts.',
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
        .json({ success: false, message: 'Missing required fields.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirmation do not match.',
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
          .json({ success: false, message: 'Username already exists.' });
      }
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists.' });
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
      message: 'Working Scholar account created successfully.',
      data: {
        sasStaffId: newAccount.sasStaffId,
        username: newAccount.username,
        name: `${newAccount.firstName} ${newAccount.lastName}`,
        email: newAccount.email,
        role: newAccount.role,
      },
    });
  } catch (error) {
    console.error('Error creating working scholar account:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
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
        .json({ success: false, message: 'Account not found or inactive.' });
    }

    if (account.role !== Role.WORKING_SCHOLAR) {
      return res.status(403).json({
        success: false,
        message: 'Can only update Working Scholar accounts.',
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
          'Both newPassword and confirmPassword are required to change password.',
      });
    }
    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .json({ success: false, message: 'Password does not match.' });
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
          .json({ success: false, message: 'Username already in use.' });
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
          .json({ success: false, message: 'Email already in use.' });
      }
    }

    // Build update payload
    const updateData = {
      ...(username ? { username } : {}),
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(typeof middleName !== 'undefined'
        ? { middleName: middleName ?? null }
        : {}),
      ...(email ? { email } : {}),
      ...(typeof hashedPassword !== 'undefined' ? { hashedPassword } : {}),
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
      message: 'Account updated successfully.',
      data: {
        sasStaffId: updated.sasStaffId,
        username: updated.username,
        name: `${updated.firstName} ${updated.lastName}`,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (error) {
    console.error('Error updating working scholar account:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
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
        .json({ success: false, message: 'Account not found.' });
    }

    if (account.role !== Role.WORKING_SCHOLAR) {
      return res.status(403).json({
        success: false,
        message: 'Can only delete Working Scholar accounts.',
      });
    }

    if (!account.isActive) {
      return res
        .status(400)
        .json({ success: false, message: 'Account already deleted.' });
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
      message: 'Account soft-deleted successfully.',
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
    console.error('Error soft-deleting account:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
  }
};

import { Queue_Type, Status } from '@prisma/client';
import prisma from '../../prisma/prisma.js';
import DateAndTimeFormatter from '../../utils/DateAndTimeFormatter.js';
import { capitalizeFullName } from '../../utils/nameFormatter.js';
import { decryptQueueId, encryptQueueId } from '../../utils/encryptId.js';
import { SocketEvents } from '../services/enums/SocketEvents.js';
import generateReferenceNumber from '../services/queue/generateReferenceNumber.js';
import { formatQueueNumber } from '../services/queue/QueueNumber.js';
import {
  sendDashboardUpdate,
  sendLiveDisplayUpdate,
} from './statistics.controller.js';

const isIntegerParam = (val) => /^\d+$/.test(val);

export const generateQueue = async (req, res) => {
  try {
    const io = req.app.get('io');
    const {
      fullName,
      studentId,
      courseId,
      courseCode,
      yearLevel,
      queueType,
      serviceRequests,
    } = req.body;

    console.log('🟢 Incoming Queue Data:', req.body);

    // =================== VALIDATION ===================
    validateRequiredFields({
      fullName,
      studentId,
      courseCode,
      yearLevel,
      queueType,
    });
    validateStudentId(studentId);
    validateYearLevel(yearLevel);
    validateQueueType(queueType);

    if (!serviceRequests?.length) {
      return res.status(400).json({
        success: false,
        message: "Service requests are required",
      });
    }

    // Normalize year level and queue type
    const normalizedYearLevel = normalizeYearLevel(yearLevel);
    const QUEUETYPE = normalizeQueueType(queueType);

    // Validate course
    const course = await validateCourse(courseId, courseCode);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or inactive",
      });
    }

    // =================== TRANSACTION ===================
    const transactionResult = await prisma.$transaction(
      async (tx) => {
        const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
          new Date(),
          'Asia/Manila'
        );

        // Advisory lock to prevent session race conditions
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('queue_session_lock'))`;

        // Find or create session
        const session = await findOrCreateSession(tx, todayUTC);

        // Calculate queue number with manual reset support
        const { queueNumber, resetIteration, currentCount } =
          await calculateQueueNumber(tx, session, QUEUETYPE, req.app);

        // Generate reference number
        const refNumber = generateReferenceNumber(
          todayUTC,
          QUEUETYPE,
          currentCount,
          session.sessionNumber
        );

        // Create queue
        const newQueue = await tx.queue.create({
          data: {
            sessionId: session.sessionId,
            studentId,
            studentFullName: capitalizedFullName,
            courseCode: course.courseCode,
            courseName: course.courseName,
            yearLevel: normalizedYearLevel,
            queueNumber,
            sequenceNumber: currentCount,
            resetIteration,
            queueType: QUEUETYPE,
            queueStatus: 'WAITING',
            referenceNumber: refNumber,
            isActive: true,
          },
        });

        console.log(
          `✅ Queue generated: ${formatQueueNumber(
            QUEUETYPE === Queue_Type.PRIORITY ? 'P' : 'R',
            queueNumber
          )} (Seq: ${currentCount}, Session: ${
            session.sessionNumber
          }, Iteration: ${resetIteration})`
        );

        // Increment session count
        await tx.queueSession.update({
          where: { sessionId: session.sessionId },
          data: { currentQueueCount: { increment: 1 } },
        });

        // Create service requests
        await createServiceRequests(tx, newQueue.queueId, serviceRequests);

        // Return data for post-transaction operations
        return {
          newQueue,
          session,
          queueNumber,
          QUEUETYPE,
        };
      },
      { maxWait: 5000, timeout: 10000 }
    );

    // =================== POST-TRANSACTION OPERATIONS ===================
    const {
      newQueue,
      session,
      queueNumber,
      QUEUETYPE: queueTypeResult,
    } = transactionResult;

    // Emit socket events AFTER transaction commits
    io.emit(SocketEvents.QUEUE_CREATED, {
      queueId: newQueue.queueId,
      referenceNumber: newQueue.referenceNumber,
    });

    // Send SSE updates
    sendDashboardUpdate({
      message: "New queue created",
      sessionId: session.sessionId,
    });
    sendLiveDisplayUpdate({
      message: "New queue created",
      sessionId: session.sessionId,
    });

    // Format and send response
    const formattedQueueNumber = formatQueueNumber(
      queueTypeResult === Queue_Type.PRIORITY ? "P" : "R",
      queueNumber
    );

    return res.status(201).json({
      success: true,
      message: "Queue Generated Successfully!",
      queueData: {
        queueId: encryptQueueId(newQueue.queueId),
        queueNumber: newQueue.queueNumber,
        formattedQueueNumber,
        queueType: newQueue.queueType,
        queueStatus: newQueue.queueStatus,
        referenceNumber: newQueue.referenceNumber,
      },
    });
  } catch (error) {
    console.error("Error generating queue:", error);
    return handleError(res, error);
  }
};

// =================== HELPER FUNCTIONS ===================

function validateRequiredFields({
  fullName,
  studentId,
  courseCode,
  yearLevel,
  queueType,
}) {
  if (
    !fullName?.trim() ||
    !studentId?.trim() ||
    !courseCode?.trim() ||
    !yearLevel?.trim() ||
    !queueType?.trim()
  ) {
    throw new ValidationError("Missing required fields");
  }
}

function validateStudentId(studentId) {
  const regexId = /^\d{8}$/;
  if (!regexId.test(studentId)) {
    throw new ValidationError("Invalid student id format. Must be 8 digits.");
  }
}

function validateYearLevel(yearLevel) {
  const validYearLevels = [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "Irregular",
    "First Year",
    "Second Year",
    "Third Year",
    "Fourth Year",
    "Fifth Year",
    "Sixth Year",
  ];

  if (!validYearLevels.includes(yearLevel)) {
    throw new ValidationError("Invalid year level");
  }
}

function validateQueueType(queueType) {
  const validQueueTypes = [
    Queue_Type.REGULAR.toLowerCase(),
    Queue_Type.PRIORITY.toLowerCase(),
  ];

  if (!validQueueTypes.includes(queueType.toLowerCase())) {
    throw new ValidationError(
      "Invalid Queue Type! Must be REGULAR or PRIORITY"
    );
  }
}

function normalizeYearLevel(yearLevel) {
  const yearLevelMap = {
    "First Year": "1st",
    "Second Year": "2nd",
    "Third Year": "3rd",
    "Fourth Year": "4th",
    "Fifth Year": "5th",
    "Sixth Year": "6th",
  };

  return yearLevelMap[yearLevel] || yearLevel;
}

function normalizeQueueType(queueType) {
  const upperType = queueType.toUpperCase();
  return upperType === Queue_Type.REGULAR
    ? Queue_Type.REGULAR
    : Queue_Type.PRIORITY;
}

async function validateCourse(courseId, courseCode) {
  return await prisma.course.findFirst({
    where: {
      courseId: Number(courseId),
      courseCode: { equals: courseCode, mode: "insensitive" },
      isActive: true,
    },
    select: { courseId: true, courseCode: true, courseName: true },
  });
}

async function findOrCreateSession(tx, todayUTC) {
  let session = await tx.queueSession.findFirst({
    where: {
      sessionDate: todayUTC,
      isAcceptingNew: true,
      isServing: true,
      isActive: true,
    },
    orderBy: { sessionNumber: "desc" },
  });

  if (!session) {
    const lastSession = await tx.queueSession.findFirst({
      where: { sessionDate: todayUTC },
      orderBy: { sessionNumber: "desc" },
    });

    const nextSessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1;

    session = await tx.queueSession.create({
      data: {
        sessionDate: todayUTC,
        sessionNumber: nextSessionNumber,
        maxQueueNo: 500,
        currentQueueCount: 0,
        regularCount: 0,
        priorityCount: 0,
        isAcceptingNew: true,
        isServing: true,
        isActive: true,
      },
    });
  }

  return session;
}

async function calculateQueueNumber(tx, session, QUEUETYPE, app) {
  const counterField =
    QUEUETYPE === Queue_Type.REGULAR ? "regularCount" : "priorityCount";

  // Increment counter
  const updatedSession = await tx.queueSession.update({
    where: { sessionId: session.sessionId },
    data: { [counterField]: { increment: 1 } },
    select: { regularCount: true, priorityCount: true, maxQueueNo: true },
  });

  const currentCount =
    QUEUETYPE === Queue_Type.REGULAR
      ? updatedSession.regularCount
      : updatedSession.priorityCount;

  // Check for manual reset
  const manualResetInfo = app.get("manualResetTriggered") || {};
  const manualReset = manualResetInfo[QUEUETYPE];

  let queueNumber;
  let resetIteration;

  if (
    manualReset?.resetAtSequence != null &&
    currentCount > manualReset.resetAtSequence
  ) {
    // After manual reset
    const countSinceReset = currentCount - manualReset.resetAtSequence;
    queueNumber = ((countSinceReset - 1) % updatedSession.maxQueueNo) + 1;
    resetIteration =
      manualReset.iteration +
      Math.floor((countSinceReset - 1) / updatedSession.maxQueueNo);
  } else {
    // Normal behavior
    queueNumber = ((currentCount - 1) % updatedSession.maxQueueNo) + 1;
    resetIteration = Math.floor((currentCount - 1) / updatedSession.maxQueueNo);
  }

  console.log({
    currentCount,
    queueNumber,
    resetIteration,
    manualResetActive: manualReset?.resetAtSequence != null,
    resetAtSequence: manualReset?.resetAtSequence,
    countSinceReset: manualReset?.resetAtSequence
      ? currentCount - manualReset.resetAtSequence
      : null,
  });

  return { queueNumber, resetIteration, currentCount };
}

async function createServiceRequests(tx, queueId, serviceRequests) {
  const reqTypeIds = serviceRequests.map((r) => r.requestTypeId);

  // Validate request types exist
  const existingRequestData = await tx.requestType.findMany({
    where: { requestTypeId: { in: reqTypeIds } },
  });

  const existingIds = existingRequestData.map((r) => r.requestTypeId);
  const invalidIds = reqTypeIds.filter((id) => !existingIds.includes(id));

  if (invalidIds.length > 0) {
    throw new Error(`Request Types Not Found: ${invalidIds.join(", ")}`);
  }

  // Create all requests
  return await Promise.all(
    reqTypeIds.map((id) =>
      tx.request.create({
        data: {
          queueId,
          requestTypeId: id,
          requestStatus: Status.WAITING,
          isActive: true,
        },
        include: {
          requestType: {
            select: { requestTypeId: true, requestName: true },
          },
        },
      })
    )
  );
}

function handleError(res, error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.message?.includes("Request Types Not Found")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}


export const getQueue = async (req, res) => {
  try {
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      'Asia/Manila'
    );
    const { studentId, referenceNumber } = req.query;
    console.log('Student ID:', studentId);
    console.log('Reference Number:', referenceNumber);
    if (!studentId?.trim() || !referenceNumber?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    let whereClause = {
      queueDate: todayUTC,
      isActive: true,
      queueStatus: Status.WAITING,
    };

    if (studentId) {
      whereClause.schoolId = studentId;
    } else if (referenceNumber) {
      whereClause.referenceNumber = referenceNumber;
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

export const getQueueStatus = async (req, res) => {
  const { schoolId } = req.params;

  try {
    const studentQueue = await prisma.queue.findFirst({
      where: {
        schoolId,
        isActive: true,
      },
      select: {
        queueId: true,
        queueNumber: true,
        queueStatus: true,
        queueSessionId: true,
        queueType: true,
      },
    });

    if (!studentQueue) {
      return res
        .status(404)
        .json({ success: false, message: 'Student not found in queue' });
    }
    const aheadCount = await prisma.queue.count({
      where: {
        queueSessionId: studentQueue.queueSessionId,
        queueType: studentQueue.queueType,
        isActive: true,
        queueStatus: 'WAITING',
        queueNumber: { lt: studentQueue.queueNumber },
      },
    });
    const response = {
      success: true,
      message: 'Queue status received successfully',
      data: {
        queueNumber: studentQueue.queueNumber,
        position: aheadCount + 1,
        status: studentQueue.queueStatus,
      },
    };
    res.json(response);
  } catch (error) {
    res.stattus(500).json({ message: 'Server error' });
  }
};

//View Queue Page in figma (student)
export const getQueueOverview = async (req, res) => {
  const { schoolId } = req.params;

  try {
    //Your Information
    const studentQueue = await prisma.queue.findFirst({
      where: {
        schoolId,
        isActive: true,
      },
      select: {
        queueId: true,
        queueNumber: true,
        queueStatus: true,
        queueSessionId: true,
        queueType: true,
        studentFullName: true,
        schoolId: true,
        requests: {
          select: {
            requestId: true,
            requestType: {
              select: { requestName: true },
            },
          },
        },
      },
    });

    if (!studentQueue)
      return res
        .status(404)
        .json({ success: false, message: 'Student not found in queue' });
    console.log('Student Queue:', studentQueue);
    //Queue Status
    const currentServing = await prisma.queue.findMany({
      where: {
        queueSessionId: studentQueue.queueSessionId,
        queueStatus: 'IN_SERVICE',
        isActive: true,
      },
      select: {
        queueNumber: true,
        queueType: true,
        windowId: true,
      },
    });
    console.log('Current Serving:', currentServing);
    //Next in Line(window 1 = all regular)
    const window1Next = await prisma.queue.findFirst({
      where: {
        queueSessionId: studentQueue.queueSessionId,
        queueStatus: 'WAITING',
        isActive: true,
        queueType: 'REGULAR',
        windowId: 1,
      },
      orderBy: { queueNumber: 'asc' },
      select: {
        queueNumber: true,
        queueType: true,
        windowId: true,
      },
    });
    //Next in Line (window 2 = prioritize priority queueType)
    let window2Next = await prisma.queue.findFirst({
      where: {
        queueSessionId: studentQueue.queueSessionId,
        queueStatus: 'WAITING',
        isActive: true,
        queueType: 'PRIORITY',
        windowId: 2,
      },
      orderBy: { queueNumber: 'asc' },
      select: {
        queueNumber: true,
        queueType: true,
        windowId: true,
      },
    });
    //If no priority is waiting, go back to regular
    if (!window2Next) {
      window2Next = await prisma.queue.findFirst({
        where: {
          queueSessionId: studentQueue.queueSessionId,
          queueStatus: 'WAITING',
          isActive: true,
          queueType: 'REGULAR',
          windowId: 1,
        },
        orderBy: { queueNumber: 'asc' },
        select: {
          queueNumber: true,
          queueType: true,
          windowId: true,
        },
      });
    }

    //totals for regular & priority
    const [regularCount, priorityCount] = await Promise.all([
      prisma.queue.count({
        where: {
          queueSessionId: studentQueue.queueSessionId,
          queueStatus: 'WAITING',
          queueType: 'REGULAR',
          isActive: true,
        },
      }),
      prisma.queue.count({
        where: {
          queueSessionId: studentQueue.queueSessionId,
          queueStatus: 'WAITING',
          queueType: 'PRIORITY',
          isActive: true,
        },
      }),
    ]);

    const aheadCount = await prisma.queue.count({
      where: {
        queueSessionId: studentQueue.queueSessionId,
        queueType: studentQueue.queueType,
        isActive: true,
        queueStatus: 'WAITING',
        queueNumber: { lt: studentQueue.queueNumber },
      },
    });

    return res.json({
      success: true,
      message: 'Queue overview fetched successfully',
      data: {
        student: {
          fullName: studentQueue.studentFullName,
          studentId: studentQueue.schoolId,
          queueNumber: studentQueue.queueNumber,
          queueType: studentQueue.queueType,
          position: aheadCount + 1,
          status: studentQueue.queueStatus,
          services: studentQueue.requests.map((r) => r.requestType.requestName),
        },
        currentServing,
        window1: window1Next || null,
        window2: window2Next || null,
        totals: {
          regularWaiting: regularCount,
          priorityWaiting: priorityCount,
        },
      },
    });
  } catch (error) {
    console.error('Error in Getting Overview:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
  }
};

// Get Course Data
export const getCourseData = async (req, res) => {
  try {
    const courseData = await prisma.course.findMany({
      orderBy: {
        courseId: 'asc',
      },
      select: {
        courseId: true,
        courseCode: true,
        courseName: true,
      },
    });

    if (!courseData)
      return res.status(403).json({
        success: false,
        message: 'Error in fetching course data',
      });

    return res.status(200).json({
      success: true,
      message: 'Course data fetched successfully!',
      courseData: courseData,
    });
  } catch (error) {
    console.error('Error in Course Route: ', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error!',
    });
  }
};

// Get Request Types
export const getRequestTypes = async (req, res) => {
  try {
    const requestTypes = await prisma.requestType.findMany({
      orderBy: {
        requestTypeId: 'asc',
      },
      select: {
        requestTypeId: true,
        requestName: true,
      },
    });
    if (!requestTypes)
      return res.status(403).json({
        success: false,
        message: 'An error occurred when fetching request types',
      });

    return res.status(200).json({
      success: true,
      message: 'Successfully fetched reqeust Types',
      requestType: requestTypes,
    });
  } catch (error) {
    console.error('Error in Request ROute: ', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error!',
    });
  }
};

//for Display Queue Number(Prio and Reg) in Figma
// export const getQueueDisplay = async (req, res) => {
//   try {
//     const { queueId: queueIdStr, referenceNumber } = req.params;

//     if (!referenceNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Reference number is required",
//       });
//     }

//     // Find the queue
//     const queue = await prisma.queue.findUnique({
//       where: { referenceNumber },
//       include: {
//         requests: {
//           where: { isActive: true },
//           select: {
//             requestId: true,
//             requestStatus: true,
//             requestType: {
//               select: { requestName: true },
//             },
//           },
//         },
//         session: {
//           select: {
//             sessionId: true,
//             sessionNumber: true,
//             maxQueueNo: true,
//           },
//         },
//       },
//     });

//     if (!queue) {
//       return res.status(404).json({
//         success: false,
//         message: "Queue not found",
//       });
//     }

//     // Build response like generateQueue
//     return res.status(200).json({
//       success: true,
//       message: "Queue details fetched successfully!",
//       data: {
//         queueDetails: {
//           queueId: queue.queueId,
//           queueNumber: queue.queueNumber,
//           formattedQueueNumber: queue.queueNumber
//             ? queue.queueNumber.toString().padStart(3, "0")
//             : null,
//           queueType: queue.queueType,
//           queueStatus: queue.queueStatus,
//           referenceNumber: queue.referenceNumber,
//           studentId: queue.studentId,
//           studentFullName: queue.studentFullName,
//           courseCode: queue.courseCode,
//           courseName: queue.courseName,
//           yearLevel: queue.yearLevel,
//           createdAt: queue.createdAt,

//           sessionInfo: queue.session,
//           serviceRequests: queue.requests.map((r) => ({
//             requestId: r.requestId,
//             requestName: r.requestType.requestName,
//             requestStatus: r.requestStatus,
//           })),
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching queue detail:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

export const getQueueDisplay = async (req, res) => {
  try {
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      'Asia/Manila'
    );
    const { queueId: queueIdStr } = req.params;
    const { referenceNumber } = req.query;
    if (!queueIdStr) {
      return res.status(400).json({
        success: false,
        message: 'Missing required param. (queueId,)',
      });
    }

    const decryptedQueueId = decryptQueueId(queueIdStr);
    if (!decryptQueueId) {
      return res.status(400).json({
        success: false,
        message: 'Bad Request, queueId was not decrypted properly',
      });
    }

    if (!isIntegerParam(decryptedQueueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid param. 'queueId' must be an integer.",
      });
    }
    const queueId = Number(decryptedQueueId);

    if (isNaN(queueId)) {
      return res.sttaus(400).json({
        success: false,
        message:
          'An error occurred. Expecting a number but recieved a string. (queueId)',
      });
    }

    let whereClause = {
      queueId: queueId,
      session: {
        sessionDate: todayUTC,
      },
      isActive: true,
      queueStatus: Status.WAITING,
    };

    if (referenceNumber) {
      whereClause.referenceNumber = referenceNumber;
    }

    const newQueue = await prisma.queue.findFirst({
      where: whereClause,
      select: {
        queueId: true,
        studentId: true,
        studentFullName: true,
        // courseCode: true,
        // yearLevel: true,
        queueNumber: true,
        queueType: true,
        queueStatus: true,
        referenceNumber: true,
        isActive: true,
        windowId: true,
        createdAt: true,
        requests: {
          select: {
            requestId: true,
            requestStatus: true,
            requestType: {
              select: {
                requestName: true,
              },
            },
          },
        },
      },
    });

    if (!newQueue) {
      return res.status(404).json({
        success: false,
        message: 'Error Occured. Queue Not Found',
      });
    }

    const queuePrefix =
      newQueue.queueType === Queue_Type.REGULAR
        ? 'R'
        : newQueue.queueType === Queue_Type.PRIORITY
        ? 'P'
        : 'U';
    const formattedQueueNumber = formatQueueNumber(
      queuePrefix,
      newQueue.queueNumber
    );
    return res.status(200).json({
      success: true,
      message: 'Queue fetched successfully!',
      queue: {
        queueDetails: {
          ...newQueue,
          formattedQueueNumber,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch queue',
    });
  }
};

export const searchQueue = async (req, res) => {
  try {
    const { studentId, referenceNumber } = req.query;

    if (!studentId && !referenceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either studentId or referenceNumber',
      });
    }

    let queues;

    if (referenceNumber) {
      const queue = await prisma.queue.findUnique({
        where: {
          referenceNumber,
          isActive: true,
        },
        include: {
          session: true,
          serviceWindow: true,
          requests: {
            where: { isActive: true },
            include: {
              requestType: true,
            },
          },
        },
      });

      if (!queue) {
        return res.status(404).json({
          success: false,
          message: 'Queue not found with this reference number',
        });
      }

      queues = [queue];
    }
    // Search by studentId (returns multiple queues)
    else if (studentId) {
      queues = await prisma.queue.findMany({
        where: {
          studentId,
          isActive: true,
        },
        include: {
          session: true,
          serviceWindow: true,
          requests: {
            where: { isActive: true },
            include: {
              requestType: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (queues.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No queues found for this student ID',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: queues,
    });
  } catch (error) {
    console.error('Error searching queue:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching queue',
      error: error.message,
    });
  }
};

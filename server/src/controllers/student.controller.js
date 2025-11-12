import { Queue_Type, Status } from '@prisma/client';
import prisma from '../../prisma/prisma.js';
import DateAndTimeFormatter from '../../utils/DateAndTimeFormatter.js';
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
    if (
      !fullName?.trim() ||
      !studentId?.trim() ||
      !courseCode?.trim() ||
      !yearLevel?.trim() ||
      !queueType?.trim()
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    // Student ID format (8 digits)
    const regexId = /^\d{8}$/;
    if (!regexId.test(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student id format. Must be 8 digits.',
      });
    }

    const validYearLevels = [
      '1st',
      '2nd',
      '3rd',
      '4th',
      '5th',
      '6th',
      'Irregular',
      'First Year',
      'Second Year',
      'Third Year',
      'Fourth Year',
      'Fifth Year',
      'Sixth Year',
    ];

    // Normalize year level for internal storage (optional)
    const normalizedYearLevel = (() => {
      switch (yearLevel) {
        case 'First Year':
          return '1st';
        case 'Second Year':
          return '2nd';
        case 'Third Year':
          return '3rd';
        case 'Fourth Year':
          return '4th';
        case 'Fifth Year':
          return '5th';
        case 'Sixth Year':
          return '6th';
        default:
          return yearLevel;
      }
    })();

    if (!validYearLevels.includes(yearLevel)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid year level' });
    }
    // Course validation
    const course = await prisma.course.findFirst({
      where: {
        courseId: Number(courseId),
        courseCode: { equals: courseCode, mode: 'insensitive' },
        isActive: true,
      },
      select: { courseId: true, courseCode: true, courseName: true },
    });

    if (!course)
      return res
        .status(404)
        .json({ success: false, message: 'Course not found or inactive' });

    // Validate service requests
    if (!serviceRequests?.length)
      return res
        .status(400)
        .json({ success: false, message: 'Service requests are required' });

    const validQueueTypes = [
      Queue_Type.REGULAR.toLowerCase(),
      Queue_Type.PRIORITY.toLowerCase(),
    ];
    if (!validQueueTypes.includes(queueType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Queue Type! Must be REGULAR or PRIORITY',
      });
    }

    const QUEUETYPE =
      queueType.toUpperCase() === Queue_Type.REGULAR
        ? Queue_Type.REGULAR
        : queueType.toUpperCase() === Queue_Type.PRIORITY
        ? Queue_Type.PRIORITY
        : 'Unknown';

    // =================== TRANSACTION ===================
    return await prisma.$transaction(
      async (tx) => {
        const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
          new Date(),
          'Asia/Manila'
        );

        // Advisory lock to prevent session race conditions
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('queue_session_lock'))`;

        // Find or create today's active session
        let session = await tx.queueSession.findFirst({
          where: {
            sessionDate: todayUTC,
            isAcceptingNew: true,
            isServing: true,
            isActive: true,
          },
          orderBy: { sessionNumber: 'desc' },
        });

        if (!session) {
          const lastSession = await tx.queueSession.findFirst({
            where: { sessionDate: todayUTC },
            orderBy: { sessionNumber: 'desc' },
          });

          const nextSessionNumber = lastSession
            ? lastSession.sessionNumber + 1
            : 1;
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

        // =================== QUEUE NUMBER & AUTO-WRAP ===================
        // const counterField =
        //   QUEUETYPE === Queue_Type.REGULAR ? "regularCount" : "priorityCount";

        // const updatedSession = await tx.queueSession.update({
        //   where: { sessionId: session.sessionId },
        //   data: { [counterField]: { increment: 1 } },
        //   select: { regularCount: true, priorityCount: true, maxQueueNo: true },
        // });

        // const currentCount =
        //   QUEUETYPE === Queue_Type.REGULAR
        //     ? updatedSession.regularCount
        //     : updatedSession.priorityCount;
        // const queueNumber =
        //   ((currentCount - 1) % updatedSession.maxQueueNo) + 1;
        // const resetIteration = Math.floor(
        //   (currentCount - 1) / updatedSession.maxQueueNo
        // );

        // console.log({
        //   currentCount,
        //   queueNumber,
        //   resetIteration
        // })

        // =================== QUEUE NUMBER & MANUAL/ AUTO-WRAP ===================
        const counterField =
          QUEUETYPE === Queue_Type.REGULAR ? 'regularCount' : 'priorityCount';

        // Increment normal counter (sequence still grows)
        const updatedSession = await tx.queueSession.update({
          where: { sessionId: session.sessionId },
          data: { [counterField]: { increment: 1 } },
          select: { regularCount: true, priorityCount: true, maxQueueNo: true },
        });

        const currentCount =
          QUEUETYPE === Queue_Type.REGULAR
            ? updatedSession.regularCount
            : updatedSession.priorityCount;

        // 🧩 Check if manual reset is active
        const manualResetInfo = req.app.get('manualResetTriggered') || {};
        const manualReset = manualResetInfo[QUEUETYPE];

        let queueNumber;
        let resetIteration;

        // Check if manual reset exists AND has a valid resetAtSequence AND current count is after reset
        if (
          manualReset &&
          manualReset.resetAtSequence !== null &&
          manualReset.resetAtSequence !== undefined &&
          currentCount > manualReset.resetAtSequence
        ) {
          // We're AFTER a manual reset
          // Calculate how far we are from the reset point
          const countSinceReset = currentCount - manualReset.resetAtSequence;
          queueNumber = ((countSinceReset - 1) % updatedSession.maxQueueNo) + 1;
          resetIteration =
            manualReset.iteration +
            Math.floor((countSinceReset - 1) / updatedSession.maxQueueNo);
        } else {
          // Normal behavior: no manual reset active, or we're before the reset point
          queueNumber = ((currentCount - 1) % updatedSession.maxQueueNo) + 1;
          resetIteration = Math.floor(
            (currentCount - 1) / updatedSession.maxQueueNo
          );
        }

        console.log({
          currentCount,
          queueNumber,
          resetIteration,
          manualResetActive: manualReset?.resetAtSequence !== null,
          resetAtSequence: manualReset?.resetAtSequence,
          countSinceReset: manualReset?.resetAtSequence
            ? currentCount - manualReset.resetAtSequence
            : null,
        });

        // =================== CREATE QUEUE ===================
        const refNumber = generateReferenceNumber(
          todayUTC,
          QUEUETYPE,
          currentCount,
          session.sessionNumber
        );

        const newQueue = await tx.queue.create({
          data: {
            sessionId: session.sessionId,
            studentId,
            studentFullName: fullName,
            courseCode: course.courseCode,
            courseName: course.courseName,
            yearLevel: normalizedYearLevel,
            queueNumber,
            sequenceNumber: currentCount, // atomic unique
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
        // Increment total session count
        await tx.queueSession.update({
          where: { sessionId: session.sessionId },
          data: { currentQueueCount: { increment: 1 } },
        });

        // =================== CREATE SERVICE REQUESTS ===================
        const reqTypeIds = serviceRequests.map((r) => r.requestTypeId);
        const existingRequestData = await tx.requestType.findMany({
          where: { requestTypeId: { in: reqTypeIds } },
        });
        const existingIds = existingRequestData.map((r) => r.requestTypeId);
        const invalidIds = reqTypeIds.filter((id) => !existingIds.includes(id));
        if (invalidIds.length > 0)
          throw new Error(`Request Types Not Found: ${invalidIds.join(', ')}`);

        const requests = await Promise.all(
          reqTypeIds.map((id) =>
            tx.request.create({
              data: {
                queueId: newQueue.queueId,
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

        // =================== FORMAT RESPONSE ===================
        const formattedQueueNumber = formatQueueNumber(
          QUEUETYPE === Queue_Type.PRIORITY ? 'P' : 'R',
          queueNumber
        );
        // io.emit(SocketEvents.QUEUE_CREATED, newQueueData);
        io.emit(SocketEvents.QUEUE_CREATED, {
          queueId: newQueue.queueId,
          referenceNumber: newQueue.referenceNumber,
        });
        // ✅ Add this line for SSE updates
        sendDashboardUpdate({
          message: 'New queue created',
          sessionId: session.sessionId,
        });
        sendLiveDisplayUpdate({
          message: 'New queue created',
          sessionId: session.sessionId,
        });
        return res.status(201).json({
          success: true,
          message: 'Queue Generated Successfully!',
          queueData: {
            queueId: encryptQueueId(newQueue.queueId),
            queueNumber: newQueue.queueNumber,
            formattedQueueNumber,
            queueType: newQueue.queueType,
            queueStatus: newQueue.queueStatus,
            referenceNumber: newQueue.referenceNumber,
          },
          // data: {
          //   queueDetails: {
          //     queueId: newQueue.queueId,
          //     queueNumber,
          //     formattedQueueNumber,
          //     sequenceNumber: currentCount,
          //     resetIteration,
          //     queueType: newQueue.queueType,
          //     queueStatus: newQueue.queueStatus,
          //     referenceNumber: newQueue.referenceNumber,
          //     studentId: newQueue.studentId,
          //     studentFullName: newQueue.studentFullName,
          //     courseCode: newQueue.courseCode,
          //     courseName: newQueue.courseName,
          //     yearLevel: newQueue.normalizedYearLevel,
          //   },
          //   sessionInfo: {
          //     sessionId: session.sessionId,
          //     sessionNumber: session.sessionNumber,
          //     currentCount: session.currentQueueCount + 1,
          //     maxQueueNo: session.maxQueueNo,
          //   },
          //   serviceRequests: requests.map((req) => ({
          //     requestId: req.requestId,
          //     requestTypeId: req.requestTypeId,
          //     requestName: req.requestType.requestName,
          //     requestStatus: req.requestStatus,
          //   })),
          // },
        });
      },
      { maxWait: 5000, timeout: 10000 }
    );
  } catch (error) {
    console.error('Error generating queue:', error);
    if (error.message?.includes('Request Types Not Found')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

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

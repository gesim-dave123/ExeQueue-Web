import { Queue_Type, Status } from '@prisma/client';
import prisma from '../../prisma/prisma.js';
import DateAndTimeFormatter from '../../utils/DateAndTimeFormatter.js';
import generateReferenceNumber from '../services/queue/generateReferenceNumber.js';
import { formatQueueNumber } from '../services/queue/QueueNumber.js';

export const generateQueue = async (req, res) => {
  try {
    const {
      fullName,
      studentId,
      courseId,
      courseCode,
      yearLevel, 
      queueType,
      serviceRequests,
    } = req.body;
    
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

    // Check student id format (8 digits)
    const regexId = /^\d{8}$/;
    if (!regexId.test(studentId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid student id' });
    }

    if (!['1st', '2nd', '3rd', '4th', '5th', '6th', 'Irregular'].includes(yearLevel)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid year level' });
    }

    const course = await prisma.course.findFirst({
      where: {
        courseCode: {
          equals: courseCode,
          mode: 'insensitive',
        },
        courseId: courseId,
        isActive: true,
      },
      select: {
        courseId: true,
        isActive: true
      } 
    });
    
    if (!course || !course.isActive) {
      return res
        .status(404)
        .json({ success: false, message: 'Course not found' });
    }

    if (!serviceRequests || !Array.isArray(serviceRequests) || serviceRequests.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Service requests are required and must be a non-empty array"
      });
    }

    if (![Queue_Type.REGULAR.toLowerCase(), Queue_Type.PRIORITY.toLowerCase()].includes(queueType.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: "Invalid Queue Type!"
      });
    }

    const QUEUETYPE = queueType.toLowerCase() === Queue_Type.REGULAR.toString().toLowerCase() 
      ? Queue_Type.REGULAR
      : Queue_Type.PRIORITY;

    return await prisma.$transaction(async(tx) => {
      // Get start of day in Manila timezone, converted to UTC for database storage
      const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(new Date(), 'Asia/Manila');
      
      // Debug logs to verify timezone handling
      const currentManilaTime = DateAndTimeFormatter.nowInTimeZone('Asia/Manila');
      const currentUTCTime = new Date();
      
      console.log('=== TIMEZONE DEBUG LOGS ===');
      console.log('Current UTC Time:', currentUTCTime.toISOString());
      console.log('Current Manila Time:', DateAndTimeFormatter.formatInTimeZone(currentManilaTime, 'yyyy-MM-dd HH:mm:ss zzz', 'Asia/Manila'));
      console.log('Manila Date Only:', DateAndTimeFormatter.formatInTimeZone(currentManilaTime, 'yyyy-MM-dd', 'Asia/Manila'));
      console.log('Today UTC (start of Manila day):', todayUTC.toISOString());
      console.log('Today UTC formatted as Manila:', DateAndTimeFormatter.formatInTimeZone(todayUTC, 'yyyy-MM-dd HH:mm:ss zzz', 'Asia/Manila'));
      console.log('=== END DEBUG LOGS ===');

      const activeSession = await tx.queueSession.findFirst({
        where: {
          sessionDate: todayUTC,
          isActive: true
        },
        orderBy: {
          sessionId: 'desc'
        },
        select: {
          sessionId: true,
          sessionNo: true,
        }
      });
      
      let session;
      if (activeSession) {
        session = activeSession;
      } else {
        session = await tx.queueSession.create({
          data: { 
            sessionNo: 1, 
            sessionDate: todayUTC 
          },
          select: {
            sessionId: true,
            sessionNo: true
          }
        });
      }
      
      const sessionId = session.sessionId;
      const sessionNo = session.sessionNo;
      
      let attempt = 0;
      let maxRetries = 3;
      let newQueue = null;
      
      while (attempt < maxRetries && !newQueue) {
        try {
          const latest = await tx.queue.findFirst({
            where: {
              queueType: QUEUETYPE,
              queueDate: todayUTC,
              queueSessionId: sessionId
            },
            orderBy: {
              queueNumber: 'desc'
            },
            select: {
              queueNumber: true
            }
          });
          
          if (!latest) console.log("There is no current queue number, default 0 will be applied");
          
          const nextNumber = (latest?.queueNumber ?? 0) + 1;
          const refNumber = generateReferenceNumber(todayUTC, QUEUETYPE, nextNumber, sessionNo);
          
          newQueue = await tx.queue.create({
            data: {
              schoolId: studentId,
              studentFullName: fullName,
              courseId: courseId,
              yearLevel: yearLevel,
              queueNumber: nextNumber,
              queueType: QUEUETYPE,
              queueDate: todayUTC,
              queueSessionId: sessionId,
              referenceNumber: refNumber 
            }
          });
          
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            attempt++;
            console.warn(`Queue conflict detected, retrying... (attempt: ${attempt})`);
            continue;
          }
          throw error;
        }
      }

      const formattedQueueNumber = formatQueueNumber(QUEUETYPE === Queue_Type.PRIORITY ? 'P' : 'R', newQueue.queueNumber);
      const reqTypeIds = serviceRequests.map(r => r.requestTypeId);
      const existingRequestData = await tx.requestType.findMany({
        where: { requestTypeId: { in: reqTypeIds } },
        select: { requestTypeId: true }
      });

      const existingIds = existingRequestData.map(r => r.requestTypeId);
      const invalidIds = reqTypeIds.filter(id => !existingIds.includes(id));
      
      if (invalidIds.length > 0) {
        throw new Error(`Request Types Not Found: ${invalidIds.join(', ')}`);
      }
      
      const requests = await Promise.all(
        reqTypeIds.map(id =>
          tx.request.create({
            data: {
              queueId: newQueue.queueId,
              requestTypeId: id,
              processedBy: null,
              requestStatus: null,
              processedAt: null,
              isActive: true
            }
          })
        )
      );

      if (!newQueue) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate queue after multiple retries"
        });
      }

      if (!requests) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate requests"
        });
      }
      return res.status(201).json({
        success: true,
        message: "Queue Generated Successfully!",
        data: { queueDetails: newQueue, queueNumber: formattedQueueNumber, serviceRequests: requests }
      });
    });

  } catch (error) {
    console.error("Error generating queue:", error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
  }
};


export const getQueue = async (req, res) => {
  try {
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(new Date(), 'Asia/Manila');
    const {studentId, referenceNumber} = req.query;
    console.log("Student ID:", studentId);
    console.log("Reference Number:", referenceNumber);
    if(!studentId?.trim() || !referenceNumber?.trim()){
      return res.status(400).json({success: false, message: "Missing required fields"});
    }

    let whereClause = {
      queueDate: todayUTC,
      isActive: true,
      queueStatus: Status.WAITING
    };

     if (studentId) {
      whereClause.schoolId = studentId;
    } else if (referenceNumber) {
      whereClause.referenceNumber = referenceNumber;
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


export const getQueueStatus = async (req, res) => {
  const { schoolId} = req.params;

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
    console.log("Student Queue:", studentQueue)
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
    console.log("Current Serving:", currentServing)
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
    console.error("Error in Getting Overview:", error)
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
export const getRequestTypes = async(req,res) =>{
  try {
    
    const requestTypes = await prisma.requestType.findMany({
      orderBy:{
        requestTypeId: "asc"
      },
      select:{
        requestTypeId: true,
        requestName: true,
      }
    })
    if(!requestTypes) return res.status(403).json({success: false, message: "An error occurred when fetching request types"})

    return res.status(200).json({
      success: true,
      message: "Successfully fetched reqeust Types",
      requestType: requestTypes
    })

  } catch (error) {
    console.error("Error in Request ROute: ", error)
    return res.status(500).json({
      success:false,
      message: "Internal Server Error!"
    })
  }
}

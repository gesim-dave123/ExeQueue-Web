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

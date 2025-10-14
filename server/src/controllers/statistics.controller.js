import { Queue_Type, Status } from '@prisma/client';
import prisma from '../../prisma/prisma.js';
import DateAndTimeFormatter from '../../utils/DateAndTimeFormatter.js';
import { formatQueueNumber } from '../services/queue/QueueNumber.js';

export const getDashboardStatistics = async (req, res) => {
  try {
    // 1) Get current active session for today
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      'Asia/Manila'
    );

    const activeSession = await prisma.queueSession.findFirst({
      where: { sessionDate: todayUTC, isActive: true },
      select: {
        sessionId: true,
        sessionNumber: true,
      },
      orderBy: { sessionNumber: 'desc' },
    });

    if (!activeSession) {
      // No active session — return empty/zeroed dashboard
      return res.status(200).json({
        success: true,
        message: 'No active session found. Dashboard empty.',
        dashboardOverview: {
          session: null,
          windows: [
            { windowNo: 1, currentServing: null, nextInLine: [] },
            { windowNo: 2, currentServing: null, nextInLine: [] },
          ],
          totals: {
            totalRegularWaiting: 0,
            totalPriorityWaiting: 0,
            completed: 0,
            inProgress: 0,
            totalQueueToday: 0,
          },
        },
      });
    }
    const sessionId = activeSession.sessionId;

    // 2) Get window info for windowNo 1 and 2 (if exists)
    const windows = await prisma.serviceWindow.findMany({
      where: { windowNo: { in: [1, 2] }, isActive: true },
      select: {
        windowId: true,
        windowNo: true,
        windowName: true,
        displayName: true,
        canServePriority: true,
        canServeRegular: true,
      },
      orderBy: { windowNo: 'asc' },
    });

    // Ensure we have placeholder entries for windows 1 & 2 in correct order
    const windowsByNo = { 1: null, 2: null };
    for (const w of windows) windowsByNo[w.windowNo] = w;

    // 3) For each window: get current serving (IN_SERVICE) and next 2 in line (WAITING)
    const windowResults = await Promise.all(
      [1, 2].map(async (winNo) => {
        const win = windowsByNo[winNo];

        if (!win) {
          return {
            windowNo: winNo,
            currentServing: null,
            nextInLine: [],
          };
        }
        const currentServing = await prisma.queue.findFirst({
          where: {
            sessionId: sessionId,
            windowId: win.windowId,
            queueStatus: Status.IN_SERVICE,
            isActive: true,
          },
          select: {
            queueId: true,
            queueNumber: true,
            queueType: true,
            studentFullName: true,
            studentId: true,
            calledAt: true,
          },
          orderBy: { calledAt: 'desc' },
        });

        const formattedCurrent = currentServing
          ? {
              queueId: currentServing.queueId,
              queueNumber: currentServing.queueNumber,
              formattedQueueNumber: formatQueueNumber(
                currentServing.queueType,
                currentServing.queueNumber
              ),
              queueType: currentServing.queueType,
              studentFullName: currentServing.studentFullName,
              studentId: currentServing.studentId,
              calledAt: currentServing.calledAt,
            }
          : null;
        const nextInLineRaw = await prisma.queue.findMany({
          where: {
            sessionId: sessionId,
            queueStatus: Status.WAITING,
            isActive: true,
          },
          orderBy: [{ queueType: 'asc' }, { queueNumber: 'asc' }],
          take: 2,
          select: {
            queueId: true,
            queueNumber: true,
            queueType: true,
            studentFullName: true,
            studentId: true,
          },
        });
        const nextInLine = nextInLineRaw.map((q) => ({
          queueId: q.queueId,
          queueNumber: q.queueNumber,
          formattedQueueNumber: formatQueueNumber(q.queueType, q.queueNumber),
          queueType: q.queueType,
          studentFullName: q.studentFullName,
          studentId: q.studentId,
        }));
        return {
          windowNo: winNo,
          windowId: win.windowId,
          windowName: win.windowName,
          displayName: win.displayName,
          currentServing: formattedCurrent,
          nextInLine,
        };
      })
    );
    const [
      totalRegularWaiting,
      totalPriorityWaiting,
      completedCount,
      inProgressCount,
      totalQueueToday,
    ] = await Promise.all([
      prisma.queue.count({
        where: {
          sessionId,
          queueType: Queue_Type.REGULAR,
          queueStatus: Status.WAITING,
          isActive: true,
        },
      }),
      prisma.queue.count({
        where: {
          sessionId,
          queueType: Queue_Type.PRIORITY,
          queueStatus: Status.WAITING,
          isActive: true,
        },
      }),
      prisma.queue.count({
        where: {
          sessionId,
          queueStatus: Status.COMPLETED,
          isActive: true,
        },
      }),
      prisma.queue.count({
        where: {
          sessionId,
          queueStatus: Status.IN_SERVICE,
          isActive: true,
        },
      }),
      prisma.queue.count({
        where: {
          sessionId,
          isActive: true,
        },
      }),
    ]);

    const dashboardOverview = {
      session: {
        sessionId: sessionId,
        sessionNumber: activeSession.sessionNumber,
      },
      windows: windowResults,
      totals: {
        totalRegularWaiting,
        totalPriorityWaiting,
        completed: completedCount,
        inProgress: inProgressCount,
        totalQueueToday,
      },
    };
    return res.status(200).json({
      success: true,
      message: 'Dashboard statistics fetched successfully',
      dashboardOverview,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
  }
};

export const getAnalyticsData = async (req, res) => {
  try {
    // Calculate week range (Monday to Saturday)
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    saturday.setHours(23, 59, 59, 999);

    console.log(' Week Range:', monday, 'to', saturday);

    // ---  FETCH QUEUES PER DAY ---
    const allQueues = await prisma.queueSession.findMany({
      where: {
        createdAt: {
          gte: monday,
          lte: saturday,
        },
      },
      select: {
        regularCount: true,
        priorityCount: true,
        sessionDate: true,
      },
    });

    console.log('Found queues:', allQueues.length);

    const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const getDayName = (date) => {
      const dayIndex = date.getDay();
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      return DAYS_OF_WEEK[adjustedIndex];
    };

    // Combine queues by date
    const combineQueuesByDate = Object.values(
      allQueues.reduce((acc, curr) => {
        const day = getDayName(new Date(curr.sessionDate));

        if (!acc[day]) {
          acc[day] = {
            day: day,
            totalRegular: 0,
            totalPriority: 0,
          };
        }

        acc[day].totalRegular += curr.regularCount || 0;
        acc[day].totalPriority += curr.priorityCount || 0;

        return acc;
      }, {})
    );

    //  Ensure all days are included (bisag walay data)
    const queueSummary = DAYS_OF_WEEK.map(day => {
      const existing = combineQueuesByDate.find(item => item.day === day);
      return existing || {
        day,
        totalRegular: 0,
        totalPriority: 0,
        totalQueues: 0,
      };
    }).map(item => ({
      day: item.day,
      totalRegular: item.totalRegular,
      totalPriority: item.totalPriority,
      totalQueues: item.totalRegular + item.totalPriority,
    }));

    console.log('Queue Summary:', queueSummary);

    // --- FETCH REQUESTS OF THE WEEK ---
    const allRequestOfTheWeek = await prisma.request.findMany({
      where: {
        createdAt: {
          gte: monday,
          lte: saturday,
        },
        requestStatus: 'COMPLETED', 
      },
      select: {
        createdAt: true,
        requestTypeId: true,
      },
    });

    console.log('Found requests:', allRequestOfTheWeek.length);

    // --- GROUP REQUESTS BY REQUEST TYPE (Weekly total) ---
    const requestTypeMap = new Map();
    allRequestOfTheWeek.forEach(req => {
      const typeId = req.requestTypeId;
      requestTypeMap.set(typeId, (requestTypeMap.get(typeId) || 0) + 1);
    });

    // Fetch request type names
    const requestTypes = await prisma.requestType.findMany();
    const typeIdToNameMap = new Map(requestTypes.map(rt => [rt.requestTypeId, rt.requestName]));

    const weeklyRequestBreakdown = Array.from(requestTypeMap, ([typeId, total]) => ({
      requestTypeId: typeId,
      requestType: typeIdToNameMap.get(typeId) || 'Unknown',
      total,
    }));

    console.log('Weekly Request Breakdown:', weeklyRequestBreakdown);

    // --- GROUP REQUESTS BY DAY AND REQUEST TYPE ---
    const dayRequestMap = {};
    DAYS_OF_WEEK.forEach(day => {
      dayRequestMap[day] = {};
    });

    allRequestOfTheWeek.forEach(req => {
      const day = getDayName(new Date(req.createdAt));
      const typeId = req.requestTypeId;
      const typeName = typeIdToNameMap.get(typeId) || 'Unknown';

      if (!dayRequestMap[day][typeName]) {
        dayRequestMap[day][typeName] = 0;
      }
      dayRequestMap[day][typeName] += 1;
    });

    // Convert to array format
    const everydayRequestBreakdown = [];
    Object.entries(dayRequestMap).forEach(([day, requests]) => {
      Object.entries(requests).forEach(([requestType, requestTotal]) => {
        everydayRequestBreakdown.push({
          day,
          requestType,
          requestTotal,
        });
      });
    });

    console.log('Everyday Request Breakdown:', everydayRequestBreakdown);

    return res.status(200).json({
      success: true,
      message: 'Successfully fetched analytics data',
      weekRange: {
        from: monday,
        to: saturday,
      },
      data: {
        queueSummary,
        weeklyRequestBreakdown,
        everydayRequestBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};


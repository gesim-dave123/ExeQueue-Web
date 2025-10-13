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

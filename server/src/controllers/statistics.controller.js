import { Queue_Type, Status } from '@prisma/client';
import prisma from '../../prisma/prisma.js';
import DateAndTimeFormatter from '../../utils/DateAndTimeFormatter.js';
import { sortByPriorityPattern } from '../../utils/SortByPriorityPattern.js';
import { addClient, broadcast } from '../../utils/SseManager.js';
import { formatQueueNumber } from '../services/queue/QueueNumber.js';

export const getDashboardStatistics = async (req, res) => {
  try {
    // ✅ AUTO-UPDATE: SKIPPED → CANCELLED after 1 hour
    // const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // await prisma.queue.updateMany({
    //   where: {
    //     queueStatus: Status.SKIPPED,
    //     updatedAt: { lt: oneHourAgo },
    //     isActive: true,
    //   },
    //   data: {
    //     queueStatus: Status.CANCELLED,
    //     updatedAt: new Date(),
    //   },
    // });

    // Get current date in Asia/Manila timezone
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      'Asia/Manila'
    );

    // 1) Find the active session (for dashboard view)
    const activeSession = await prisma.queueSession.findFirst({
      where: { sessionDate: todayUTC, isServing: true, isActive: true },
      select: { sessionId: true, sessionNumber: true },
      orderBy: { sessionNumber: 'asc' },
    });

    // 2) Get ALL today's sessions (for totals)
    const allSessionsToday = await prisma.queueSession.findMany({
      where: { sessionDate: todayUTC, isServing: true, isActive: true },
      select: { sessionId: true },
    });

    const sessionIds = allSessionsToday.map((s) => s.sessionId);

    if (!activeSession || sessionIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active session found. Dashboard empty.',
        data: {
          session: null,
          windows: [
            {
              windowNo: 1,
              // displayName: "Window 1",
              currentServing: null,
              // nextInLine: [],
            },
            {
              windowNo: 2,
              // displayName: "Window 2",
              currentServing: null,
              // nextInLine: [],
            },
          ],
          totals: {
            totalRegular: 0,
            totalPriority: 0,
            completed: 0,
            inProgress: 0,
            totalQueueToday: 0,
          },
        },
      });
    }

    const sessionId = activeSession.sessionId;

    // ✅ 3) Get window info for windows 1 & 2
    const windows = await prisma.serviceWindow.findMany({
      where: { windowNo: { in: [1, 2] }, isActive: true },
      select: {
        windowId: true,
        windowNo: true,
        windowName: true,
        // displayName: true,
        // canServePriority: true,
        // canServeRegular: true,
      },
      orderBy: { windowNo: 'asc' },
    });

    // Map windows by number for clean access
    const windowsByNo = { 1: null, 2: null };
    for (const w of windows) windowsByNo[w.windowNo] = w;

    const windowResults = await Promise.all(
      [1, 2].map(async (winNo) => {
        const win = windowsByNo[winNo];
        if (!win) {
          return {
            windowNo: winNo,
            currentServing: null,
          };
        }

        // Only look for IN_SERVICE queues - show them regardless of waiting queue count
        let currentServing = await prisma.queue.findFirst({
          where: {
            windowId: win.windowId,
            queueStatus: Status.IN_SERVICE,
            isActive: true,
          },
          select: {
            queueId: true,
            queueNumber: true,
            queueType: true,
          },
          orderBy: { calledAt: 'desc' },
        });

        console.log('Current Serving for Window', winNo, ':', currentServing);

        const formattedCurrent = currentServing
          ? {
              queueId: currentServing.queueId,
              queueNumber: currentServing.queueNumber,
              formattedQueueNumber: formatQueueNumber(
                currentServing.queueType === 'PRIORITY' ? 'P' : 'R',
                currentServing.queueNumber
              ),
              queueType: currentServing.queueType,
            }
          : null;

        return {
          windowNo: winNo,
          windowId: win.windowId,
          currentServing: formattedCurrent,
        };
      })
    );

    // ✅ 5) Compute totals for *all* sessions today
    const [
      completedRegular,
      completedPriority,
      completedCount,
      totalQueueToday,
      inProgressCount,
    ] = await Promise.all([
      // Count of COMPLETED regular queues only
      prisma.queue.count({
        where: {
          sessionId: { in: sessionIds },
          queueType: Queue_Type.REGULAR,
          OR: [
            { queueStatus: Status.COMPLETED },
            { queueStatus: Status.PARTIALLY_COMPLETE },
            {
              queueStatus: Status.CANCELLED,
              calledAt: { not: null },
            },
          ],
          isActive: true,
        },
      }),
      // Count of COMPLETED priority queues only
      prisma.queue.count({
        where: {
          sessionId: { in: sessionIds },
          queueType: Queue_Type.PRIORITY,
          OR: [
            { queueStatus: Status.COMPLETED },
            { queueStatus: Status.PARTIALLY_COMPLETE },
            {
              queueStatus: Status.CANCELLED,
              calledAt: { not: null },
            },
          ],
          isActive: true,
        },
      }),
      // Total completed (all types)
      prisma.queue.count({
        where: {
          sessionId: { in: sessionIds },
          OR: [
            { queueStatus: Status.COMPLETED },
            { queueStatus: Status.PARTIALLY_COMPLETE },
            {
              queueStatus: Status.CANCELLED,
              calledAt: { not: null },
            },
          ],
          isActive: true,
        },
      }),
      // Total queues today
      prisma.queue.count({
        where: { sessionId: { in: sessionIds }, isActive: true },
      }),
      // In progress count (all non-completed queues)
      prisma.queue.count({
        where: {
          sessionId: { in: sessionIds },
          queueStatus: {
            notIn: [
              Status.COMPLETED,
              Status.PARTIALLY_COMPLETE,
              Status.CANCELLED,
            ],
          },
          isActive: true,
        },
      }),
    ]);

    // ✅ 7) Combine all data
    const dashboardOverview = {
      windows: windowResults,
      totals: {
        completedRegular,
        completedPriority,
        completed: completedCount,
        inProgress: inProgressCount,
        totalQueueToday,
      },
    };

    return res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully.',
      data: dashboardOverview,
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const streamDashboardUpdates = async (req, res) => {
  addClient('dashboard', req, res);
};
export const sendDashboardUpdate = async (data = {}) => {
  broadcast('dashboard', 'dashboard-update', data);
};

export const getLiveDisplayData = async (req, res) => {
  try {
    // ✅ Get current date in Asia/Manila timezone
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      'Asia/Manila'
    );

    //  1) Find the active session (for dashboard view)
    const activeSession = await prisma.queueSession.findFirst({
      where: { sessionDate: todayUTC, isServing: true, isActive: true },
      select: { sessionId: true, sessionNumber: true },
      orderBy: { sessionNumber: 'asc' },
    });

    //  2) Get ALL today's sessions (for totals)
    const allSessionsToday = await prisma.queueSession.findMany({
      where: { sessionDate: todayUTC, isServing: true, isActive: true },
      select: { sessionId: true },
    });

    const sessionIds = allSessionsToday.map((s) => s.sessionId);

    if (!activeSession || sessionIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active session found. Live Data empty.',
        data: {
          session: null,
          windows: [
            {
              windowNo: 1,
              // displayName: "Window 1",
              currentServing: null,
              // nextInLine: [],
            },
            {
              windowNo: 2,
              // displayName: "Window 2",
              currentServing: null,
              // nextInLine: [],
            },
          ],
          totals: {
            totalRegularWaiting: 0,
            totalPriorityWaiting: 0,
          },
        },
      });
    }

    const sessionId = activeSession.sessionId;

    // ✅ 3) Get window info for windows 1 & 2
    const windows = await prisma.serviceWindow.findMany({
      where: { windowNo: { in: [1, 2] }, isActive: true },
      select: {
        windowId: true,
        windowNo: true,
        windowName: true,
      },
      orderBy: { windowNo: 'asc' },
    });

    // Map windows by number for clean access
    const windowsByNo = { 1: null, 2: null };
    for (const w of windows) windowsByNo[w.windowNo] = w;

    // 🔹 Fetch per-window current serving
    const windowResults = await Promise.all(
      [1, 2].map(async (winNo) => {
        const win = windowsByNo[winNo];
        if (!win) {
          return { windowNo: winNo, currentServing: null };
        }

        const currentServing = await prisma.queue.findFirst({
          where: {
            windowId: win.windowId,
            queueStatus: Status.IN_SERVICE,
            isActive: true,
          },
          select: {
            queueId: true,
            queueNumber: true,
            queueType: true,
          },
          orderBy: { calledAt: 'desc' },
        });

        const formattedCurrent = currentServing
          ? {
              queueId: currentServing.queueId,
              queueNumber: currentServing.queueNumber,
              formattedQueueNumber: formatQueueNumber(
                currentServing.queueType === 'PRIORITY' ? 'P' : 'R',
                currentServing.queueNumber
              ),
              queueType: currentServing.queueType,
            }
          : null;

        return {
          windowNo: winNo,
          windowId: win.windowId,
          currentServing: formattedCurrent,
        };
      })
    );

    const lastServedTypeToAllWindows = windowResults.map(
      (w) => w.currentServing?.queueType
    );
    // Filter to only valid queue types
    const validTypes = lastServedTypeToAllWindows.filter(
      (type) => type === 'PRIORITY' || type === 'REGULAR'
    );

    let allPriority = false;
    let allRegular = false;

    if (validTypes.length > 0) {
      allPriority = validTypes.every((t) => t === 'PRIORITY');
      allRegular = validTypes.every((t) => t === 'REGULAR');
    }

    // console.log("All Priority:", allPriority);
    // console.log("All Regular:", allRegular);
    // console.log("Raw Types:", lastServedTypeToAllWindows);
    const lastServedType = allPriority
      ? Queue_Type.PRIORITY
      : allRegular
      ? Queue_Type.REGULAR
      : Queue_Type.PRIORITY;

    console.log('Determined last served type for alternation:', lastServedType);
    const nextInLineRaw = await prisma.queue.findMany({
      where: {
        session: {
          sessionDate: todayUTC,
          isServing: true,
          isActive: true,
        },
        queueStatus: Status.WAITING,
        isActive: true,
      },
      orderBy: [
        {
          session: {
            sessionNumber: 'asc',
          },
        },
        { sequenceNumber: 'asc' },
      ],
      // take: 10,
      // orderBy: [{ queueNumber: "asc" }], // keep raw order simple
      select: {
        queueId: true,
        queueNumber: true,
        queueType: true,
      },
    });
    console.log('Next in line (raw):', nextInLineRaw);

    // 🧠 Then apply your custom alternation logic
    const sortedNextInLine = sortByPriorityPattern(
      nextInLineRaw,
      lastServedType
    );

    // ✅ Format for frontend display
    const nextInLine = sortedNextInLine.slice(0, 4).map((q) => ({
      queueId: q.queueId,
      queueNumber: q.queueNumber,
      formattedQueueNumber: formatQueueNumber(
        q.queueType === 'PRIORITY' ? 'P' : 'R',
        q.queueNumber
      ),
      queueType: q.queueType,
    }));

    // ✅ 5) Compute totals for *all* sessions today
    const [totalRegularWaiting, totalPriorityWaiting] = await Promise.all([
      prisma.queue.count({
        where: {
          sessionId: { in: sessionIds },
          queueType: Queue_Type.REGULAR,
          queueStatus: Status.WAITING,
          isActive: true,
        },
      }),
      prisma.queue.count({
        where: {
          sessionId: { in: sessionIds },
          queueType: Queue_Type.PRIORITY,
          queueStatus: Status.WAITING,
          isActive: true,
        },
      }),
    ]);

    // ✅ 6) Combine all data
    const liveDataOverview = {
      windows: windowResults,
      totals: {
        totalRegularWaiting,
        totalPriorityWaiting,
        nextInLine,
      },
    };

    return res.status(200).json({
      success: true,
      message: 'Live Data statistics fetched successfully',
      data: liveDataOverview,
    });
  } catch (error) {
    console.error('❌ Error fetching live data stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const streamLiveDisplayUpdates = async (req, res) => {
  addClient('live-display', req, res);
};
export const sendLiveDisplayUpdate = async (data = {}) => {
  broadcast('live-display', 'live-display-update', data);
};

//weekly charts
export const getAnalyticsData = async (req, res) => {
  try {
    // ✅ Get current time in Manila timezone
    const nowManila = DateAndTimeFormatter.nowInTimeZone('Asia/Manila');
    const day = nowManila.getDay();

    // Calculate Monday of current week in Manila time
    const mondayManila = new Date(nowManila);
    mondayManila.setDate(nowManila.getDate() - day + (day === 0 ? -6 : 1));
    mondayManila.setHours(0, 0, 0, 0);

    // Calculate Saturday of current week in Manila time
    const saturdayManila = new Date(mondayManila);
    saturdayManila.setDate(mondayManila.getDate() + 5);
    saturdayManila.setHours(23, 59, 59, 999);

    // Convert to UTC for database query
    const monday = DateAndTimeFormatter.toUTC(mondayManila, 'Asia/Manila');
    const saturday = DateAndTimeFormatter.toUTC(saturdayManila, 'Asia/Manila');

    console.log('📅 Week Range (Manila):', mondayManila, 'to', saturdayManila);

    // ✅ Query ALL queues for bar graph (regardless of status)
    const allQueues = await prisma.queue.findMany({
      where: {
        createdAt: {
          gte: monday,
          lte: saturday,
        },
        isActive: true,
        OR: [
          { queueStatus: Status.COMPLETED },
          { queueStatus: Status.PARTIALLY_COMPLETE },
          {
            queueStatus: Status.CANCELLED,
            calledAt: {
              not: null,
            },
          },
        ],
      },
      select: {
        queueType: true,
        createdAt: true,
        calledAt: true,
      },
    });

    console.log('Found queues:', allQueues.length);

    const DAYS_OF_WEEK = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    // ✅ Use DateAndTimeFormatter for proper timezone conversion
    const getDayName = (date) => {
      const dayName = DateAndTimeFormatter.formatInTimeZone(
        new Date(date),
        'EEEE', // Full day name
        'Asia/Manila'
      );

      return dayName;
    };

    // ✅ Group ALL queues by day (for bar graph)
    const queuesByDay = allQueues.reduce((acc, queue) => {
      const day = getDayName(queue.createdAt);

      if (!acc[day]) {
        acc[day] = {
          day: day,
          totalRegular: 0,
          totalPriority: 0,
        };
      }

      if (queue.queueType === Queue_Type.REGULAR) {
        acc[day].totalRegular += 1;
      } else if (queue.queueType === Queue_Type.PRIORITY) {
        acc[day].totalPriority += 1;
      }

      return acc;
    }, {});

    // Ensure all days are included (even with 0 queues)
    const queueSummary = DAYS_OF_WEEK.map((day) => {
      const existing = queuesByDay[day];
      return existing
        ? {
            day: existing.day,
            totalRegular: existing.totalRegular,
            totalPriority: existing.totalPriority,
            totalQueues: existing.totalRegular + existing.totalPriority,
          }
        : {
            day,
            totalRegular: 0,
            totalPriority: 0,
            totalQueues: 0,
          };
    });

    console.log('Queue Summary:', queueSummary);

    const orderedRequestTypes = [
      'Good Moral Certificat',
      'Insurance',
      'Approval/Transmittal Letter',
      'Temporary Gate Pass',
      'Uniform Exception',
      'Enrollment/Transfer',
    ];

    // --- FETCH COMPLETED REQUESTS OF THE WEEK - ✅ COMPLETED ONLY ---
    const allRequestOfTheWeek = await prisma.request.findMany({
      where: {
        createdAt: {
          gte: monday,
          lte: saturday,
        },
        requestStatus: Status.COMPLETED,
      },
      select: {
        createdAt: true,
        requestTypeId: true,
      },
    });

    console.log('📊 Found COMPLETED requests:', allRequestOfTheWeek.length);

    // Fetch request type names
    const requestTypes = await prisma.requestType.findMany();
    const typeIdToNameMap = new Map(
      requestTypes.map((rt) => [rt.requestTypeId, rt.requestName])
    );
    const nameToIdMap = new Map(
      requestTypes.map((rt) => [rt.requestName, rt.requestTypeId])
    );

    // --- GROUP REQUESTS BY REQUEST TYPE (Weekly total) ---
    const requestTypeMap = new Map();
    allRequestOfTheWeek.forEach((req) => {
      const typeId = req.requestTypeId;
      requestTypeMap.set(typeId, (requestTypeMap.get(typeId) || 0) + 1);
    });

    // ✅ Build weekly breakdown with all types (0 if no data)
    const weeklyRequestBreakdown = orderedRequestTypes.map((typeName) => {
      const typeId = nameToIdMap.get(typeName);
      const total = typeId ? requestTypeMap.get(typeId) || 0 : 0;

      return {
        requestType: typeName,
        total: total,
      };
    });

    console.log('📊 Weekly Request Breakdown:', weeklyRequestBreakdown);

    // --- GROUP REQUESTS BY DAY AND REQUEST TYPE ---
    const dayRequestMap = {};
    DAYS_OF_WEEK.forEach((day) => {
      dayRequestMap[day] = {};
      // ✅ Initialize all request types to 0 for each day
      orderedRequestTypes.forEach((typeName) => {
        dayRequestMap[day][typeName] = 0;
      });
    });

    allRequestOfTheWeek.forEach((req) => {
      const day = getDayName(req.createdAt);
      const typeId = req.requestTypeId;
      const typeName = typeIdToNameMap.get(typeId) || 'Unknown';

      if (dayRequestMap[day] && orderedRequestTypes.includes(typeName)) {
        dayRequestMap[day][typeName] += 1;
      }
    });

    // Convert to structured format
    const everydayRequestBreakdown = {};
    DAYS_OF_WEEK.forEach((day) => {
      everydayRequestBreakdown[day] = orderedRequestTypes.map((typeName) => ({
        requestType: typeName,
        total: dayRequestMap[day][typeName] || 0,
      }));
    });

    console.log('📊 Everyday Request Breakdown:', everydayRequestBreakdown);

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

export const getTodayAnalytics = async (req, res) => {
  try {
    // ✅ Get current date in Asia/Manila timezone
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      'Asia/Manila'
    );

    console.log('📅 Fetching today analytics for date:', todayUTC);

    // ✅ Find the CURRENT ACTIVE SESSION (isServing: true)
    const activeSession = await prisma.queueSession.findFirst({
      where: {
        sessionDate: todayUTC,
        isServing: true,
        isActive: true,
      },
      select: { sessionId: true },
      orderBy: { sessionNumber: 'desc' },
    });

    // If no active session, return empty data with all request types at 0
    if (!activeSession) {
      console.log('⚠️ No active session found');
      return res.status(200).json({
        success: true,
        message: 'No active session found. All data is 0.',
        data: {
          completed: 0,
          inProgress: 0,
          completedRegular: 0,
          completedPriority: 0,
          totalQueues: 0,
          requestBreakdown: [
            { requestType: 'Good Moral Certificat', total: 0 },
            { requestType: 'Insurance', total: 0 },
            { requestType: 'Approval/Transmittal Letter', total: 0 },
            { requestType: 'Temporary Gate Pass', total: 0 },
            { requestType: 'Uniform Exception', total: 0 },
            { requestType: 'Enrollment/Transfer', total: 0 },
          ],
        },
      });
    }

    const sessionId = activeSession.sessionId;
    console.log('✅ Active session ID:', sessionId);

    // ⚡ Fetch queues + requests from CURRENT SESSION ONLY
    const [sessionQueues, sessionRequests, requestTypes] = await Promise.all([
      prisma.queue.findMany({
        where: {
          sessionId: sessionId,
          isActive: true,
        },
        select: {
          queueStatus: true,
          queueType: true,
        },
      }),

      prisma.request.findMany({
        where: {
          queue: {
            sessionId: sessionId,
          },
          isActive: true,
        },
        select: {
          requestId: true,
          requestStatus: true,
          requestTypeId: true,
        },
      }),

      prisma.requestType.findMany({
        select: {
          requestTypeId: true,
          requestName: true,
        },
      }),
    ]);

    console.log('📊 Found queues in active session:', sessionQueues.length);
    console.log('📊 Found requests in active session:', sessionRequests.length);

    // 🧮 Queue analytics
    const completed = sessionQueues.filter(
      (q) =>
        q.queueStatus === Status.COMPLETED ||
        q.queueStatus === Status.CANCELLED ||
        q.queueStatus === Status.PARTIALLY_COMPLETE
    ).length;

    const inProgress = sessionQueues.length - completed;

    // ✅ Count COMPLETED regular and priority queues only
    const completedRegular = sessionQueues.filter(
      (q) =>
        q.queueType === Queue_Type.REGULAR &&
        (q.queueStatus === Status.COMPLETED ||
          q.queueStatus === Status.CANCELLED ||
          q.queueStatus === Status.PARTIALLY_COMPLETE)
    ).length;

    const completedPriority = sessionQueues.filter(
      (q) =>
        q.queueType === Queue_Type.PRIORITY &&
        (q.queueStatus === Status.COMPLETED ||
          q.queueStatus === Status.CANCELLED ||
          q.queueStatus === Status.PARTIALLY_COMPLETE)
    ).length;

    // 🧩 Request breakdown by type - ✅ COMPLETED ONLY
    const requestTypeMap = new Map();
    sessionRequests
      .filter((r) => r.requestStatus === Status.COMPLETED)
      .forEach((r) => {
        requestTypeMap.set(
          r.requestTypeId,
          (requestTypeMap.get(r.requestTypeId) || 0) + 1
        );
      });

    console.log(
      '📊 Completed requests by type:',
      Array.from(requestTypeMap.entries())
    );

    const typeIdToNameMap = new Map(
      requestTypes.map((rt) => [rt.requestTypeId, rt.requestName])
    );

    // ✅ Define the fixed order of request types - MATCH SEED DATA
    const orderedRequestTypes = [
      'Good Moral Certificat',
      'Insurance',
      'Approval/Transmittal Letter',
      'Temporary Gate Pass',
      'Uniform Exception',
      'Enrollment/Transfer',
    ];

    // ✅ Create a map of requestName to requestTypeId
    const nameToIdMap = new Map(
      requestTypes.map((rt) => [rt.requestName, rt.requestTypeId])
    );

    // ✅ Build request breakdown with all types (0 if no data)
    const requestBreakdown = orderedRequestTypes.map((typeName) => {
      const typeId = nameToIdMap.get(typeName);
      const total = typeId ? requestTypeMap.get(typeId) || 0 : 0;

      return {
        requestType: typeName,
        total: total,
      };
    });

    // ✅ Combine all analytics
    const analytics = {
      completed,
      inProgress,
      completedRegular,
      completedPriority,
      totalQueues: sessionQueues.length,
      requestBreakdown,
    };

    console.log('✅ Today analytics:', analytics);

    return res.status(200).json({
      success: true,
      message: 'Successfully fetched today analytics',
      data: analytics,
    });
  } catch (error) {
    console.error('❌ Error fetching today analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

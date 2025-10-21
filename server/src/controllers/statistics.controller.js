import { Queue_Type, Status } from "@prisma/client";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
import { formatQueueNumber } from "../services/queue/QueueNumber.js";

export const getDashboardStatistics = async (req, res) => {
  try {
    // ✅ AUTO-UPDATE: SKIPPED → CANCELLED after 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    await prisma.queue.updateMany({
      where: {
        queueStatus: Status.SKIPPED,
        updatedAt: { lt: oneHourAgo },
        isActive: true,
      },
      data: {
        queueStatus: Status.CANCELLED,
        updatedAt: new Date(),
      },
    });

    // ✅ Get current date in Asia/Manila timezone
    const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );

    // ✅ 1) Find the active session (for dashboard view)
    const activeSession = await prisma.queueSession.findFirst({
      where: { sessionDate: todayUTC, isServing: true, isActive: true },
      select: { sessionId: true, sessionNumber: true },
      orderBy: { sessionNumber: "asc" },
    });

    // ✅ 2) Get ALL today's sessions (for totals)
    const allSessionsToday = await prisma.queueSession.findMany({
      where: { sessionDate: todayUTC, isServing: true, isActive: true },
      select: { sessionId: true },
    });

    const sessionIds = allSessionsToday.map((s) => s.sessionId);

    if (!activeSession || sessionIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active session found. Dashboard empty.",
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
      orderBy: { windowNo: "asc" },
    });

    // Map windows by number for clean access
    const windowsByNo = { 1: null, 2: null };
    for (const w of windows) windowsByNo[w.windowNo] = w;

    // ✅ 4) Fetch serving + next-in-line queues per window
    const windowResults = await Promise.all(
      [1, 2].map(async (winNo) => {
        const win = windowsByNo[winNo];
        if (!win) {
          return {
            windowNo: winNo,
            currentServing: null,
            // nextInLine: [],
          };
        }

        const currentServing = await prisma.queue.findFirst({
          where: {
            // sessionId: sessionId,
            windowId: win.windowId,
            queueStatus: Status.IN_SERVICE,
            isActive: true,
          },
          select: {
            queueId: true,
            queueNumber: true,
            // queueType: true,
            // studentFullName: true,
            // studentId: true,
            // calledAt: true,
          },
          orderBy: { calledAt: "desc" },
        });
        console.log("Current Serving for Window", winNo, ":", currentServing);
        const formattedCurrent = currentServing
          ? {
              queueId: currentServing.queueId,
              queueNumber: currentServing.queueNumber,
              formattedQueueNumber: formatQueueNumber(
                currentServing.queueType === "PRIORITY" ? "P" : "R",
                currentServing.queueNumber
              ),
              queueType: currentServing.queueType,
              // studentFullName: currentServing.studentFullName,
              // studentId: currentServing.studentId,
              // calledAt: currentServing.calledAt,
            }
          : null;

        // const nextInLineRaw = await prisma.queue.findMany({
        //   where: {
        //     sessionId: sessionId,
        //     queueStatus: Status.WAITING,
        //     isActive: true,
        //   },
        //   orderBy: [{ queueType: "asc" }, { queueNumber: "asc" }],
        //   take: 2,
        //   select: {
        //     queueId: true,
        //     queueNumber: true,
        //     queueType: true,
        //     studentFullName: true,
        //     studentId: true,
        //   },
        // });

        // const nextInLine = nextInLineRaw.map((q) => ({
        //   queueId: q.queueId,
        //   queueNumber: q.queueNumber,
        //   formattedQueueNumber: formatQueueNumber(
        //     q.queueType === "PRIORITY" ? "P" : "R",
        //     q.queueNumber
        //   ),
        //   queueType: q.queueType,
        //   studentFullName: q.studentFullName,
        //   studentId: q.studentId,
        // }));

        return {
          windowNo: winNo,
          windowId: win.windowId,
          // windowName: win.windowName,
          // displayName: win.displayName,
          currentServing: formattedCurrent,
          // nextInLine,
        };
      })
    );

    // ✅ 5) Compute totals for *all* sessions today
    const [totalRegular, totalPriority, completedCount, totalQueueToday] =
      await Promise.all([
        prisma.queue.count({
          where: {
            sessionId: { in: sessionIds },
            queueType: Queue_Type.REGULAR,
            isActive: true,
          },
        }),
        prisma.queue.count({
          where: {
            sessionId: { in: sessionIds },
            queueType: Queue_Type.PRIORITY,
            isActive: true,
          },
        }),
        prisma.queue.count({
          where: {
            sessionId: { in: sessionIds },
            queueStatus: {
              in: [
                Status.COMPLETED,
                Status.PARTIALLY_COMPLETE,
                Status.CANCELLED,
              ],
            },
            isActive: true,
          },
        }),
        prisma.queue.count({
          where: { sessionId: { in: sessionIds }, isActive: true },
        }),
      ]);

    const inProgress = totalQueueToday - completedCount;

    // ✅ 6) Combine all data
    const dashboardOverview = {
      // session: {
      //   sessionId: sessionId,
      //   sessionNumber: activeSession.sessionNumber,
      // },
      windows: windowResults,
      totals: {
        totalRegular,
        totalPriority,
        completed: completedCount,
        inProgress,
        totalQueueToday,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data: dashboardOverview,
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//weekly charts
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

    console.log(" Week Range:", monday, "to", saturday);

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

    console.log("Found queues:", allQueues.length);

    const DAYS_OF_WEEK = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

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
    const queueSummary = DAYS_OF_WEEK.map((day) => {
      const existing = combineQueuesByDate.find((item) => item.day === day);
      return (
        existing || {
          day,
          totalRegular: 0,
          totalPriority: 0,
          totalQueues: 0,
        }
      );
    }).map((item) => ({
      day: item.day,
      totalRegular: item.totalRegular,
      totalPriority: item.totalPriority,
      totalQueues: item.totalRegular + item.totalPriority,
    }));

    console.log("Queue Summary:", queueSummary);

    // --- FETCH REQUESTS OF THE WEEK ---
    const allRequestOfTheWeek = await prisma.request.findMany({
      where: {
        createdAt: {
          gte: monday,
          lte: saturday,
        },
        // requestStatus: 'COMPLETED',
        requestStatus: {
          in: [Status.COMPLETED, Status.CANCELLED],
        },
      },
      select: {
        createdAt: true,
        requestTypeId: true,
      },
    });

    console.log("Found requests:", allRequestOfTheWeek.length);

    // --- GROUP REQUESTS BY REQUEST TYPE (Weekly total) ---
    const requestTypeMap = new Map();
    allRequestOfTheWeek.forEach((req) => {
      const typeId = req.requestTypeId;
      requestTypeMap.set(typeId, (requestTypeMap.get(typeId) || 0) + 1);
    });

    // Fetch request type names
    const requestTypes = await prisma.requestType.findMany();
    const typeIdToNameMap = new Map(
      requestTypes.map((rt) => [rt.requestTypeId, rt.requestName])
    );

    const weeklyRequestBreakdown = Array.from(
      requestTypeMap,
      ([typeId, total]) => ({
        requestTypeId: typeId,
        requestType: typeIdToNameMap.get(typeId) || "Unknown",
        total,
      })
    );

    console.log("Weekly Request Breakdown:", weeklyRequestBreakdown);

    // --- GROUP REQUESTS BY DAY AND REQUEST TYPE ---
    const dayRequestMap = {};
    DAYS_OF_WEEK.forEach((day) => {
      dayRequestMap[day] = {};
    });

    allRequestOfTheWeek.forEach((req) => {
      const day = getDayName(new Date(req.createdAt));
      const typeId = req.requestTypeId;
      const typeName = typeIdToNameMap.get(typeId) || "Unknown";

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

    console.log("Everyday Request Breakdown:", everydayRequestBreakdown);

    return res.status(200).json({
      success: true,
      message: "Successfully fetched analytics data",
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
    console.error("Error fetching analytics data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getTodayAnalytics = async (req, res) => {
  try {
    // 🕒 Date boundaries for today (Asia/Manila)
    const today = DateAndTimeFormatter.startOfDayInTimeZone(
      new Date(),
      "Asia/Manila"
    );
    const now = new Date();

    console.log("📅 Fetching today analytics:", today, "to", now);

    // ⚡ Fetch queues + requests in parallel for better performance
    const [todayQueues, todayRequests, requestTypes] = await Promise.all([
      prisma.queue.findMany({
        where: {
          createdAt: { gte: today, lte: now },
          isActive: true,
        },
        select: {
          queueStatus: true,
          queueType: true,
        },
      }),

      prisma.request.findMany({
        where: {
          createdAt: { gte: today, lte: now },
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

    // 🧮 Queue analytics
    const completed = todayQueues.filter(
      (q) => q.queueStatus === "COMPLETED" || q.queueStatus === "CANCELLED"
    ).length;

    const inProgress = todayQueues.length - completed;
    const totalRegular = todayQueues.filter(
      (q) => q.queueType === "REGULAR"
    ).length;
    const totalPriority = todayQueues.filter(
      (q) => q.queueType === "PRIORITY"
    ).length;

    // 🧩 Request breakdown by type
    const requestTypeMap = new Map();
    todayRequests
      .filter((r) => r.requestStatus === "COMPLETED")
      .forEach((r) => {
        requestTypeMap.set(
          r.requestTypeId,
          (requestTypeMap.get(r.requestTypeId) || 0) + 1
        );
      });

    const typeIdToNameMap = new Map(
      requestTypes.map((rt) => [rt.requestTypeId, rt.requestName])
    );

    const requestBreakdown = Array.from(requestTypeMap, ([typeId, total]) => ({
      requestTypeId: typeId,
      requestType: typeIdToNameMap.get(typeId) || "Unknown",
      total,
    }));

    // ✅ Combine all analytics
    const analytics = {
      completed,
      inProgress,
      totalRegular,
      totalPriority,
      totalQueues: todayQueues.length,
      requestBreakdown,
    };

    console.log("✅ Today analytics:", analytics);

    return res.status(200).json({
      success: true,
      message: "Successfully fetched today analytics",
      data: analytics,
    });
  } catch (error) {
    console.error("❌ Error fetching today analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

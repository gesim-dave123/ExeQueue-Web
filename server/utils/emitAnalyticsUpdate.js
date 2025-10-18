import { io } from '../src/server.js';
import prisma from '../prisma/prisma.js';

export const emitTodayAnalyticsUpdate = async () => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    // Get today's queues
    const todayQueues = await prisma.queue.findMany({
      where: {
        createdAt: {
          gte: today,
          lte: now,
        },
        isActive: true,
      },
      select: {
        queueStatus: true,
        queueType: true,
      },
    });

    const completed = todayQueues.filter(
      (q) => q.queueStatus === 'COMPLETED'
    ).length;
    const inProgress = todayQueues.filter(
      (q) => q.queueStatus === 'WAITING'
    ).length;
    const totalRegular = todayQueues.filter(
      (q) => q.queueType === 'REGULAR'
    ).length;
    const totalPriority = todayQueues.filter(
      (q) => q.queueType === 'PRIORITY'
    ).length;

    // Get today's completed requests
    const todayRequests = await prisma.request.findMany({
      where: {
        createdAt: {
          gte: today,
          lte: now,
        },
        requestStatus: 'COMPLETED',
        isActive: true,
      },
      select: {
        requestTypeId: true,
      },
    });

    const requestTypeMap = new Map();
    todayRequests.forEach((req) => {
      const typeId = req.requestTypeId;
      requestTypeMap.set(typeId, (requestTypeMap.get(typeId) || 0) + 1);
    });

    const requestTypes = await prisma.requestType.findMany();
    const typeIdToNameMap = new Map(
      requestTypes.map((rt) => [rt.requestTypeId, rt.requestName])
    );

    const requestBreakdown = Array.from(requestTypeMap, ([typeId, total]) => ({
      requestTypeId: typeId,
      requestType: typeIdToNameMap.get(typeId) || 'Unknown',
      total,
    }));

    const analyticsData = {
      completed,
      inProgress,
      totalRegular,
      totalPriority,
      totalQueues: todayQueues.length,
      requestBreakdown,
    };

    // Emit to analytics room
    io.to('analytics-room').emit('today-analytics-update', analyticsData);
    console.log('📡 Emitted today-analytics-update:', analyticsData);

    return analyticsData;
  } catch (error) {
    console.error('❌ Error emitting analytics update:', error);
  }
};

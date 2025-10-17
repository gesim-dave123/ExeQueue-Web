import { Queue_Type, Status } from "@prisma/client";
import prisma from "../../../prisma/prisma.js";
import DateAndTimeFormatter from "../../../utils/DateAndTimeFormatter.js";

const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
  new Date(),
  "Asia/Manila"
);
class QueueService {
  // Get all queues sorted by priority algorithm
  async getTodayQueues() {
    const queues = await prisma.queue.findMany({
      where: {
        isActive: true,
        session: {
          sessionDate: todayUTC,
          isActive: true,
        },
        queueStatus: Status.WAITING,
      },
      include: {
        requests: {
          include: {
            requestType: true,
          },
        },
      },
      orderBy: {
        sequenceNumber: "asc",
      },
    });

    // Apply priority sorting
    return this.sortByPriorityPattern(queues);
  }

  async getTodayRegular() {
    return await prisma.queue.findMany({
      where: {
        queueStatus: Status.WAITING,
        queueType: Queue_Type.REGULAR,
        isActive: true,
        windowId: null,
        session: {
          sessionDate: todayUTC,
        },
      },
      include: {
        requests: true,
      },
      orderBy: {
        sequenceNumber: "asc",
      },
    });
  }

  async getTodayPriority() {
    return await prisma.queue.findMany({
      where: {
        queueStatus: Status.WAITING,
        queueType: Queue_Type.PRIORITY,
        isActive: true,
        windowId: null,
        session: {
          sessionDate: todayUTC,
        },
      },
      include: {
        requests: true,
      },
      orderBy: {
        sequenceNumber: "asc",
      },
    });
  }

  /**
   * Sort queues by priority pattern: PRIORITY -> REGULAR -> PRIORITY -> REGULAR...
   * Within each type, maintain sequenceNumber order
   */
  sortByPriorityPattern(queues) {
    // Separate by type, maintaining their sequence order
    const priority = queues.filter((q) => q.queueType === Queue_Type.PRIORITY);
    const regular = queues.filter((q) => q.queueType === Queue_Type.REGULAR);

    const sorted = [];
    let pIndex = 0;
    let rIndex = 0;

    // Alternate: Priority first, then regular
    while (pIndex < priority.length || rIndex < regular.length) {
      // Add one priority if available
      if (pIndex < priority.length) {
        sorted.push(priority[pIndex]);
        pIndex++;
      }

      // Add one regular if available
      if (rIndex < regular.length) {
        sorted.push(regular[rIndex]);
        rIndex++;
      }
    }

    return sorted;
  }

  /**
   * Get the next queue item following priority pattern
   */
  async getNextInLineToday(windowId = null) {
    const where = {
      queueStatus: Status.WAITING,
      isActive: true,
      session: {
        sessionDate: todayUTC,
        isActive: true,
      },
    };

    if (windowId) where.windowId = windowId;

    // Get all waiting queues
    const allQueues = await prisma.queue.findMany({
      where,
      orderBy: {
        sequenceNumber: "asc",
      },
      include: {
        requests: true,
      },
    });

    if (allQueues.length === 0) return null;

    // Get the last served queue to determine pattern
    const lastServed = await prisma.queue.findFirst({
      where: {
        queueStatus: Status.SERVING,
        isActive: true,
        session: {
          sessionDate: todayUTC,
          isActive: true,
        },
        ...(windowId && { windowId }),
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Apply priority pattern logic
    return this.selectNextByPattern(allQueues, lastServed);
  }

  /**
   * Select next queue item based on alternating pattern
   */
  selectNextByPattern(queues, lastServed) {
    const priority = queues.filter((q) => q.queueType === Queue_Type.PRIORITY);
    const regular = queues.filter((q) => q.queueType === Queue_Type.REGULAR);

    // If no last served, start with priority (if available), otherwise regular
    if (!lastServed) {
      return priority.length > 0 ? priority[0] : regular[0];
    }

    // Alternate based on last served type
    if (lastServed.queueType === Queue_Type.PRIORITY) {
      // Last was priority, serve regular next (if available)
      return regular.length > 0 ? regular[0] : priority[0];
    } else {
      // Last was regular, serve priority next (if available)
      return priority.length > 0 ? priority[0] : regular[0];
    }
  }

  /**
   * Get formatted queue list for display with virtual position numbers
   */
  async getFormattedQueueList(windowId = null) {
    const where = {
      queueStatus: Status.WAITING,
      isActive: true,
      session: {
        sessionDate: todayUTC,
        isActive: true,
      },
    };

    if (windowId) where.windowId = windowId;

    const queues = await prisma.queue.findMany({
      where,
      orderBy: {
        sequenceNumber: "asc",
      },
      include: {
        requests: true,
      },
    });

    // Sort by priority pattern
    const sortedQueues = this.sortByPriorityPattern(queues);

    // Add virtual position number
    return sortedQueues.map((queue, index) => ({
      ...queue,
      displayPosition: index + 1, // Position in the actual serving order
      originalSequence: queue.sequenceNumber, // Original creation order
    }));
  }

  /**
   * Call next in queue (updates status and assigns to window)
   */
  async callNext(windowId) {
    const next = await this.getNextInLineToday(windowId);

    if (!next) {
      throw new Error("No queues waiting");
    }

    // Update queue status
    const updated = await prisma.queue.update({
      where: { id: next.id },
      data: {
        queueStatus: Status.SERVING,
        windowId: windowId,
        calledAt: new Date(),
      },
      include: {
        requests: true,
      },
    });

    return updated;
  }

  /**
   * Complete a queue item
   */
  async completeQueue(queueId) {
    return await prisma.queue.update({
      where: { id: queueId },
      data: {
        queueStatus: Status.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        requests: true,
      },
    });
  }

  /**
   * Mark as no-show
   */
  async markNoShow(queueId) {
    return await prisma.queue.update({
      where: { id: queueId },
      data: {
        queueStatus: Status.DEFERRED,
      },
      include: {
        requests: true,
      },
    });
  }
}

export default new QueueService();

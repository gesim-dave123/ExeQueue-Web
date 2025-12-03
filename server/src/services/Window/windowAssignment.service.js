import { Status } from "@prisma/client";
import prisma from "../../../prisma/prisma.js";
import {
  sendDashboardUpdate,
  sendLiveDisplayUpdate,
} from "../../controllers/statistics.controller.js";
import { QueueActions, WindowEvents } from "../enums/SocketEvents.js";

const activeTimers = new Map();
const GRACE_PERIOD = 30 * 60 * 1000; // 10 mins

export function scheduleAssignmentTimer(assignmentId, lastHeartbeat, io) {
  const heartbeatTime = lastHeartbeat ? lastHeartbeat.getTime() : Date.now();
  const delay = Math.max(heartbeatTime + GRACE_PERIOD - Date.now(), 0);

  if (activeTimers.has(assignmentId))
    clearTimeout(activeTimers.get(assignmentId));

  const timeout = setTimeout(async () => {
    try {
      const assignment = await prisma.windowAssignment.findUnique({
        where: { assignmentId },
        include: {
          serviceWindow: {
            select: {
              windowName: true,
            },
          },
        },
      });

      if (
        assignment &&
        !assignment.releasedAt &&
        assignment.lastHeartbeat <= new Date(Date.now() - GRACE_PERIOD)
      ) {
        // Start transaction to handle both queue reset and assignment release
        const result = await prisma.$transaction(async (tx) => {
          // Check for current in-service queue
          const currentQueue = await tx.queue.findFirst({
            where: {
              windowId: assignment.windowId,
              queueStatus: Status.IN_SERVICE,
            },
            select: {
              queueId: true,
              queueNumber: true,
              referenceNumber: true,
            },
          });

          let resetQueue = null;

          // Reset queue if exists
          if (currentQueue) {
            const updatedQueue = await tx.queue.update({
              where: { queueId: currentQueue.queueId },
              data: {
                queueStatus: Status.WAITING,
                windowId: null,
                servedByStaff: null,
                calledAt: null,
              },
              select: {
                queueId: true,
                referenceNumber: true,
                windowId: true,
              },
            });

            resetQueue = {
              queueId: currentQueue.queueId,
              queueNumber: currentQueue.queueNumber,
              referenceNumber: updatedQueue.referenceNumber,
            };

            // Emit queue reset event
            io.emit(QueueActions.QUEUE_RESET, {
              queueId: updatedQueue.queueId,
              windowId: updatedQueue.windowId,
              referenceNumber: updatedQueue.referenceNumber,
              previousWindowId: assignment.windowId,
            });
          }

          // Release the assignment
          await tx.windowAssignment.update({
            where: { assignmentId },
            data: { releasedAt: new Date() },
          });

          return {
            windowId: assignment.windowId,
            windowName: assignment.serviceWindow.windowName,
            sasStaffId: assignment.sasStaffId,
            shift: assignment.shiftTag,
            resetQueue,
          };
        });

        // Emit window release events
        io.to(`window:${result.windowId}`).emit(WindowEvents.RELEASE_WINDOW, {
          windowId: result.windowId,
          previousWindowId: result.windowId,
          sasStaffId: result.sasStaffId,
          shift: result.shift,
          resetQueue: result.resetQueue
            ? {
                queueId: result.resetQueue.queueId,
                queueNo: result.resetQueue.queueNumber,
              }
            : null,
          message: `${result.windowName} was automatically released due to inactivity.`,
        });

        // Send dashboard and live display updates
        sendDashboardUpdate({
          windowId: result.windowId,
          previousWindowId: result.windowId,
          sasStaffId: result.sasStaffId,
          shift: result.shift,
          resetQueue: result.resetQueue
            ? {
                queueId: result.resetQueue.queueId,
                queueNo: result.resetQueue.queueNumber,
              }
            : null,
          message: `${result.windowName} was automatically released due to inactivity.`,
        });

        sendLiveDisplayUpdate({
          windowId: result.windowId,
          previousWindowId: result.windowId,
          sasStaffId: result.sasStaffId,
          shift: result.shift,
          resetQueue: result.resetQueue
            ? {
                queueId: result.resetQueue.queueId,
                queueNo: result.resetQueue.queueNumber,
              }
            : null,
          message: `${result.windowName} was automatically released due to inactivity.`,
        });

        console.log(
          `[Timer] Released stale assignment ${assignmentId} and reset queue`
        );
      }
    } catch (error) {
      console.error(
        `[Timer] Error releasing assignment ${assignmentId}:`,
        error
      );
    } finally {
      activeTimers.delete(assignmentId);
    }
  }, delay);

  activeTimers.set(assignmentId, timeout);
}

export async function restoreTimersOnStartup(io) {
  const activeAssignments = await prisma.windowAssignment.findMany({
    where: { releasedAt: null },
    select: { assignmentId: true, lastHeartbeat: true },
  });

  activeAssignments.forEach((a) =>
    scheduleAssignmentTimer(a.assignmentId, a.lastHeartbeat, io)
  );

  console.log(
    `[Timer] Restored ${activeAssignments.length} active assignment timer(s)`
  );
}

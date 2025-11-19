import prisma from "../../../prisma/prisma.js";

const activeTimers = new Map();
const GRACE_PERIOD = 10 * 60 * 1000; // 10 mins

export function scheduleAssignmentTimer(assignmentId, lastHeartbeat) {
  const delay = Math.max(
    lastHeartbeat.getTime() + GRACE_PERIOD - Date.now(),
    0
  );

  if (activeTimers.has(assignmentId))
    clearTimeout(activeTimers.get(assignmentId));
  const timeout = setTimeout(async () => {
    try {
      const assignment = await prisma.windowAssignment.findUnique({
        where: { assignmentId },
        select: { releasedAt: true, lastHeartbeat: true },
      });

      if (
        assignment &&
        !assignment.releasedAt &&
        assignment.lastHeartbeat <= new Date(Date.now() - GRACE_PERIOD)
      ) {
        await prisma.windowAssignment.update({
          where: { assignmentId },
          data: { releasedAt: new Date() },
        });
        console.log(`[Timer] Released stale assignment ${assignmentId}`);
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

export async function restoreTimersOnStartup() {
  const activeAssignments = await prisma.windowAssignment.findMany({
    where: { releasedAt: null },
    select: { assignmentId: true, lastHeartbeat: true },
  });

  activeAssignments.forEach((a) =>
    scheduleAssignmentTimer(a.assignmentId, a.lastHeartbeat)
  );

  console.log(
    `[Timer] Restored ${activeAssignments.length} active assignment timer(s)`
  );
}

import {
  scheduleInactiveWindowFailsafe,
  scheduleSessionClose,
  scheduleSessionCreate,
  startEndOfDayQueueCleanup,
  startSkippedRequestMonitor,
  startStalledRequestFinalizer,
} from "../controllers/scheduler.controller.js"; // or whatever file structure you use
import { restoreTimersOnStartup } from "../services/Window/windowAssignment.service.js";

function safeSchedule(label, fn) {
  try {
    fn();
    console.log(`🕐 ${label} scheduled successfully`);
  } catch (err) {
    console.error(`Failed to schedule ${label}:`, err);
  }
}

export const START_SCHEDULERS = async (io) => {
  // safeSchedule("Waiting Queues Cleanup", startWaitingQueueCleanUp);
  // safeSchedule("Deferred Queues Cleanup", startDeferredQueueCleanUp);
  safeSchedule("End-of-Day Queue Cleanup", startEndOfDayQueueCleanup);
  safeSchedule("Stalled Requests Finalizer", startStalledRequestFinalizer);
  safeSchedule("Skipped Request Monitor", () => startSkippedRequestMonitor(io));
  // safeSchedule("Skipped→Cancelled Request", scheduleSkippedToCancelledRequest);
  safeSchedule("Session Close", scheduleSessionClose);
  safeSchedule("Session Create", scheduleSessionCreate);
  // safeSchedule("Inactive Window Heartbeat Monitor", scheduleInactiveWindow);
  safeSchedule("Inactive Window Heartbeat Monitor (Fall back)", () =>
    scheduleInactiveWindowFailsafe(io)
  );
  await restoreTimersOnStartup(io);
};

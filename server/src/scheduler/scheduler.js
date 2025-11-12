import {
  scheduleDeferredToCancelledQueue,
  scheduleSessionClose,
  scheduleSessionCreate,
  startSkippedRequestMonitor,
  startStalledRequestFinalizer,
} from "../controllers/scheduler.controller.js"; // or whatever file structure you use

function safeSchedule(label, fn) {
  try {
    fn();
    console.log(`🕐 ${label} scheduled successfully`);
  } catch (err) {
    console.error(`❌ Failed to schedule ${label}:`, err);
  }
}

export const START_SCHEDULERS = async () => {
  safeSchedule("Deferred→Cancelled Queue", scheduleDeferredToCancelledQueue);
  safeSchedule("Stalled Request Finalizer", startStalledRequestFinalizer);
  safeSchedule("Skipped Request Monitor", startSkippedRequestMonitor);
  // safeSchedule("Skipped→Cancelled Request", scheduleSkippedToCancelledRequest);
  safeSchedule("Session Close", scheduleSessionClose);
  safeSchedule("Session Create", scheduleSessionCreate);
};

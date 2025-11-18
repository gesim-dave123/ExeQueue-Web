import { Status } from "@prisma/client";
import cron from "node-cron";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";

const TEN_PM = "0 0 22 * * *";
const ONE_AM = "0 0 1 * * *";
const FIFTEENMIN = "*/15 * * * *";
const FIVEMIN = "*/5 * * * *";
const TWOMIN = "*/2 * * * * *";
const THIRTYMIN = "*/30 * * * * *";
const TIMEZONE = "Asia/Manila";
const GRACE_PERIOD = 10 * 60 * 1000;
const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
  new Date(),
  "Asia/Manila"
);
const manilaNow = DateAndTimeFormatter.nowInTimeZone("Asia/Manila");

// Queue Schedulers

export function startStalledRequestFinalizer() {
  // Run daily at 11:59 PM Manila time
  cron.schedule(
    TEN_PM,
    async () => {
      console.log("Running end-of-day STALLED request finalizer...");

      try {
        const todayStart = DateAndTimeFormatter.startOfDayInTimeZone(
          new Date(),
          "Asia/Manila"
        );

        const todayEnd = new Date(todayStart);
        todayEnd.setHours(23, 59, 59, 999);

        // Find all STALLED requests that weren't updated today
        const stalledRequests = await prisma.request.findMany({
          where: {
            requestStatus: Status.STALLED,
            updatedAt: {
              gte: todayStart,
              lte: todayEnd,
            },
            isActive: true,
          },
          include: {
            queue: true,
          },
        });

        console.log(
          `Found ${stalledRequests.length} STALLED requests to finalize`
        );

        for (const request of stalledRequests) {
          // Check if transaction history already exists
          const existingTransaction = await prisma.transactionHistory.findFirst(
            {
              where: {
                queueId: request.queueId,
                requestId: request.requestId,
                transactionStatus: Status.STALLED,
              },
            }
          );

          // Only create transaction if it doesn't exist yet
          if (!existingTransaction) {
            const staffRole = await prisma.sasStaff.findFirst({
              where: { sasStaffId: request.performedById },
              select: {
                role: true,
              },
            });
            await prisma.transactionHistory.create({
              data: {
                queueId: request.queueId,
                requestId: request.requestId,
                performedById: request.processedBy,
                performedByRole: staffRole.role, // Automated by system
                transactionStatus: Status.STALLED,
                createdAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
              },
            });

            console.log(
              `Finalized STALLED request ${request.requestId} (end of day)`
            );
          }
        }
      } catch (error) {
        console.error("Error in STALLED request finalizer:", error);
      }
    },
    {
      timezone: TIMEZONE,
    }
  );
}
export function startSkippedRequestMonitor() {
  cron.schedule(
    FIVEMIN,
    async () => {
      console.log("Running SKIPPED request monitor...");
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Find all SKIPPED requests older than 1 hour
        const skippedRequests = await prisma.request.findMany({
          where: {
            requestStatus: Status.SKIPPED,
            updatedAt: {
              lte: oneHourAgo,
            },
            isActive: true,
          },
          include: {
            queue: true,
          },
        });

        console.log(
          ` Found ${skippedRequests.length} SKIPPED requests to cancel`
        );

        // Group requests by queueId to update queue status efficiently
        const queueIdsToUpdate = new Set();

        for (const request of skippedRequests) {
          await prisma.$transaction(async (tx) => {
            // Update request to CANCELLED
            await tx.request.update({
              where: { requestId: request.requestId },
              data: {
                requestStatus: Status.CANCELLED,
                processedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
                updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
              },
            });

            // Update transaction history to CANCELLED (finalizes it)
            await tx.transactionHistory.updateMany({
              where: {
                queueId: request.queueId,
                requestId: request.requestId,
                transactionStatus: Status.SKIPPED,
              },
              data: {
                transactionStatus: Status.CANCELLED,
                createdAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
              },
            });

            // Mark this queue for status update
            queueIdsToUpdate.add(request.queueId);
          });
        }

        // Update queue statuses based on new request statuses
        for (const queueId of queueIdsToUpdate) {
          await updateQueueStatus(queueId);
        }

        console.log(`Updated ${queueIdsToUpdate.size} queue statuses`);
      } catch (error) {
        console.error("Error in SKIPPED request monitor:", error);
      }
    },
    {
      timezone: TIMEZONE,
    }
  );
}

async function updateQueueStatus(queueId) {
  try {
    // Get all requests for this queue
    const requests = await prisma.request.findMany({
      where: {
        queueId: queueId,
        isActive: true,
      },
      select: {
        requestStatus: true,
      },
    });

    if (requests.length === 0) return;

    const allCompleted = requests.every(
      (r) => r.requestStatus === Status.COMPLETED
    );
    const allCancelled = requests.every(
      (r) => r.requestStatus === Status.CANCELLED
    );
    const hasStalled = requests.some((r) => r.requestStatus === Status.STALLED);
    const hasSkipped = requests.some((r) => r.requestStatus === Status.SKIPPED);
    const hasCompleted = requests.some(
      (r) => r.requestStatus === Status.COMPLETED
    );
    const hasCancelled = requests.some(
      (r) => r.requestStatus === Status.CANCELLED
    );

    let finalStatus = Status.DEFERRED;

    if (allCompleted) {
      finalStatus = Status.COMPLETED;
    } else if (allCancelled) {
      finalStatus = Status.CANCELLED;
    } else if (hasStalled || hasSkipped) {
      finalStatus = Status.DEFERRED;
    } else if (hasCompleted && hasCancelled) {
      finalStatus = Status.PARTIALLY_COMPLETE;
    }

    // Update queue
    await prisma.queue.update({
      where: { queueId },
      data: {
        queueStatus: finalStatus,
        completedAt:
          finalStatus === Status.COMPLETED ||
          finalStatus === Status.CANCELLED ||
          finalStatus === Status.PARTIALLY_COMPLETE
            ? DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
            : null,
        updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
      },
    });

    console.log(`Updated queue ${queueId} status to ${finalStatus}`);
  } catch (error) {
    console.error(`Error updating queue status for queue ${queueId}:`, error);
  }
}

// Transaction History Schedulers

// export const scheduleSkippedToCancelledRequest = async () => {
//   cron.schedule("*/5 * * * *", async () => {
//     console.log("Checking for expired skipped requests...");

//     try {
//       const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

//       const expiredRequests = await prisma.request.findMany({
//         where: {
//           requestStatus: Status.SKIPPED,
//           updatedAt: {
//             lt: oneHourAgo,
//           },
//           isActive: true,
//         },
//         include: {
//           queue: true,
//         },
//       });

//       console.log(`Found ${expiredRequests.length} expired skipped requests`);

//       for (const request of expiredRequests) {
//         await prisma.request.update({
//           where: { requestId: request.requestId },
//           data: {
//             requestStatus: Status.CANCELLED,
//             updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
//           },
//         });

//         await prisma.transactionHistory.create({
//           data: {
//             queueId: request.queueId,
//             requestId: request.requestId,
//             performedById: request.processedBy || "system",
//             performedByRole: "PERSONNEL",
//             transactionStatus: Status.CANCELLED,
//           },
//         });

//         console.log(
//           `Auto-cancelled skipped request ${request.requestId} after 1 hour`
//         );
//       }

//       console.log("Skipped request check completed");
//     } catch (error) {
//       console.error("Error in skipped-to-cancelled check:", error);
//     }
//   });
// };

// Queue Session Schedulers

export const scheduleSessionClose = async () => {
  cron.schedule(
    TEN_PM,
    async () => {
      try {
        const activeSessions = await prisma.queueSession.findMany({
          where: { isActive: true, sessionDate: todayUTC },
        });

        if (activeSessions.length > 0) {
          // ✅ Close all active session
          await prisma.queueSession.updateMany({
            where: { isActive: true },
            data: {
              isAcceptingNew: false,
              isServing: false,
              isActive: false,
              updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
            },
          });
          console.log(`Closed ${activeSessions.length} active session(s)`);
        } else {
          console.log("No active session to close.");
        }
      } catch (error) {
        console.error("Error in automatic session close: ", error);
      }
    },
    { timezone: TIMEZONE }
  );
};
export const scheduleSessionCreate = async () => {
  cron.schedule(
    ONE_AM,
    async () => {
      try {
        const startOfDay = DateAndTimeFormatter.startOfDayInTimeZone(manilaNow);
        const activeSessions = await prisma.queueSession.findMany({
          where: { isActive: true, sessionDate: todayUTC },
          select: {
            sessionId: true,
          },
        });

        if (activeSessions.length > 0) {
          await prisma.queueSession.updateMany({
            where: {
              sessionId: {
                in: activeSessions.sessionId,
              },
              isActive: true,
            },
            data: {
              isAcceptingNew: false,
              isServing: false,
              isActive: false,
              updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
            },
          });
          console.log(`Closed ${activeSessions.length} active session(s)`);
        }
        await prisma.queueSession.create({
          data: {
            sessionDate: startOfDay,
            isActive: true,
            isAcceptingNew: true,
            isServing: true,
            sessionNumber: 1,
            maxQueueNo: 500,
            currentQueueCount: 0,
            regularCount: 0,
            priorityCount: 0,
          },
        });
        console.log(
          `🎉 New session created for ${DateAndTimeFormatter.formatInTimeZone(
            startOfDay,
            "MMMM dd, yyyy"
          )}`
        );
      } catch (error) {
        console.error("Error in automatic session create: ", error);
      }
    },
    { timezone: TIMEZONE }
  );
};

// Window Schedulers

export function scheduleInactiveWindow() {
  cron.schedule(
    FIFTEENMIN,
    async () => {
      try {
        const activeAssignedCount = await prisma.windowAssignment.count({
          where: {
            releasedAt: null,
          },
        });

        if (activeAssignedCount === 0) {
          return;
        }

        const GRACE_PERIOD = 10 * 60 * 1000; // 10 mins Grace Period
        const cutOffTime = new Date(Date.now() - GRACE_PERIOD);

        const staleAssignments = await prisma.windowAssignment.findMany({
          where: {
            releasedAt: null,
            lastHeartbeat: {
              lte: cutOffTime,
            },
          },
          select: {
            assignmentId: true,
            serviceWindow: true,
            staff: {
              select: {
                sasStaffId: true,
                firstName: true,
                middleName: true,
                lastName: true,
              },
            },
          },
        });

        if (staleAssignments.length > 0) {
          console.log(`Found ${staleAssignments.length} stale assignemnt(s)`);
          const releasedIds = staleAssignments.map((a) => a.assignmentId);
          await prisma.windowAssignment.updateMany({
            where: {
              assignmentId: {
                in: releasedIds,
              },
            },
            data: {
              releasedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
            },
          });
          staleAssignments.forEach((assignment) => {
            console.log(
              `Released window ${assignment.serviceWindow.windowName} from ${assignment.staff.firstName} ${assignment.staff.lastName}`
            );
          });
        }
      } catch (error) {
        console.error("Error in heartbeat cleanup cronjob: ", error);
      }
    },
    {
      timezone: TIMEZONE,
    }
  );
}
export function scheduleInactiveWindowFailsafe() {
  cron.schedule(
    FIFTEENMIN, // every 15 mins
    async () => {
      try {
        const cutOffTime = new Date(Date.now() - GRACE_PERIOD);

        const staleAssignments = await prisma.windowAssignment.findMany({
          where: {
            releasedAt: null,
            lastHeartbeat: { lte: cutOffTime },
          },
          select: {
            assignmentId: true,
            serviceWindow: { select: { windowName: true } },
            staff: { select: { firstName: true, lastName: true } },
          },
        });

        if (staleAssignments.length === 0) return;

        const releasedIds = staleAssignments.map((a) => a.assignmentId);

        await prisma.windowAssignment.updateMany({
          where: { assignmentId: { in: releasedIds } },
          data: { releasedAt: new Date() },
        });

        staleAssignments.forEach((a) =>
          console.log(
            `[Cron] Failsafe released window ${a.serviceWindow.windowName} from ${a.staff.firstName} ${a.staff.lastName}`
          )
        );
      } catch (error) {
        console.error("[Cron] Error in failsafe cleanup:", error);
      }
    },
    { timezone: TIMEZONE }
  );
}

// Cleanup Schedulers
export function startEndOfDayQueueCleanup() {
  cron.schedule(
    TEN_PM,
    async () => {
      console.log("[10 PM] Starting end-of-day queue cleanup sequence...");

      try {
        const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
          new Date(),
          "Asia/Manila"
        );

        await prisma.$transaction(async (tx) => {
          // STEP 1: Process WAITING/IN_SERVICE queues first
          console.log("Step 1: Processing WAITING/IN_SERVICE queues...");

          const waitingQueues = await tx.queue.findMany({
            where: {
              session: {
                sessionDate: todayUTC,
              },
              queueStatus: {
                in: [Status.WAITING, Status.IN_SERVICE],
              },
              isActive: true,
            },
            select: {
              queueId: true,
              referenceNumber: true,
              queueStatus: true,
              requests: {
                where: {
                  isActive: true,
                },
                select: {
                  requestId: true,
                  requestStatus: true,
                },
              },
            },
          });

          console.log(
            `Found ${waitingQueues.length} waiting/in-service queues`
          );

          for (const queue of waitingQueues) {
            const requests = queue.requests;

            const allCompleted = requests.every(
              (r) => r.requestStatus === Status.COMPLETED
            );
            const allCancelled = requests.every(
              (r) => r.requestStatus === Status.CANCELLED
            );
            const hasStalled = requests.some(
              (r) => r.requestStatus === Status.STALLED
            );
            const hasSkipped = requests.some(
              (r) => r.requestStatus === Status.SKIPPED
            );
            const hasCompleted = requests.some(
              (r) => r.requestStatus === Status.COMPLETED
            );
            const hasCancelled = requests.some(
              (r) => r.requestStatus === Status.CANCELLED
            );
            const allWaiting = requests.every(
              (r) => r.requestStatus === Status.WAITING
            );

            let finalStatus = Status.DEFERRED;

            if (allCompleted) {
              finalStatus = Status.COMPLETED;
            } else if (allCancelled) {
              finalStatus = Status.CANCELLED;
            } else if (allWaiting) {
              finalStatus = Status.CANCELLED;
            } else if (hasStalled || hasSkipped) {
              finalStatus = Status.DEFERRED;
            } else if (hasCompleted && hasCancelled) {
              finalStatus = Status.PARTIALLY_COMPLETE;
            }

            // Update queue
            await tx.queue.update({
              where: { queueId: queue.queueId },
              data: {
                queueStatus: finalStatus,
                completedAt:
                  finalStatus === Status.COMPLETED ||
                  finalStatus === Status.CANCELLED ||
                  finalStatus === Status.PARTIALLY_COMPLETE
                    ? DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
                    : null,
                updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
              },
            });

            // If all requests were waiting, cancel them
            if (allWaiting) {
              await tx.request.updateMany({
                where: {
                  queueId: queue.queueId,
                  isActive: true,
                  requestStatus: Status.WAITING,
                },
                data: {
                  requestStatus: Status.CANCELLED,
                  updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
                },
              });
            }

            console.log(
              `Processed queue ${queue.referenceNumber}: ${queue.queueStatus} → ${finalStatus}`
            );
          }

          // STEP 2: Process DEFERRED queues (including newly deferred from Step 1)
          console.log("Step 2: Processing DEFERRED queues...");

          const deferredQueues = await tx.queue.findMany({
            where: {
              queueStatus: Status.DEFERRED,
              session: {
                sessionDate: todayUTC,
              },
            },
            select: {
              queueId: true,
              referenceNumber: true,
              requests: {
                where: {
                  isActive: true,
                },
                select: {
                  requestStatus: true,
                },
              },
            },
          });

          console.log(
            `Found ${deferredQueues.length} deferred queues to finalize`
          );

          for (const queue of deferredQueues) {
            const requests = queue.requests;

            const allCompleted = requests.every(
              (r) => r.requestStatus === Status.COMPLETED
            );
            const allCancelled = requests.every(
              (r) => r.requestStatus === Status.CANCELLED
            );
            const hasStalled = requests.some(
              (r) => r.requestStatus === Status.STALLED
            );
            const hasSkipped = requests.some(
              (r) => r.requestStatus === Status.SKIPPED
            );
            const hasCompleted = requests.some(
              (r) => r.requestStatus === Status.COMPLETED
            );
            const hasCancelled = requests.some(
              (r) => r.requestStatus === Status.CANCELLED
            );

            let finalStatus = Status.DEFERRED;

            if (allCompleted) {
              finalStatus = Status.COMPLETED;
            } else if (allCancelled) {
              finalStatus = Status.CANCELLED;
            } else if (hasStalled || hasSkipped) {
              finalStatus = Status.DEFERRED; // Keep as deferred
            } else if (hasCompleted && hasCancelled) {
              finalStatus = Status.PARTIALLY_COMPLETE;
            }

            // Only update if status changed
            if (finalStatus !== Status.DEFERRED) {
              await tx.queue.update({
                where: { queueId: queue.queueId },
                data: {
                  queueStatus: finalStatus,
                  completedAt:
                    DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
                  updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
                },
              });
              console.log(
                `Finalized deferred queue ${queue.referenceNumber} → ${finalStatus}`
              );
            } else {
              console.log(
                `Queue ${queue.referenceNumber} remains DEFERRED (has stalled/skipped requests)`
              );
            }
          }
        });

        console.log("[10 PM] End-of-day queue cleanup completed successfully");
      } catch (error) {
        console.error("Error in end-of-day queue cleanup:", error);
      }
    },
    { timezone: TIMEZONE }
  );
}
// export function startWaitingQueueCleanUp() {
//   cron.schedule(
//     TEN_PM,
//     async () => {
//       console.log("Running queue clean up for unattended queues (10 pm)");
//       try {
//         const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
//           new Date(),
//           "Asia/Manila"
//         );
//         const cleanup = await prisma.$transaction(async (tx) => {
//           const waitingQueues = await tx.queue.findMany({
//             where: {
//               session: {
//                 sessionDate: todayUTC,
//               },
//               queueStatus: {
//                 in: [Status.WAITING, Status.IN_SERVICE],
//               },
//               isActive: true,
//             },
//             select: {
//               queueId: true,
//               queueStatus: true,
//               requests: {
//                 where: {
//                   isActive: true,
//                 },
//                 select: {
//                   requestStatus: true,
//                 },
//               },
//             },
//           });
//           for (const queue of waitingQueues) {
//             const requests = queue.requests;

//             const allCompleted = requests.every(
//               (r) => r.requestStatus === Status.COMPLETED
//             );
//             const allCancelled = requests.every(
//               (r) => r.requestStatus === Status.CANCELLED
//             );
//             const hasStalled = requests.some(
//               (r) => r.requestStatus === Status.STALLED
//             );
//             const hasSkipped = requests.some(
//               (r) => r.requestStatus === Status.SKIPPED
//             );
//             const hasCompleted = requests.some(
//               (r) => r.requestStatus === Status.COMPLETED
//             );
//             const hasCancelled = requests.some(
//               (r) => r.requestStatus === Status.CANCELLED
//             );
//             const allWaiting = requests.every(
//               (r) => r.requestStatus === Status.WAITING
//             );

//             let finalStatus = Status.DEFERRED;

//             if (allCompleted) {
//               finalStatus = Status.COMPLETED;
//             } else if (allCancelled) {
//               finalStatus = Status.CANCELLED;
//             } else if (allWaiting) {
//               finalStatus = Status.CANCELLED;
//             } else if (hasStalled || hasSkipped) {
//               finalStatus = Status.DEFERRED;
//             } else if (hasCompleted && hasCancelled) {
//               finalStatus = Status.PARTIALLY_COMPLETE;
//             }
//             await tx.queue.update({
//               where: { queueId: queue.queueId },
//               data: {
//                 queueStatus: finalStatus,
//                 completedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
//                 updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
//                 requests: {
//                   data: {
//                     requestStatus: allWaiting
//                       ? Status.CANCELLED
//                       : queue.requestStatus,
//                   },
//                 },
//               },
//             });
//           }
//         });
//       } catch (error) {
//         console.error("Error in cleaning waiting queues: ", error);
//       }
//     },
//     { timezone: TIMEZONE }
//   );
// }

// export function startDeferredQueueCleanUp() {
//   cron.schedule(
//     TEN_PM,
//     async () => {
//       console.log("[10 PM] Running deferred queue finalization...");

//       try {
//         const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
//           new Date(),
//           "Asia/Manila"
//         );

//         const deferredQueues = await prisma.queue.findMany({
//           where: {
//             queueStatus: Status.DEFERRED,
//             session: {
//               sessionDate: todayUTC,
//               // isActive: true,
//             },
//           },
//           select: {
//             queueId: true,
//             referenceNumber: true,
//             requests: {
//               where: {
//                 isActive: true,
//               },
//               select: {
//                 requestStatus: true,
//               },
//             },
//           },
//         });

//         console.log(
//           `Found ${deferredQueues.length} deferred queues to finalize`
//         );

//         for (const queue of deferredQueues) {
//           const requests = queue.requests;

//           const allCompleted = requests.every(
//             (r) => r.requestStatus === Status.COMPLETED
//           );
//           const allCancelled = requests.every(
//             (r) => r.requestStatus === Status.CANCELLED
//           );
//           const hasStalled = requests.some(
//             (r) => r.requestStatus === Status.STALLED
//           );
//           const hasSkipped = requests.some(
//             (r) => r.requestStatus === Status.SKIPPED
//           );
//           const hasCompleted = requests.some(
//             (r) => r.requestStatus === Status.COMPLETED
//           );
//           const hasCancelled = requests.some(
//             (r) => r.requestStatus === Status.CANCELLED
//           );

//           let finalStatus = Status.DEFERRED;

//           if (allCompleted) {
//             finalStatus = Status.COMPLETED;
//           } else if (allCancelled) {
//             finalStatus = Status.CANCELLED;
//           } else if (hasStalled || hasSkipped) {
//             finalStatus = Status.DEFERRED;
//           } else if (hasCompleted && hasCancelled) {
//             finalStatus = Status.PARTIALLY_COMPLETE;
//           }

//           await prisma.queue.update({
//             where: { queueId: queue.queueId },
//             data: {
//               queueStatus: finalStatus,
//               completedAt:
//                 finalStatus === Status.COMPLETED ||
//                 finalStatus === Status.CANCELLED
//                   ? DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
//                   : null,
//               updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
//             },
//           });
//           console.log(
//             `Finalized queue ${queue.referenceNumber} → ${finalStatus}`
//           );
//         }

//         console.log("Deferred finalization completed");
//       } catch (error) {
//         console.error("Error in deferred finalization:", error);
//       }
//     },
//     {
//       timezone: TIMEZONE,
//     }
//   );
// }

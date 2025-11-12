import { Status } from "@prisma/client";
import cron from "node-cron";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";

const TEN_PM = "0 22 * * *";
const ONE_AM = "0 1 * * *";
const FIFTEENMIN = "*/15 * * * *";
const FIVEMIN = "*/5 * * * *";
const TIMEZONE = "Asia/Manila";

const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
  new Date(),
  "Asia/Manila"
);
const manilaNow = DateAndTimeFormatter.nowInTimeZone("Asia/Manila");

// Queue Schedulers
export const scheduleDeferredToCancelledQueue = async () => {
  cron.schedule(
    TEN_PM,
    async () => {
      console.log("[10 PM] Running deferred queue finalization...");

      try {
        const todayUTC = DateAndTimeFormatter.startOfDayInTimeZone(
          new Date(),
          "Asia/Manila"
        );

        const deferredQueues = await prisma.queue.findMany({
          where: {
            queueStatus: Status.DEFERRED,
            session: {
              sessionDate: todayUTC,
              isActive: true,
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
            finalStatus = Status.DEFERRED;
          } else if (hasCompleted && hasCancelled) {
            finalStatus = Status.PARTIALLY_COMPLETE;
          }

          await prisma.queue.update({
            where: { queueId: queue.queueId },
            data: {
              queueStatus: finalStatus,
              completedAt:
                finalStatus === Status.COMPLETED ||
                finalStatus === Status.CANCELLED
                  ? DateAndTimeFormatter.nowInTimeZone("Asia/Manila")
                  : null,
              updatedAt: DateAndTimeFormatter.nowInTimeZone("Asia/Manila"),
            },
          });

          // await prisma.transactionHistory.create({
          //   data: {
          //     queueId: queue.queueId,
          //     performedById: queue.servedByStaff || "system",
          //     performedByRole: "PERSONNEL",
          //     transactionStatus: finalStatus,
          //   },
          // });

          console.log(
            `Finalized queue ${queue.referenceNumber} → ${finalStatus}`
          );
        }

        console.log("Deferred finalization completed");
      } catch (error) {
        console.error("Error in deferred finalization:", error);
      }
    },
    {
      timezone: TIMEZONE,
    }
  );
};
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
            await prisma.transactionHistory.create({
              data: {
                queueId: request.queueId,
                requestId: request.requestId,
                performedById: request.processedBy,
                performedByRole: "SYSTEM", // Automated by system
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

  console.log("STALLED request finalizer started (runs daily at 11:59 PM)");
}
export function startSkippedRequestMonitor() {
  cron.schedule(
    FIFTEENMIN,
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

            //Update transaction history to CANCELLED (finalizes it)
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

            // console.log(`Auto-cancelled SKIPPED request ${request.requestId} (> 1 hour)`);
          });
        }
      } catch (error) {
        console.error("Error in SKIPPED request monitor:", error);
      }
    },
    {
      timezone: TIMEZONE,
    }
  );

  // console.log('SKIPPED request monitor started (runs every 15 minutes)');
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
        const newSession = await prisma.queueSession.create({
          data: {
            sessionDate: startOfDay, // ✅ ADD THIS - Set the session date
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

// Cleanup Schedulers

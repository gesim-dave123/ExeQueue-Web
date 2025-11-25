import { Role } from "@prisma/client";
import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
export const closeActiveSession = async () => {
  // ✅ Find ALL active sessions (in case there are duplicates)
  const activeSessions = await prisma.queueSession.findMany({
    where: { isActive: true },
  });

  if (activeSessions.length > 0) {
    // ✅ Close all active session
    await prisma.queueSession.updateMany({
      where: { isActive: true },
      data: {
        isAcceptingNew: false,
        isServing: false,
        isActive: false,
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Closed ${activeSessions.length} active session(s)`);
  } else {
    console.log("No active session to close.");
  }
};

// Create new session for the next day
export const createNewSession = async () => {
  const manilaNow = DateAndTimeFormatter.nowInTimeZone();
  const startOfDay = DateAndTimeFormatter.startOfDayInTimeZone(manilaNow);

  const newSession = await prisma.queueSession.create({
    data: {
      // name: `Session ${DateAndTimeFormatter.formatInTimeZone(
      //   manilaNow,
      //   "yyyy-MM-dd"
      // )}`,
      sessionDate: startOfDay, // ✅ ADD THIS - Set the session date
      // startedAt: new Date(),
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
  return newSession;
};


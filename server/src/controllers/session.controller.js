import prisma from "../../prisma/prisma.js";
import DateAndTimeFormatter from "../../utils/DateAndTimeFormatter.js";
export const closeActiveSession = async () => {
  const activeSession = await prisma.queueSession.findFirst({
    where: { isActive: true },
  });

  if (activeSession) {
    await prisma.queueSession.update({
      where: { id: activeSession.id },
      data: {
        isAcceptingNew: false,
        isServing: false,
        isActive: false,
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Closed session: ${activeSession.id}`);
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
      name: `Session ${DateAndTimeFormatter.formatInTimeZone(
        manilaNow,
        "yyyy-MM-dd"
      )}`,
      startedAt: new Date(),
      isActive: true,
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

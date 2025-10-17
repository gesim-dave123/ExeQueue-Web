import { ShiftTag } from "@prisma/client";
import DateAndTimeFormatter from "./DateAndTimeFormatter.js";
export const getShiftTag = () => {
  const manilaNow = DateAndTimeFormatter.nowInTimeZone("Asia/Manila");
  const todayUTC = DateAndTimeFormatter.toUTC(manilaNow, "Asia/Manila");

  console.log(todayUTC);
  const hour = todayUTC.getHours();

  if (hour >= 6 && hour <= 11) return ShiftTag.MORNING;
  if (hour >= 12 && hour <= 17) return ShiftTag.AFTERNOON;
  if (hour >= 18 && hour <= 21) return ShiftTag.EVENING;
  return ShiftTag.EVENING; // optional
};

console.log(getShiftTag()); // e.g., "Morning Shift"

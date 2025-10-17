import { format, toZonedTime } from "date-fns-tz";

export function formatDateAndTime(isoString, timeZone = "Asia/Manila") {
  const zoned = toZonedTime(isoString, timeZone);
  return {
    date: format(zoned, "MMMM d, yyyy", { timeZone }),
    time: format(zoned, "hh:mm a", { timeZone }),
  };
}
export function formatTime(isoString, timeZone = "Asia/Manila") {
  const zoned = toZonedTime(isoString, timeZone);
  return {
    // date: format(zoned, "MMMM d, yyyy", { timeZone }),
    time: format(zoned, "hh:mm a", { timeZone }),
  };
}

// const result = formatDateAndTime("2025-10-11T03:52:15.171Z");
// console.log(result.date); // "2025-10-11"
// console.log(result.time); // "11:52:15"

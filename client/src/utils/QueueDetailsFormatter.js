import { formatTime } from "./DateAndTimeFormatter";

// export function formatQueueNextItem(queue) {
//   // Extract just the request names from objects
//   const requestNames =
//     queue.requests?.map((r) => r.requestType?.requestName).filter(Boolean) ||
//     [];
//   return {
//     queueNo: `${queue.queueType === "PRIORITY" ? "P" : "R"}${String(
//       queue.queueNumber
//     ).padStart(3, "0")}`,
//     studentId: queue.studentId,
//     name: queue.studentFullName,
//     course: `${queue.courseCode} - ${queue.yearLevel} Year`,
//     type: queue.queueType.charAt(0) + queue.queueType.slice(1).toLowerCase(), // e.g. "PRIORITY" → "Priority"
//     request: requestNames,
//     time: formatTime(queue.createdAt).time,
//   };
// }

export function formatQueueNextItem(formattedQueue) {
  // Extract just the request names from the formatted requests array
  const requestNames =
    formattedQueue.requests?.map((r) => r.name).filter(Boolean) || [];

  return {
    queueId: formattedQueue.queueId, // ✅ Preserve the ID
    queueNo: formattedQueue.queueNo, // Already formatted
    studentId: formattedQueue.studentId,
    queueStatus: formattedQueue.queueStatus,
    name: formattedQueue.name,
    course: formattedQueue.course, // Already formatted
    type: formattedQueue.type, // Already formatted
    request: requestNames, // Extract names from {id, name, status} objects
    time: formattedQueue.time, // Already formatted
  };
}

export const formatQueueData = (queueData) => {
  return {
    queueId: queueData.queueId, // ✅ Preserve the ID
    queueNo: `${queueData.queueType === "PRIORITY" ? "P" : "R"}${String(
      queueData.queueNumber
    ).padStart(3, "0")}`,
    type: queueData.queueType === "PRIORITY" ? "Priority" : "Regular",
    queueStatus: queueData.queueStatus,
    windowId: queueData.windowId,
    name: queueData.studentFullName,
    studentId: queueData.studentId,
    course: `${queueData.courseCode} - ${queueData.yearLevel} Year`,
    time: formatTime(queueData.createdAt).time,
    requests: queueData.requests.map((request) => ({
      id: request.requestId,
      name: request.requestType.requestName,
      status:
        request.requestStatus === "WAITING"
          ? "In Progress"
          : request.requestStatus === "COMPLETED"
          ? "Completed"
          : request.requestStatus,
    })),
  };
};

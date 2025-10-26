export const normalizeStatusForDisplay = (backendStatus) => {
  const displayMap = {
    COMPLETED: "Completed",
    STALLED: "Stalled",
    SKIPPED: "Skipped",
    CANCELLED: "Cancelled",
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
  };
  return displayMap[backendStatus] || backendStatus;
};

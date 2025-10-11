// enums/socketEvents.js

export const SocketEvents = Object.freeze({
  // Queue Events
  QUEUE_CREATED: "queue:created",
  QUEUE_UPDATED: "queue:updated",
  QUEUE_DELETED: "queue:deleted",
  QUEUE_STATUS_CHANGED: "queue:status-changed",

  // Queue List Events
  QUEUE_LIST_FETCH: "fetch-queue-list",
  QUEUE_LIST_DATA: "queue-list-data",
  QUEUE_LIST_REFRESH: "queue-list-refresh",
  QUEUE_LIST_UPDATED: "queue-list-updated",

  // Session Events
  SESSION_CREATED: "session:created",
  SESSION_UPDATED: "session:updated",
  SESSION_ENDED: "session:ended",

  // Request Events
  REQUEST_UPDATED: "request:updated",
  REQUEST_COMPLETED: "request:completed",

  // Connection Events
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  ERROR: "error",

  // Legacy (to remove later)
  QUEUE_REFETCH: "queue:refetch", // Deprecated
});

// Optional: Group by category
export const QueueEvents = Object.freeze({
  CREATED: "queue:created",
  UPDATED: "queue:updated",
  DELETED: "queue:deleted",
  STATUS_CHANGED: "queue:status-changed",
  REFETCH: "queue:refetch", // Deprecated
});

export const QueueListEvents = Object.freeze({
  FETCH: "fetch-queue-list",
  DATA: "queue-list-data",
  REFRESH: "queue-list-refresh",
  UPDATED: "queue-list-updated",
});

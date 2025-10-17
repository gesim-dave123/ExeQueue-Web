import { Role } from "@prisma/client";
import { getShiftTag } from "../../../utils/shiftTag.js";
import { SocketEvents } from "../../services/enums/SocketEvents.js";
import QueueService from "../../services/queue/queue.service.js";
import { checkRole } from "../socket.auth.js";

// Only track active socket connections (no assignment logic here)
const socketToWindow = new Map(); // Map<socketId, windowId>
const windowToSocket = new Map(); // Map<windowId, socketId>

export const manageQueueSocket = (io, socket) => {
  console.log(
    `🎯 Manage Queue Connected! Id: ${socket.id} (${socket.user.role})`
  );

  if (!checkRole(socket.user, [Role.PERSONNEL, Role.WORKING_SCHOLAR])) {
    console.log("Invalid Role");
    return;
  }

  // ==================== JOIN WINDOW (After HTTP Assignment) ====================
  socket.on(SocketEvents.JOIN_WINDOW, async ({ windowId }) => {
    try {
      console.log(` Socket ${socket.id} joining window ${windowId}`);

      // ✅ VERIFY: Check if user actually has this window assigned in DB
      const shift = getShiftTag();
      const assignment = await prisma.windowAssignment.findFirst({
        where: {
          sasStaffId: socket.user.sasStaffId,
          windowId: windowId,
          shiftTag: shift,
          releasedAt: null,
        },
      });

      if (!assignment) {
        socket.emit(SocketEvents.JOIN_WINDOW_ERROR, {
          message: "You are not assigned to this window",
        });
        return;
      }

      // Check if another socket is already connected to this window
      const existingSocket = windowToSocket.get(windowId);
      if (existingSocket && existingSocket !== socket.id) {
        socket.emit(SocketEvents.JOIN_WINDOW_ERROR, {
          message: "Another session is active on this window",
        });
        return;
      }

      // Leave previous window if any
      const previousWindow = socketToWindow.get(socket.id);
      if (previousWindow) {
        socket.leave(`window-${previousWindow}`);
        windowToSocket.delete(previousWindow);
      }

      // Join new window rooms
      socket.join(`window-${windowId}`);
      socket.join("queue-updates");

      // Update mappings
      socketToWindow.set(socket.id, windowId);
      windowToSocket.set(windowId, socket.id);

      // Fetch initial queue data
      const queueData = await QueueService.getTodayQueues();

      socket.emit(SocketEvents.WINDOW_JOINED, {
        windowId,
        queueData,
        message: `Connected to Window ${windowId}`,
      });

      console.log(`✅ Socket ${socket.id} joined Window ${windowId}`);
    } catch (error) {
      console.error("❌ Error joining window:", error);
      socket.emit("error", { message: "Failed to join window" });
    }
  });

  // ==================== TAKE QUEUE ====================
  socket.on(SocketEvents.TAKE_QUEUE, async ({ queueId, windowId }) => {
    try {
      const assignedWindow = socketToWindow.get(socket.id);

      if (assignedWindow !== windowId) {
        socket.emit("error", { message: "Window mismatch" });
        return;
      }

      console.log(`📋 Window ${windowId} taking queue ${queueId}`);

      const updatedQueue = await prisma.queue.update({
        where: { queueId },
        data: {
          status: "SERVING",
          windowId: windowId,
          servedAt: new Date(),
          sasStaffId: socket.user.sasStaffId,
        },
        include: {
          student: true,
          requests: true,
        },
      });

      // Broadcast to ALL staff
      io.to("queue-updates").emit(SocketEvents.QUEUE_TAKEN, {
        queueId,
        windowId,
        takenBy: socket.id,
        queueData: updatedQueue,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ Queue ${queueId} taken by Window ${windowId}`);
    } catch (error) {
      console.error("❌ Error taking queue:", error);
      socket.emit("error", { message: "Failed to take queue" });
    }
  });

  // ==================== UPDATE QUEUE STATUS ====================
  socket.on(
    SocketEvents.UPDATE_QUEUE_STATUS,
    async ({ queueId, status, windowId }) => {
      try {
        const assignedWindow = socketToWindow.get(socket.id);

        if (assignedWindow !== windowId) {
          socket.emit("error", { message: "Window mismatch" });
          return;
        }

        const updatedQueue = await prisma.queue.update({
          where: { queueId },
          data: { status, updatedAt: new Date() },
        });

        io.to("queue-updates").emit(SocketEvents.QUEUE_STATUS_UPDATED, {
          queueId,
          status,
          windowId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("❌ Error updating status:", error);
        socket.emit("error", { message: "Failed to update status" });
      }
    }
  );

  // ==================== COMPLETE QUEUE ====================
  socket.on(SocketEvents.COMPLETE_QUEUE, async ({ queueId, windowId }) => {
    try {
      const assignedWindow = socketToWindow.get(socket.id);

      if (assignedWindow !== windowId) {
        socket.emit("error", { message: "Window mismatch" });
        return;
      }

      await prisma.queue.update({
        where: { queueId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      io.to("queue-updates").emit(SocketEvents.QUEUE_COMPLETED, {
        queueId,
        windowId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error completing queue:", error);
      socket.emit("error", { message: "Failed to complete queue" });
    }
  });

  // ==================== ANNOUNCE QUEUE ====================
  socket.on(SocketEvents.ANNOUNCE_QUEUE, async ({ queueNo, windowId }) => {
    try {
      const assignedWindow = socketToWindow.get(socket.id);

      if (assignedWindow !== windowId) {
        socket.emit("error", { message: "Window mismatch" });
        return;
      }

      io.emit(SocketEvents.QUEUE_ANNOUNCED, {
        queueNo,
        windowId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error announcing:", error);
    }
  });

  // ==================== DISCONNECT ====================
  socket.on("disconnect", () => {
    const windowId = socketToWindow.get(socket.id);

    if (windowId) {
      socket.leave(`window-${windowId}`);
      socket.leave("queue-updates");

      windowToSocket.delete(windowId);
      socketToWindow.delete(socket.id);

      console.log(
        `📴 Socket ${socket.id} disconnected from Window ${windowId}`
      );
    }
  });
};
export const queueSocket = (io, socket) => {
  // Existing queue socket implementation
};

// ==================== HELPER FUNCTIONS ====================

function releaseWindow(socket) {
  const windowId = windowAssignments.get(socket.id);

  if (windowId) {
    const roomName = `window-${windowId}`;
    socket.leave(roomName);
    socket.leave("queue-updates");

    // Clean up mappings
    windowStaff.delete(windowId);
    windowAssignments.delete(socket.id);

    // Remove from staff sockets
    for (const [staffId, sockId] of staffSockets.entries()) {
      if (sockId === socket.id) {
        staffSockets.delete(staffId);
        break;
      }
    }

    socket.emit(SocketEvents.WINDOW_RELEASED, { windowId });
    console.log(`🔓 Socket ${socket.id} released from window ${windowId}`);
  }
}

// Export helper function to check window availability
export function getAvailableWindows(allWindowIds) {
  const available = [];
  const occupied = [];

  allWindowIds.forEach((windowId) => {
    const staffId = windowStaff.get(windowId);
    if (!staffId) {
      available.push(windowId);
    } else {
      occupied.push(windowId);
    }
  });

  return { available, occupied };
}

// Queue Socket Event
export const displayQueueSocket = (io, socket) => {
  console.log(`Live Queue Connected! Id: ${socket.id} (${socket.user.role})`);

  socket.on(SocketEvents.QUEUE_LIST_FETCH, async () => {
    if (!checkRole(socket.user, [Role.PERSONNEL, Role.WORKING_SCHOLAR])) {
      console.log("Invalid Role");
      return;
    }

    try {
      const data = await QueueService.getTodayQueues();

      if (!data || data.length === 0) {
        socket.emit("error", { message: "There are no queues next in line" });
        return;
      }

      socket.emit(SocketEvents.QUEUE_LIST_DATA, data);
      console.log(
        `Sent current queue list to ${socket.id} (${socket.user.role})`
      );
    } catch (error) {
      console.error("❌ Failed to get next-in-line queues:", error);
      socket.emit("error", { message: "Could not fetch next-in-line data" });
    }
  });

  socket.on("refresh-display", async () => {
    if (!checkRole(socket.user, [Role.PERSONNEL, Role.WORKING_SCHOLAR])) {
      return;
    }

    try {
      const data = await QueueService.getTodayQueues();
      socket.emit("next-in-line-update", data);
      console.log(
        `🔄 Refreshed display for ${socket.id} (${socket.user.role})`
      );
    } catch (error) {
      console.error("❌ Failed to refresh display:", error);
      socket.emit("error", { message: "Could not refresh display" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`📴 Display disconnected: ${socket.id} (${socket.user?.role})`);
  });
};

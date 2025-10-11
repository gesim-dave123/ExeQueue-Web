import { Role } from "@prisma/client";
import QueueService from "../../services/queue/queue.service.js";
import { checkRole } from "../socket.auth.js";
export const queueSocket = (io, socket) => {};

export const manageQueueSocket = (io, socket) => {};

export const displayQueueSocket = (io, socket) => {
  console.log(`Live Queue Connected! Id: ${socket.id} (${socket.user.role})`);

  // Both PERSONNEL and WORKING_SCHOLAR can view the display
  socket.on("fetch-queue-list", async () => {
    if (!checkRole(socket.user, [Role.PERSONNEL, Role.WORKING_SCHOLAR])) {
      console.log("Invalid Role");
      return; // checkRole already emits error
    }

    try {
      console.log("Hellooo");
      const data = await QueueService.getTodayQueues();
      // console.log("data: ", data);
      if (!data || data.length === 0) {
        socket.emit("error", { message: "There are no queues next in line" });
        return;
      }

      socket.emit("queue-list-data", data);
      console.log(
        `Sent current queue list to ${socket.id} (${socket.user.role})`
      );
    } catch (error) {
      console.error("❌ Failed to get next-in-line queues:", error);
      socket.emit("error", { message: "Could not fetch next-in-line data" });
    }
  });

  // Both roles can refresh
  socket.on("refresh-display", async () => {
    if (!checkRole(socket, ["PERSONNEL", "WORKING_SCHOLAR"])) {
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

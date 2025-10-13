import {
  displayQueueSocket,
  manageQueueSocket,
  queueSocket,
} from "./socket.events/queue.socket.js";
import { testingSocket } from "./socket.events/testing.socket.js";
import { windowSocket } from "./socket.events/window.socket.js";

export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    queueSocket(io, socket);
    manageQueueSocket(io, socket);
    windowSocket(io, socket);
    displayQueueSocket(io, socket);
    testingSocket(io, socket);

    // Example: disconnect
    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });
};

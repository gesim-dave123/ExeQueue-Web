import {
  QueueEvents,
  WindowEvents,
} from "../../services/enums/SocketEvents.js";

export const windowSocket = (io, socket) => {
  console.log("🪟 Window connected:", socket.id);

  // ✅ Join rooms for broadcasts
  socket.on(WindowEvents.WINDOW_JOINED, ({ windowId }) => {
    socket.join(`window:${windowId}`);
    socket.join(QueueEvents.REFETCH);
    console.log(`Socket ${socket.id} joined window:${windowId}`);
  });

  // ✅ Handle window release
  socket.on(WindowEvents.RELEASE_WINDOW, (data) => {
    const { previousWindowId } = data;
    socket.leave(`window:${previousWindowId}`);
    socket.broadcast
      .to(QueueEvents.REFETCH)
      .emit(WindowEvents.RELEASE_WINDOW, data);
  });
  socket.on("disconnect", () => {
    console.log("❌ Window disconnected:", socket.id);
  });
};

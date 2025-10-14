import {
  QueueActions,
  QueueEvents,
  WindowEvents,
} from "../../services/enums/SocketEvents.js";

export const windowSocket = (io, socket) => {
  console.log("🪟 Window connected:", socket.id);
  console.log("Inataaayy");
  // ✅ Join rooms
  socket.on(WindowEvents.WINDOW_JOINED, ({ windowId }) => {
    socket.join(`window:${windowId}`);
    socket.join(QueueEvents.REFETCH); // global room for queue sync
    console.log(`Socket ${socket.id} joined window:${windowId}`);
  });

  // ✅ Handle when a window calls next
  console.log("Listening for:", QueueActions.CALL_NEXT);
  socket.on("call:next", (data) => {
    const { windowId, queueId, queueNo } = data;
    console.log("BOPBOOO");

    console.log(`📣 Window ${windowId} called next queue ${queueNo}`);

    // Tell every other window to remove that queue from global list
    socket.broadcast.to(QueueEvents.REFETCH).emit(QueueActions.QUEUE_TAKEN, {
      queueId,
      queueNo,
    });

    // Tell this window (caller) they successfully took it
    io.to(`window:${windowId}`).emit(QueueActions.TAKE_QUEUE, {
      queueId,
      queueNo,
      message: `Now serving ${queueNo}`,
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Window disconnected:", socket.id);
  });
};

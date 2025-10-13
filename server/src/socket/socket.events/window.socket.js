export const windowSocket = (io, socket) => {
  console.log("🪟 Window socket connected:", socket.id);

  socket.on("join-window", ({ windowId }) => {
    socket.join(`window:${windowId}`);
    console.log(`Socket ${socket.id} joined window:${windowId}`);
  });

  socket.on("release-window", ({ windowId }) => {
    socket.leave(`window:${windowId}`);
    console.log(`Socket ${socket.id} left window:${windowId}`);
  });
};

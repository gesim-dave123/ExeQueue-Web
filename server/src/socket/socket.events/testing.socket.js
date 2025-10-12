export const testingSocket = (io, socket) => {
  // Example: join private student room
  socket.on("join-student-room", (studentId) => {
    socket.join(`student-${studentId}`);
    console.log(`Student ${studentId} joined room student-${studentId}`);
  });
  socket.on("testBroadcast", (message) => {
    console.log("Message from client:", message);
    socket.broadcast.emit("testMessage", message);
  });
};

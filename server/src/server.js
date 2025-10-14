import cookie from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import { Server } from 'socket.io';
import AuthRoute from '../src/routes/auth.route.js';
import StaffRoute from '../src/routes/staff.route.js';
import validateAccess from '../utils/validate.js';
import StudentRoute from './routes/student.route.js';
import StatisticsRoute from './routes/statistics.route.js';

dotenv.config();

validateAccess();

import '../utils/cron.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN : true, // React dev server
    credentials: true,
  })
);

app.use(cookie());
app.use(morgan('dev'));
app.use(helmet());

// Server Routes
app.use('/api/auth', AuthRoute);
app.use('/api/student', StudentRoute);
app.use('/api/staff', StaffRoute);
app.use('/api/statistics', StatisticsRoute);
// app.use('/api/request', RequestRoute)
// app.use('/api/course', CourseRoute)
// app.use('/api/student', StudentRoute)

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN : true, // React dev server
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

export { io };

io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  socket.on('join-analytics-room', () => {
    socket.join('analytics-room');
    console.log(`Socket ${socket.id} joined analytics-room`);
  });

  // Example: join private student room
  socket.on('join-student-room', (studentId) => {
    socket.join(`student-${studentId}`);
    console.log(`Student ${studentId} joined room student-${studentId}`);
  });

  socket.on('testBroadcast', (message) => {
    console.log('Message from client:', message);
    socket.broadcast.emit('testMessage', message);
  });

  // Example: disconnect
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log('Server is running on port ', PORT);
});
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server running on http://0.0.0.0:${PORT}`);
// //   console.log(`Accessible from network: http://YOUR-IP:${PORT}`);
// });

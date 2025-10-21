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
import StaffQueue from './routes/queue.route.js';
import StudentRoute from './routes/student.route.js';
import { socketAuthentication } from './socket/socket.auth.js';
import { socketHandler } from './socket/socketHandler.js';
import StatisticsRoute from './routes/statistics.route.js';
import SessionRoute from './routes/session.route.js';
// import io from 'io'
dotenv.config();

validateAccess();

import '../utils/cron.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN
        : process.env.CORS_ORIGIN, // React dev server
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
app.use('/api/staff/queue', StaffQueue);
app.use('/api/statistics', StatisticsRoute);
app.use('/api/session', SessionRoute);
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN
        : process.env.CORS_ORIGIN, // React dev server
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
socketAuthentication(io);
socketHandler(io);

server.listen(PORT, () => {
  console.log('Server is running on port ', PORT);
});
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server running on http://0.0.0.0:${PORT}`);
// //   console.log(`Accessible from network: http://YOUR-IP:${PORT}`);
// });

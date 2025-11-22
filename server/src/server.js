import cookie from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import AuthRoute from "../src/routes/auth.route.js";
import StaffRoute from "../src/routes/staff.route.js";
import validateAccess from "../utils/validate.js";
import StaffQueue from "./routes/queue.route.js";
import SessionRoute from "./routes/session.route.js";
import StatisticsRoute from "./routes/statistics.route.js";
import StudentRoute from "./routes/student.route.js";
import transactionRoutes from "./routes/transaction.route.js";
import { START_SCHEDULERS } from "./scheduler/scheduler.js";
import { socketAuthentication } from "./socket/socket.auth.js";
import { socketHandler } from "./socket/socketHandler.js";
dotenv.config();

validateAccess();

import "../utils/cron.js";

const app = express();
const PORT = process.env.PORT || 5000;
function corsOrigin(origin, callback) {
  const cloudflareRegex = /\.trycloudflare\.com$|\.cfargotunnels\.com$/;
  if (!origin) return callback(null, true);
  if (origin.includes("localhost")) return callback(null, true);
  if (cloudflareRegex.test(origin)) return callback(null, true);
  if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN)
    return callback(null, true);
  return callback(new Error("CORS Blocked: " + origin));
}
app.use(express.json());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(cookie());
app.use(morgan("dev"));
app.use(helmet());

// Server Routes
app.use("/api/auth", AuthRoute);
app.use("/api/student", StudentRoute);
app.use("/api/staff", StaffRoute);
app.use("/api/staff/queue", StaffQueue);
app.use("/api/statistics", StatisticsRoute);
app.use("/api/staff/transaction", transactionRoutes);
app.use("/api/staff/session", SessionRoute);
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

app.set("io", io);
socketAuthentication(io);
socketHandler(io);

server.listen(PORT, () => {
  console.log("Server is running on port ", PORT);
  START_SCHEDULERS(io);
});

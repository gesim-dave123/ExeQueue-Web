
import cookie from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import AuthRoute from '../src/routes/auth.route.js';
import CourseRoute from '../src/routes/course.route.js';
import QueueRoute from '../src/routes/queue.route.js';
import RequestRoute from '../src/routes/request.route.js';
import validateAccess from '../utils/validate.js';


dotenv.config();

validateAccess();

const app = express();
const PORT = process.env.PORT||5000;

app.use(express.json())
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.CORS_ORIGIN : true,  // React dev server
  credentials: true
}));

app.use(cookie())
app.use(morgan('dev'))
app.use(helmet())

// Server Routes
app.use('/api/auth', AuthRoute)
app.use('/api/queue', QueueRoute)
app.use('/api/request', RequestRoute)
app.use('/api/course', CourseRoute)
// app.use('/api/student', StudentRoute)

app.listen(PORT, () => {
    console.log('Server is running on port ', PORT);
})
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server running on http://0.0.0.0:${PORT}`);
// //   console.log(`Accessible from network: http://YOUR-IP:${PORT}`);
// });
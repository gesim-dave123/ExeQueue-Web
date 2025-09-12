
import cookie from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import AuthRoute from '../src/routes/auth.route.js';


dotenv.config();
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

app.listen(PORT, () => {
    console.log('Server is running on port ', PORT);
})
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server running on http://0.0.0.0:${PORT}`);
// //   console.log(`Accessible from network: http://YOUR-IP:${PORT}`);
// });
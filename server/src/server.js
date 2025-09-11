
import cookie from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import AuthRoute from '../src/routes/auth.route.js';
import { PrismaClient } from './generated/prisma/index.js';


dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT||5000;

app.use(express.json())
app.use(cors())
app.use(cookie())
app.use(morgan('dev'))
app.use(helmet())




app.use('/api/auth', AuthRoute)






app.listen(PORT, () => {
    console.log('Server is running on port ', PORT);
})
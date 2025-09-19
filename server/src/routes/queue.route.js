import express from 'express';
import { generateQueue } from '../controllers/queue.controller.js';

const router = express.Router();

router.post('/generate', generateQueue)


export default router;

import express from 'express';
import { generateQueue } from '../controllers/queue.controller.js';
import { getQueueStatus } from '../controllers/queue.controller.js';
const router = express.Router();

router.post('/generate', generateQueue);

router.get('status/:schoolId', getQueueStatus);
export default router;

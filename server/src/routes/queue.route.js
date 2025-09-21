import express from 'express';
import {
  generateQueue,
  getQueueStatus,
  getQueueOverview,
} from '../controllers/queue.controller.js';

const router = express.Router();

router.post('/generate', generateQueue);

router.get('/status/:schoolId', getQueueStatus);

router.get('/overview/:schoolId', getQueueOverview);

export default router;

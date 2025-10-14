import express from 'express';
import {
  generateQueue,
  getCourseData,
  getQueue,
  getQueueOverview,
  getQueueStatus,
  getRequestTypes,
  getQueueDisplay,
  searchQueue,
} from '../controllers/student.controller.js';

const router = express.Router();

router.post('/queue/generate', generateQueue);
router.get('/queue/view', getQueue);
router.get('/queue/status/:schoolId', getQueueStatus);
router.get('/queue/overview/:schoolId', getQueueOverview);
router.get('/courses', getCourseData);
router.get('/requests', getRequestTypes);

router.get('/queue/search', searchQueue);
router.get('/queue/:referenceNumber', getQueueDisplay);

export default router;

import express from 'express';
import {
  generateQueue,
  getCourseData,
  getQueue,
  getQueueOverview,
  getQueueStatus,
  getRequestTypes
} from '../controllers/student.controller.js';


const router = express.Router();

router.post('/queue/generate', generateQueue)
router.get('/queue/view', getQueue)
router.get('/queue/status/:schoolId', getQueueStatus);
router.get('/queue/overview/:schoolId', getQueueOverview);
router.get('/courses', getCourseData)
router.get('/requests', getRequestTypes)


export default router;

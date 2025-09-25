import express from 'express';
import { getCourseData } from '../controllers/course.controller.js';

const router = express.Router();

router.get('/courses', getCourseData);

export default router;

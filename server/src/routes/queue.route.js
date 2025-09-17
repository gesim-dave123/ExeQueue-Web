import express from 'express';
import { createQueue } from '../controllers/queue.controller.js';

const router = express.Router()

router.post('/', createQueue)


export default router;
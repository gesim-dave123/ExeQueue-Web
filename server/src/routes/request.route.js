import express from 'express';
import { getRequestTypes } from '../controllers/request.controller.js';

const router = express.Router();


router.get('/request-type', getRequestTypes)


export default router;



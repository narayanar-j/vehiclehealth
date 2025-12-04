import { Router } from 'express';
import { createDeviceEvent, getRecentEvents } from '../controllers/eventsController';

const router = Router();
router.post('/', createDeviceEvent);
router.get('/', getRecentEvents);

export default router;

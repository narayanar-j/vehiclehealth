import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController';

const router = Router();
router.get('/:customerId', getDashboard);

export default router;

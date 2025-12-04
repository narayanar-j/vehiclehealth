import { Router } from 'express';
import { runDtcJob } from '../controllers/dtcController';

const router = Router();
router.post('/run-job', runDtcJob);

export default router;

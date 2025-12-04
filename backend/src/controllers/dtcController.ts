import { Request, Response } from 'express';
import { notifyOutstandingDtcCodes } from '../services/dtcNotificationService';

export async function runDtcJob(req: Request, res: Response) {
  try {
    const result = await notifyOutstandingDtcCodes();
    res.json(result);
  } catch (error) {
    console.error('Manual DTC job failed', error);
    res.status(500).json({ message: 'Failed to execute DTC notification job' });
  }
}

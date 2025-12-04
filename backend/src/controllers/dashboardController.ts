import { Request, Response } from 'express';
import { z } from 'zod';
import { getDashboardSummary } from '../services/dashboardService';

const paramsSchema = z.object({ customerId: z.string().min(1) });

export async function getDashboard(req: Request, res: Response) {
  try {
    const { customerId } = paramsSchema.parse(req.params);
    const summary = await getDashboardSummary(customerId);
    res.json(summary);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid customer id' });
    }
    console.error('Dashboard fetch failed', error);
    res.status(500).json({ message: 'Unable to load dashboard' });
  }
}

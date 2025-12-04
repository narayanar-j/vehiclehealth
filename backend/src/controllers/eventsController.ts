import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { ingestDeviceEvent } from '../services/eventProcessor';
import { prisma } from '../services/prisma';

const eventTypes = ['tripstart', 'gps', 'dtc', 'tripend'] as const;

const eventSchema = z.object({
  vehicleId: z.string().min(1),
  eventType: z.enum(eventTypes),
  timestamp: z.string().datetime(),
  payload: z.record(z.string(), z.any()).default({}),
});

export async function createDeviceEvent(req: Request, res: Response) {
  try {
    const parsed = eventSchema.parse(req.body);
    const event = await ingestDeviceEvent(parsed);
    res.status(201).json({ event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid payload', issues: error.issues });
    }
    console.error('Event ingestion failed', error);
    res.status(500).json({ message: 'Failed to ingest event' });
  }
}

export async function getRecentEvents(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit ?? 10);
    const customerId = req.query.customerId as string | undefined;

    const query: Prisma.DeviceEventFindManyArgs = {
      include: { vehicle: true },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    };

    if (customerId) {
      query.where = { vehicle: { customerId } };
    }

    const events = await prisma.deviceEvent.findMany(query);

    res.json({ events });
  } catch (error) {
    console.error('Failed to fetch events', error);
    res.status(500).json({ message: 'Unable to load events' });
  }
}

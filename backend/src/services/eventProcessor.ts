import { EventType } from '@prisma/client';
import { prisma } from './prisma';
import { DeviceEventPayload } from '../types/events';

async function ensureVehicle(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    // create stub vehicle to keep flow functional in demo environments
    return prisma.vehicle.create({
      data: {
        id: vehicleId,
        customer: {
          connectOrCreate: {
            where: { id: 'demo-customer' },
            create: {
              id: 'demo-customer',
              name: 'Demo Customer',
              adminEmail: 'admin@example.com',
            },
          },
        },
        vin: `VIN-${vehicleId}`,
        label: `Vehicle ${vehicleId}`,
      },
    });
  }
  return vehicle;
}

export async function ingestDeviceEvent(event: DeviceEventPayload) {
  await ensureVehicle(event.vehicleId);

  const createdEvent = await prisma.deviceEvent.create({
    data: {
      vehicleId: event.vehicleId,
      eventType: mapEventType(event.eventType),
      payload: event.payload,
      occurredAt: new Date(event.timestamp),
    },
  });

  switch (createdEvent.eventType) {
    case EventType.TRIP_START:
      await prisma.trip.create({
        data: {
          vehicleId: event.vehicleId,
          tripStartedAt: new Date(event.timestamp),
          mileage: event.payload.mileage ?? null,
        },
      });
      break;
    case EventType.GPS:
      await updateTripLocation(event.vehicleId, event.payload);
      break;
    case EventType.DTC:
      await prisma.dtcCode.create({
        data: {
          vehicleId: event.vehicleId,
          tripId: await resolveLatestTripId(event.vehicleId),
          code: event.payload.code,
          description: event.payload.description,
          severity: event.payload.severity,
        },
      });
      break;
    case EventType.TRIP_END:
      await prisma.trip.updateMany({
        where: { vehicleId: event.vehicleId, tripEndedAt: null },
        data: {
          tripEndedAt: new Date(event.timestamp),
          mileage: event.payload.mileage ?? undefined,
        },
      });
      break;
    default:
      break;
  }

  return createdEvent;
}

function mapEventType(eventType: DeviceEventPayload['eventType']): EventType {
  switch (eventType) {
    case 'tripstart':
      return EventType.TRIP_START;
    case 'gps':
      return EventType.GPS;
    case 'dtc':
      return EventType.DTC;
    case 'tripend':
      return EventType.TRIP_END;
    default:
      return EventType.GPS;
  }
}

async function updateTripLocation(vehicleId: string, payload: Record<string, any>) {
  const { lat, lng, address } = payload;
  await prisma.trip.updateMany({
    where: { vehicleId, tripEndedAt: null },
    data: {
      ...(typeof lat === 'number' ? { lastLat: lat } : {}),
      ...(typeof lng === 'number' ? { lastLng: lng } : {}),
      ...(address ? { lastAddress: address } : {}),
    },
  });
}

async function resolveLatestTripId(vehicleId: string) {
  const trip = await prisma.trip.findFirst({
    where: { vehicleId },
    orderBy: { tripStartedAt: 'desc' },
  });
  return trip?.id ?? null;
}

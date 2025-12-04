import { EventType } from '@prisma/client';
import { prisma } from '../src/services/prisma';

type TimelineEvent = {
  eventType: EventType;
  minutesAgo: number;
  payload: Record<string, any>;
};

const eventScripts: Record<string, TimelineEvent[]> = {
  'VH-101': [
    {
      eventType: EventType.TRIP_START,
      minutesAgo: 35,
      payload: {
        location: 'Washington National Pike, Boyds, MD',
        mileage: 4832,
        eventLabel: 'Ignition On',
      },
    },
    {
      eventType: EventType.GPS,
      minutesAgo: 33,
      payload: {
        lat: 39.218,
        lng: -77.281,
        speedMph: 8,
        location: 'Boyds Depot, MD',
        eventLabel: 'GPS Fix (Idling)',
      },
    },
    {
      eventType: EventType.GPS,
      minutesAgo: 22,
      payload: {
        lat: 39.216,
        lng: -77.278,
        speedMph: 64,
        location: 'Washington National Pike, Boyds, MD',
        eventLabel: 'GPS Fix (Cruising)',
      },
    },
    {
      eventType: EventType.DTC,
      minutesAgo: 20,
      payload: {
        code: 'P0420',
        severity: 'High',
        description: 'Catalyst efficiency below threshold',
        location: 'Boyds, MD',
        eventLabel: 'DTC P0420',
      },
    },
    {
      eventType: EventType.GPS,
      minutesAgo: 12,
      payload: {
        lat: 39.142,
        lng: -77.213,
        speedMph: 38,
        location: 'Montpelier Community, MD',
        eventLabel: 'GPS Fix (Approaching depot)',
      },
    },
    {
      eventType: EventType.TRIP_END,
      minutesAgo: 5,
      payload: {
        location: 'Gaithersburg, MD',
        mileage: 4848,
        eventLabel: 'Ignition Off',
      },
    },
  ],
  'VH-102': [
    {
      eventType: EventType.TRIP_START,
      minutesAgo: 40,
      payload: {
        location: 'Myersville Yard, MD',
        mileage: 5110,
        eventLabel: 'Ignition On',
      },
    },
    {
      eventType: EventType.GPS,
      minutesAgo: 32,
      payload: {
        lat: 39.49,
        lng: -77.55,
        speedMph: 20,
        location: 'Old National Pike, Myersville, MD',
        eventLabel: 'GPS Fix (Warm-up)',
      },
    },
    {
      eventType: EventType.GPS,
      minutesAgo: 26,
      payload: {
        lat: 39.494,
        lng: -77.566,
        speedMph: 75,
        location: '3002 Ventrie Ct, Myersville, MD',
        eventLabel: 'GPS Fix (Highway 75 MPH)',
      },
    },
    {
      eventType: EventType.DTC,
      minutesAgo: 24,
      payload: {
        code: 'P0301',
        severity: 'Medium',
        description: 'Cylinder 1 misfire detected',
        location: 'Myersville, MD',
        eventLabel: 'DTC P0301',
      },
    },
    {
      eventType: EventType.GPS,
      minutesAgo: 15,
      payload: {
        lat: 39.38,
        lng: -77.31,
        speedMph: 45,
        location: 'US-40 Alt, MD',
        eventLabel: 'GPS Fix (En route)',
      },
    },
    {
      eventType: EventType.TRIP_END,
      minutesAgo: 8,
      payload: {
        location: 'Mount Airy, MD',
        mileage: 5139,
        eventLabel: 'Ignition Off',
      },
    },
  ],
  'VH-103': [
    {
      eventType: EventType.TRIP_START,
      minutesAgo: 25,
      payload: {
        location: 'Gaithersburg HQ, MD',
        mileage: 7600,
        eventLabel: 'Ignition On',
      },
    },
    {
      eventType: EventType.GPS,
      minutesAgo: 20,
      payload: {
        lat: 39.02,
        lng: -77.16,
        speedMph: 12,
        location: 'Airpark Rd, Gaithersburg, MD',
        eventLabel: 'GPS Fix (Yard move)',
      },
    },
    {
      eventType: EventType.GPS,
      minutesAgo: 14,
      payload: {
        lat: 39.017,
        lng: -77.155,
        speedMph: 0,
        location: '7631 Airpark Rd, Gaithersburg, MD',
        eventLabel: 'GPS Fix (Stopped)',
      },
    },
    {
      eventType: EventType.TRIP_END,
      minutesAgo: 10,
      payload: {
        location: 'Gaithersburg HQ, MD',
        mileage: 7600,
        eventLabel: 'Ignition Off',
      },
    },
  ],
};

function minutesAgo(now: Date, minutes: number) {
  return new Date(now.getTime() - minutes * 60 * 1000);
}

async function main() {
  const now = new Date();
  const customer = await prisma.customer.upsert({
    where: { id: 'customer-azuga' },
    update: {},
    create: {
      id: 'customer-azuga',
      name: 'Azuga Demo Fleet',
      adminEmail: 'fleet.admin@azuga-demo.com',
      adminPhone: '+1-555-0100',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@azuga-demo.com' },
    update: {},
    create: {
      email: 'admin@azuga-demo.com',
      displayName: 'Demo Admin',
      role: 'ADMIN',
      customerId: customer.id,
    },
  });

  const vehicles = await Promise.all(
    ['VH-101', 'VH-102', 'VH-103'].map((id, index) =>
      prisma.vehicle.upsert({
        where: { id },
        update: {},
        create: {
          id,
          customerId: customer.id,
          vin: `VIN-DEMO-${index + 1}`,
          label: `Ops ${index + 1}`,
          driverName: `Driver ${index + 1}`,
          driverPushId: `push-token-${index + 1}`,
        },
      })
    )
  );

  for (const vehicle of vehicles) {
    const timeline =
      eventScripts[vehicle.id] ??
      [
        {
          eventType: EventType.TRIP_START,
          minutesAgo: 35,
          payload: { location: 'Montpelier Hills, MD', mileage: 3000 + Math.random() * 100, eventLabel: 'Ignition On' },
        },
        {
          eventType: EventType.GPS,
          minutesAgo: 20,
          payload: {
            lat: 39.06 + Math.random() * 0.01,
            lng: -77.04 + Math.random() * 0.01,
            speedMph: 52,
            location: 'Montpelier Community Park, MD',
            eventLabel: 'GPS Fix',
          },
        },
        {
          eventType: EventType.TRIP_END,
          minutesAgo: 6,
          payload: { location: 'Laurel, MD', mileage: 3025 + Math.random() * 60, eventLabel: 'Ignition Off' },
        },
      ];

    const orderedTimeline = timeline.slice().sort((a, b) => b.minutesAgo - a.minutesAgo);
    if (!orderedTimeline.length) {
      continue;
    }

    const firstEvent = orderedTimeline[0]!;
    const latestEvent = orderedTimeline[orderedTimeline.length - 1]!;
    const tripStart = minutesAgo(now, firstEvent.minutesAgo);
    const tripEndEvent = orderedTimeline.find((event) => event.eventType === EventType.TRIP_END);
    const tripEnd = tripEndEvent ? minutesAgo(now, tripEndEvent.minutesAgo) : null;
    const lastLat = typeof latestEvent.payload.lat === 'number' ? latestEvent.payload.lat : null;
    const lastLng = typeof latestEvent.payload.lng === 'number' ? latestEvent.payload.lng : null;
    const lastAddress = typeof latestEvent.payload.location === 'string' ? latestEvent.payload.location : null;
    const mileage = typeof latestEvent.payload.mileage === 'number' ? latestEvent.payload.mileage : null;
    const trip = await prisma.trip.create({
      data: {
        vehicleId: vehicle.id,
        tripStartedAt: tripStart,
        tripEndedAt: tripEnd,
        lastLat,
        lastLng,
        lastAddress,
        mileage,
      },
    });

    for (const event of orderedTimeline) {
      await prisma.deviceEvent.create({
        data: {
          vehicleId: vehicle.id,
          eventType: event.eventType,
          payload: event.payload,
          occurredAt: minutesAgo(now, event.minutesAgo),
        },
      });
    }

    const dtcEvent = orderedTimeline.find((event) => event.eventType === EventType.DTC);
    if (dtcEvent) {
      const dtcPayload = dtcEvent.payload as {
        code?: string;
        severity?: string;
        description?: string;
      };
      await prisma.dtcCode.create({
        data: {
          vehicleId: vehicle.id,
          tripId: trip.id,
          code: dtcPayload.code ?? 'P0000',
          severity: dtcPayload.severity ?? null,
          description: dtcPayload.description ?? null,
          detectedAt: minutesAgo(now, dtcEvent.minutesAgo),
        },
      });
    }
  }

  console.log('Seed finished');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

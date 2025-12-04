import { prisma } from '../src/services/prisma';

async function main() {
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
    const trip = await prisma.trip.create({
      data: {
        vehicleId: vehicle.id,
        tripStartedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        lastLat: 39.0623 + Math.random() * 0.01,
        lastLng: -77.044 + Math.random() * 0.01,
        lastAddress: 'Montpelier Community, MD',
        mileage: 120 + Math.random() * 40,
      },
    });

    if (vehicle.id !== 'VH-103') {
      await prisma.dtcCode.create({
        data: {
          vehicleId: vehicle.id,
          tripId: trip.id,
          code: vehicle.id === 'VH-101' ? 'P0420' : 'P0301',
          severity: 'High',
          description: 'Catalyst system efficiency below threshold',
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

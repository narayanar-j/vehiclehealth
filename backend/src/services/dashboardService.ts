import { subDays } from 'date-fns';
import { prisma } from './prisma';

export async function getDashboardSummary(customerId: string) {
  const windowStart = subDays(new Date(), 7);

  const [vehicles, dtcVehicles, appointments] = await Promise.all([
    prisma.vehicle.count({ where: { customerId } }),
    prisma.dtcCode.findMany({
      where: {
        vehicle: { customerId },
        detectedAt: { gte: windowStart },
      },
      select: { vehicleId: true },
      distinct: ['vehicleId'],
    }),
    prisma.appointment.count({ where: { customerId, createdAt: { gte: windowStart } } }),
  ]);

  const problematicVehicleCount = dtcVehicles.length;
  const okVehicleCount = Math.max(vehicles - problematicVehicleCount, 0);

  return {
    totalVehicles: vehicles,
    problematicVehicles: problematicVehicleCount,
    healthyVehicles: okVehicleCount,
    appointmentsBooked: appointments,
    dtcVehicles,
  };
}

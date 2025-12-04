"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = getDashboardSummary;
const date_fns_1 = require("date-fns");
const prisma_1 = require("./prisma");
async function getDashboardSummary(customerId) {
    const windowStart = (0, date_fns_1.subDays)(new Date(), 7);
    const [vehicles, dtcVehicles, appointments] = await Promise.all([
        prisma_1.prisma.vehicle.count({ where: { customerId } }),
        prisma_1.prisma.dtcCode.findMany({
            where: {
                vehicle: { customerId },
                detectedAt: { gte: windowStart },
            },
            select: { vehicleId: true },
            distinct: ['vehicleId'],
        }),
        prisma_1.prisma.appointment.count({ where: { customerId, createdAt: { gte: windowStart } } }),
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
//# sourceMappingURL=dashboardService.js.map
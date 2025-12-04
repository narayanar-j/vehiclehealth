"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestDeviceEvent = ingestDeviceEvent;
const client_1 = require("@prisma/client");
const prisma_1 = require("./prisma");
async function ensureVehicle(vehicleId) {
    const vehicle = await prisma_1.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
        // create stub vehicle to keep flow functional in demo environments
        return prisma_1.prisma.vehicle.create({
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
async function ingestDeviceEvent(event) {
    await ensureVehicle(event.vehicleId);
    const createdEvent = await prisma_1.prisma.deviceEvent.create({
        data: {
            vehicleId: event.vehicleId,
            eventType: mapEventType(event.eventType),
            payload: event.payload,
            occurredAt: new Date(event.timestamp),
        },
    });
    switch (createdEvent.eventType) {
        case client_1.EventType.TRIP_START:
            await prisma_1.prisma.trip.create({
                data: {
                    vehicleId: event.vehicleId,
                    tripStartedAt: new Date(event.timestamp),
                    mileage: event.payload.mileage ?? null,
                },
            });
            break;
        case client_1.EventType.GPS:
            await updateTripLocation(event.vehicleId, event.payload);
            break;
        case client_1.EventType.DTC:
            await prisma_1.prisma.dtcCode.create({
                data: {
                    vehicleId: event.vehicleId,
                    tripId: await resolveLatestTripId(event.vehicleId),
                    code: event.payload.code,
                    description: event.payload.description,
                    severity: event.payload.severity,
                },
            });
            break;
        case client_1.EventType.TRIP_END:
            await prisma_1.prisma.trip.updateMany({
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
function mapEventType(eventType) {
    switch (eventType) {
        case 'tripstart':
            return client_1.EventType.TRIP_START;
        case 'gps':
            return client_1.EventType.GPS;
        case 'dtc':
            return client_1.EventType.DTC;
        case 'tripend':
            return client_1.EventType.TRIP_END;
        default:
            return client_1.EventType.GPS;
    }
}
async function updateTripLocation(vehicleId, payload) {
    const { lat, lng, address } = payload;
    await prisma_1.prisma.trip.updateMany({
        where: { vehicleId, tripEndedAt: null },
        data: {
            ...(typeof lat === 'number' ? { lastLat: lat } : {}),
            ...(typeof lng === 'number' ? { lastLng: lng } : {}),
            ...(address ? { lastAddress: address } : {}),
        },
    });
}
async function resolveLatestTripId(vehicleId) {
    const trip = await prisma_1.prisma.trip.findFirst({
        where: { vehicleId },
        orderBy: { tripStartedAt: 'desc' },
    });
    return trip?.id ?? null;
}
//# sourceMappingURL=eventProcessor.js.map
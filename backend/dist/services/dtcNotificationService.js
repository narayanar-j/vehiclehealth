"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyOutstandingDtcCodes = notifyOutstandingDtcCodes;
const date_fns_1 = require("date-fns");
const client_1 = require("@prisma/client");
const prisma_1 = require("./prisma");
const emailService_1 = require("./emailService");
const pushService_1 = require("./pushService");
const bookingService_1 = require("./bookingService");
const env_1 = require("../config/env");
async function notifyOutstandingDtcCodes() {
    const since = (0, date_fns_1.subDays)(new Date(), 7);
    const dtcItems = await prisma_1.prisma.dtcCode.findMany({
        where: {
            detectedAt: { gte: since },
            notificationLogs: { none: { channel: 'weekly-email' } },
        },
        include: {
            vehicle: {
                include: {
                    customer: true,
                    trips: { orderBy: { tripStartedAt: 'desc' }, take: 1 },
                },
            },
        },
    });
    for (const dtc of dtcItems) {
        const vehicle = dtc.vehicle;
        const customer = vehicle.customer;
        const lastTrip = vehicle.trips[0];
        try {
            const booking = await createBookingFallback({
                vehicleId: vehicle.id,
                customerId: customer.id,
                dtcCodes: [dtc.code],
            });
            const lastLocation = lastTrip
                ? {
                    ...(lastTrip.lastLat !== null ? { lat: lastTrip.lastLat } : {}),
                    ...(lastTrip.lastLng !== null ? { lng: lastTrip.lastLng } : {}),
                    ...(lastTrip.lastAddress ? { address: lastTrip.lastAddress } : {}),
                }
                : undefined;
            const dtcDetails = {
                code: dtc.code,
                ...(dtc.description ? { description: dtc.description } : {}),
                ...(dtc.severity ? { severity: dtc.severity } : {}),
            };
            await (0, emailService_1.sendDtcEmail)({
                adminEmail: customer.adminEmail,
                customerName: customer.name,
                vehicleLabel: vehicle.label,
                vin: vehicle.vin,
                dtcCodes: [dtcDetails],
                bookingLink: booking.bookingLink,
                ...(lastLocation ? { lastLocation } : {}),
            });
            await prisma_1.prisma.notificationLog.create({
                data: {
                    dtcId: dtc.id,
                    channel: 'weekly-email',
                    success: true,
                },
            });
        }
        catch (error) {
            console.error('Failed to send DTC email', error);
            await prisma_1.prisma.notificationLog.create({
                data: {
                    dtcId: dtc.id,
                    channel: 'weekly-email',
                    success: false,
                    message: (error instanceof Error ? error.message : 'Unknown error') ?? null,
                },
            });
        }
        try {
            const pushResult = await (0, pushService_1.sendDriverPush)({
                pushToken: vehicle.driverPushId,
                title: 'Vehicle health alert',
                body: `${vehicle.label} reported DTC ${dtc.code}. Tap to view details`,
                data: { vehicleId: vehicle.id, dtcId: dtc.id },
            });
            await prisma_1.prisma.notificationLog.create({
                data: {
                    dtcId: dtc.id,
                    channel: 'driver-push',
                    success: pushResult.delivered,
                    message: pushResult.delivered ? null : pushResult.detail ?? null,
                },
            });
        }
        catch (error) {
            console.warn('Failed to push notification', error);
        }
    }
    return { processed: dtcItems.length };
}
async function createBookingFallback({ vehicleId, customerId, dtcCodes }) {
    try {
        const result = await (0, bookingService_1.createBridgestoneBooking)({ vehicleId, customerId, dtcCodes });
        return {
            bookingId: result.bookingId,
            bookingLink: result.deepLink ?? `${env_1.env.BASE_CLIENT_URL}/bookings/${result.bookingId}`,
        };
    }
    catch (error) {
        console.warn('Booking API failed, falling back to internal link', error instanceof Error ? error.message : error);
        const fallbackId = `local-${Date.now()}`;
        await prisma_1.prisma.appointment.create({
            data: {
                vehicleId,
                customerId,
                dtcCodes: dtcCodes.join(','),
                status: client_1.AppointmentStatus.PENDING,
                bookedBy: 'system',
                bookingLink: `${env_1.env.BASE_CLIENT_URL}/bookings/${fallbackId}`,
            },
        });
        return { bookingId: fallbackId, bookingLink: `${env_1.env.BASE_CLIENT_URL}/bookings/${fallbackId}` };
    }
}
//# sourceMappingURL=dtcNotificationService.js.map
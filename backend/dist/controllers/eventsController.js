"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeviceEvent = createDeviceEvent;
exports.getRecentEvents = getRecentEvents;
const zod_1 = require("zod");
const eventProcessor_1 = require("../services/eventProcessor");
const prisma_1 = require("../services/prisma");
const eventTypes = ['tripstart', 'gps', 'dtc', 'tripend'];
const eventSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().min(1),
    eventType: zod_1.z.enum(eventTypes),
    timestamp: zod_1.z.string().datetime(),
    payload: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).default({}),
});
async function createDeviceEvent(req, res) {
    try {
        const parsed = eventSchema.parse(req.body);
        const event = await (0, eventProcessor_1.ingestDeviceEvent)(parsed);
        res.status(201).json({ event });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Invalid payload', issues: error.issues });
        }
        console.error('Event ingestion failed', error);
        res.status(500).json({ message: 'Failed to ingest event' });
    }
}
async function getRecentEvents(req, res) {
    try {
        const limit = Number(req.query.limit ?? 10);
        const customerId = req.query.customerId;
        const query = {
            include: { vehicle: true },
            orderBy: { occurredAt: 'desc' },
            take: limit,
        };
        if (customerId) {
            query.where = { vehicle: { customerId } };
        }
        const events = await prisma_1.prisma.deviceEvent.findMany(query);
        res.json({ events });
    }
    catch (error) {
        console.error('Failed to fetch events', error);
        res.status(500).json({ message: 'Unable to load events' });
    }
}
//# sourceMappingURL=eventsController.js.map
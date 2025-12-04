import { DeviceEventPayload } from '../types/events';
export declare function ingestDeviceEvent(event: DeviceEventPayload): Promise<{
    id: string;
    createdAt: Date;
    eventType: import(".prisma/client").$Enums.EventType;
    payload: import("@prisma/client/runtime/library").JsonValue;
    occurredAt: Date;
    vehicleId: string;
}>;
//# sourceMappingURL=eventProcessor.d.ts.map
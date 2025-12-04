interface BookingPayload {
    vehicleId: string;
    customerId: string;
    dtcCodes: string[];
}
export declare function createBridgestoneBooking(payload: BookingPayload): Promise<{
    bookingId: string;
    deepLink?: string;
}>;
export {};
//# sourceMappingURL=bookingService.d.ts.map
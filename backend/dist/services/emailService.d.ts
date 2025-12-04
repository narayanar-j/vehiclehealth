type DtcEmailPayload = {
    adminEmail: string;
    customerName: string;
    vehicleLabel: string;
    vin: string;
    dtcCodes: {
        code: string;
        description?: string;
        severity?: string;
    }[];
    lastLocation?: {
        lat?: number;
        lng?: number;
        address?: string;
    };
    bookingLink: string;
};
export declare function sendDtcEmail(payload: DtcEmailPayload): Promise<void>;
export {};
//# sourceMappingURL=emailService.d.ts.map
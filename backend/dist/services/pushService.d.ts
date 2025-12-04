interface PushPayload {
    pushToken?: string | null;
    title: string;
    body: string;
    data?: Record<string, string>;
}
interface PushResult {
    delivered: boolean;
    detail?: string;
}
export declare function sendDriverPush({ pushToken, title, body, data }: PushPayload): Promise<PushResult>;
export {};
//# sourceMappingURL=pushService.d.ts.map
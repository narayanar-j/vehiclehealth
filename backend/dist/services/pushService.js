"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDriverPush = sendDriverPush;
const axios_1 = __importDefault(require("axios"));
// Placeholder push service. In production integrate with FCM/Expo/OneSignal.
async function sendDriverPush({ pushToken, title, body, data }) {
    if (!pushToken) {
        return { delivered: false, detail: 'No push token registered' };
    }
    try {
        await axios_1.default.post('https://example.com/push/send', {
            token: pushToken,
            title,
            body,
            data,
        });
        return { delivered: true };
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : 'Unknown push error';
        console.warn('Push notification failed', detail);
        return { delivered: false, detail };
    }
}
//# sourceMappingURL=pushService.js.map
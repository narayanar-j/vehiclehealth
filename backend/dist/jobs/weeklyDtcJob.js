"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleWeeklyDtcJob = scheduleWeeklyDtcJob;
const node_cron_1 = __importDefault(require("node-cron"));
const dtcNotificationService_1 = require("../services/dtcNotificationService");
function scheduleWeeklyDtcJob() {
    // Runs every 7 days at 06:00 server time
    node_cron_1.default.schedule('0 6 */7 * *', async () => {
        console.info('[Scheduler] Running weekly DTC notification job');
        await (0, dtcNotificationService_1.notifyOutstandingDtcCodes)();
    });
}
//# sourceMappingURL=weeklyDtcJob.js.map
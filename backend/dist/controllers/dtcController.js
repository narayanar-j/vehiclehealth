"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDtcJob = runDtcJob;
const dtcNotificationService_1 = require("../services/dtcNotificationService");
async function runDtcJob(req, res) {
    try {
        const result = await (0, dtcNotificationService_1.notifyOutstandingDtcCodes)();
        res.json(result);
    }
    catch (error) {
        console.error('Manual DTC job failed', error);
        res.status(500).json({ message: 'Failed to execute DTC notification job' });
    }
}
//# sourceMappingURL=dtcController.js.map
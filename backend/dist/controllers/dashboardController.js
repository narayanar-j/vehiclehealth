"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
const zod_1 = require("zod");
const dashboardService_1 = require("../services/dashboardService");
const paramsSchema = zod_1.z.object({ customerId: zod_1.z.string().min(1) });
async function getDashboard(req, res) {
    try {
        const { customerId } = paramsSchema.parse(req.params);
        const summary = await (0, dashboardService_1.getDashboardSummary)(customerId);
        res.json(summary);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Invalid customer id' });
        }
        console.error('Dashboard fetch failed', error);
        res.status(500).json({ message: 'Unable to load dashboard' });
    }
}
//# sourceMappingURL=dashboardController.js.map
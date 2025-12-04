"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const events_1 = __importDefault(require("./routes/events"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const dtc_1 = __importDefault(require("./routes/dtc"));
const weeklyDtcJob_1 = require("./jobs/weeklyDtcJob");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/events', events_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/dtc', dtc_1.default);
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Vehicle health backend listening on port ${port}`);
});
(0, weeklyDtcJob_1.scheduleWeeklyDtcJob)();
//# sourceMappingURL=index.js.map
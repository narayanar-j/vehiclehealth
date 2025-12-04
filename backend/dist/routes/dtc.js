"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dtcController_1 = require("../controllers/dtcController");
const router = (0, express_1.Router)();
router.post('/run-job', dtcController_1.runDtcJob);
exports.default = router;
//# sourceMappingURL=dtc.js.map
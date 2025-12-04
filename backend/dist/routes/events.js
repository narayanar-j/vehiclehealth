"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventsController_1 = require("../controllers/eventsController");
const router = (0, express_1.Router)();
router.post('/', eventsController_1.createDeviceEvent);
router.get('/', eventsController_1.getRecentEvents);
exports.default = router;
//# sourceMappingURL=events.js.map
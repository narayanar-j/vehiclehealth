"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBridgestoneBooking = createBridgestoneBooking;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
async function createBridgestoneBooking(payload) {
    const response = await axios_1.default.post(env_1.env.BRIDGESTONE_FIRESTORE_URL, payload, {
        timeout: 5000,
    });
    return response.data;
}
//# sourceMappingURL=bookingService.js.map
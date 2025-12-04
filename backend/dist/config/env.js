"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().min(1),
    MAIL_HOST: zod_1.z.string().min(1),
    MAIL_PORT: zod_1.z.coerce.number().default(587),
    MAIL_USER: zod_1.z.string().min(1),
    MAIL_PASS: zod_1.z.string().min(1),
    NOTIFICATIONS_FROM: zod_1.z.string().email(),
    BRIDGESTONE_FIRESTORE_URL: zod_1.z.string().url(),
    BASE_CLIENT_URL: zod_1.z.string().url(),
});
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDtcEmail = sendDtcEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.MAIL_HOST,
    port: env_1.env.MAIL_PORT,
    secure: env_1.env.MAIL_PORT === 465,
    auth: {
        user: env_1.env.MAIL_USER,
        pass: env_1.env.MAIL_PASS,
    },
});
async function sendDtcEmail(payload) {
    const { adminEmail, customerName, vehicleLabel, vin, dtcCodes, lastLocation, bookingLink } = payload;
    const dtcHtml = dtcCodes
        .map((dtc) => `
        <li>
          <strong>${dtc.code}</strong> - ${dtc.description ?? 'No description'}
          ${dtc.severity ? `<em>(Severity: ${dtc.severity})</em>` : ''}
        </li>`)
        .join('');
    const locationSection = lastLocation?.address
        ? `<p><strong>Last Known Location:</strong> ${lastLocation.address}</p>`
        : lastLocation
            ? `<p><strong>Last Known Location:</strong> ${lastLocation.lat}, ${lastLocation.lng}</p>`
            : '<p><strong>Last Known Location:</strong> Not available</p>';
    const html = `
    <h2>Vehicle Health Alert</h2>
    <p>Hello ${customerName} Admin,</p>
    <p>The vehicle <strong>${vehicleLabel}</strong> (VIN: ${vin}) has reported the following DTC codes:</p>
    <ul>${dtcHtml}</ul>
    ${locationSection}
    <p>
      Please <a href="${bookingLink}" target="_blank">book a Bridgestone service slot</a> to resolve the issue.
    </p>
  `;
    await transporter.sendMail({
        from: env_1.env.NOTIFICATIONS_FROM,
        to: adminEmail,
        subject: `Vehicle health alert for ${vehicleLabel}`,
        html,
    });
}
//# sourceMappingURL=emailService.js.map
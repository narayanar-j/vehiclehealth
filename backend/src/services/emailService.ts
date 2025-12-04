import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { env } from '../config/env';

type DtcEmailPayload = {
  adminEmail: string;
  customerName: string;
  vehicleLabel: string;
  vin: string;
  dtcCodes: { code: string; description?: string; severity?: string }[];
  lastLocation?: { lat?: number; lng?: number; address?: string };
  bookingLink: string;
};

const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: env.MAIL_PORT === 465,
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASS,
  },
} as SMTPTransport.Options);

export async function sendDtcEmail(payload: DtcEmailPayload) {
  const { adminEmail, customerName, vehicleLabel, vin, dtcCodes, lastLocation, bookingLink } = payload;

  const dtcHtml = dtcCodes
    .map(
      (dtc) => `
        <li>
          <strong>${dtc.code}</strong> - ${dtc.description ?? 'No description'}
          ${dtc.severity ? `<em>(Severity: ${dtc.severity})</em>` : ''}
        </li>`
    )
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
    from: env.NOTIFICATIONS_FROM,
    to: adminEmail,
    subject: `Vehicle health alert for ${vehicleLabel}`,
    html,
  });
}

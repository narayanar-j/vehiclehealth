import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  MAIL_HOST: z.string().min(1),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_USER: z.string().min(1),
  MAIL_PASS: z.string().min(1),
  NOTIFICATIONS_FROM: z.string().email(),
  BRIDGESTONE_FIRESTORE_URL: z.string().url(),
  BASE_CLIENT_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);

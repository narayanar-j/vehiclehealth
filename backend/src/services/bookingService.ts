import axios from 'axios';
import { env } from '../config/env';

interface BookingPayload {
  vehicleId: string;
  customerId: string;
  dtcCodes: string[];
}

export async function createBridgestoneBooking(payload: BookingPayload) {
  const response = await axios.post(env.BRIDGESTONE_FIRESTORE_URL, payload, {
    timeout: 5000,
  });
  return response.data as { bookingId: string; deepLink?: string };
}

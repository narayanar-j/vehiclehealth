import cron from 'node-cron';
import { notifyOutstandingDtcCodes } from '../services/dtcNotificationService';

export function scheduleWeeklyDtcJob() {
  // Runs every 7 days at 06:00 server time
  cron.schedule('0 6 */7 * *', async () => {
    console.info('[Scheduler] Running weekly DTC notification job');
    await notifyOutstandingDtcCodes();
  });
}

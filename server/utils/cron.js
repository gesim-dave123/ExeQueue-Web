import cron from 'node-cron';
import {
  closeActiveSession,
  createNewSession,
} from '../src/controllers/session.controller.js';
import DateAndTimeFormatter from './DateAndTimeFormatter.js';

// Run every day at 10 PM Manila time
cron.schedule(
  '0 22 * * *',
  async () => {
    const now = DateAndTimeFormatter.nowInTimeZone();
    console.log(
      `🕙 Running daily reset job at ${DateAndTimeFormatter.formatInTimeZone(
        now,
        'hh:mm a'
      )}`
    );

    try {
      await closeActiveSession();
      await createNewSession();
      console.log('✅ Daily queue session reset completed.');
    } catch (error) {
      console.error('❌ Failed to reset queue session:', error);
    }
  },
  {
    timezone: 'Asia/Manila',
  }
);

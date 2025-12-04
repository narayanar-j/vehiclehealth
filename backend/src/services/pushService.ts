import axios from 'axios';

interface PushPayload {
  pushToken?: string | null;
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface PushResult {
  delivered: boolean;
  detail?: string;
}

// Placeholder push service. In production integrate with FCM/Expo/OneSignal.
export async function sendDriverPush({ pushToken, title, body, data }: PushPayload): Promise<PushResult> {
  if (!pushToken) {
    return { delivered: false, detail: 'No push token registered' };
  }

  try {
    await axios.post('https://example.com/push/send', {
      token: pushToken,
      title,
      body,
      data,
    });
    return { delivered: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown push error';
    console.warn('Push notification failed', detail);
    return { delivered: false, detail };
  }
}

export type DeviceEventPayload = {
  vehicleId: string;
  eventType: 'tripstart' | 'gps' | 'dtc' | 'tripend';
  timestamp: string;
  payload: Record<string, any>;
};

export type DtcPayload = {
  code: string;
  description?: string;
  severity?: string;
};

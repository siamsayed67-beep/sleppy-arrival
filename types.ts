export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface TargetLocation extends GeoLocation {
  radius: number; // in meters
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  TRACKING = 'TRACKING',
  ALARM_TRIGGERED = 'ALARM_TRIGGERED',
}

export interface AlarmConfig {
  soundEnabled: boolean;
  aiMessageEnabled: boolean;
}

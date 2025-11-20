import { GeoLocation } from '../types';

/**
 * Calculates the distance between two points in meters using the Haversine formula.
 */
export const calculateDistance = (
  point1: GeoLocation,
  point2: GeoLocation
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
};

/**
 * Estimates travel time based on average speeds.
 * Walk: ~5 km/h (1.4 m/s)
 * Car: ~50 km/h (13.9 m/s) (Rough average)
 * Bus: ~25 km/h (6.9 m/s) (Including stops)
 */
export const estimateTravelTime = (distanceMeters: number) => {
  const SPEED_WALK = 1.4; 
  const SPEED_CAR = 13.9; 
  const SPEED_BUS = 6.9; 

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  };

  return {
    walk: formatDuration(distanceMeters / SPEED_WALK),
    car: formatDuration(distanceMeters / SPEED_CAR),
    bus: formatDuration(distanceMeters / SPEED_BUS),
  };
};